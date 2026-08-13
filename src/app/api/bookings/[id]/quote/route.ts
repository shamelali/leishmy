import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, users, profiles, servicePackages, notifications, quoteOptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";
import { addQuoteSchema } from "@/lib/validations/bookings";
import { sendQuoteReadyEmail } from "@/lib/email";
import { rateLimitApi } from "@/lib/rate-limit-api";
import {
  AppError,
  correlationIdFrom,
  logCaught,
  withSerializableTransaction,
  withTimeout,
} from "@/lib/db-utils";
import {
  clampDepositPercent,
  depositCentsFromTotal,
  fromCents,
  myrString,
  toCents,
} from "@/lib/money";

export const runtime = "nodejs";

const NOTIFY_TIMEOUT_MS = 5_000;

function jsonWithCorrelation(correlationId: string, body: unknown, status = 200) {
  const res = NextResponse.json(body, { status });
  res.headers.set("x-correlation-id", correlationId);
  return res;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const correlationId = correlationIdFrom(request);
  const limited = await rateLimitApi(request, { max: 20, window: 60 });
  if (limited) {
    limited.headers.set("x-correlation-id", correlationId);
    return limited;
  }

  try {
    const session = await getAuthSession();
    if (!session) {
      return jsonWithCorrelation(correlationId, { error: "Unauthorized" }, 401);
    }

    const { id } = await params;
    const bookingId = Number(id);
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return jsonWithCorrelation(correlationId, { error: "Invalid booking id" }, 400);
    }

    const body = await request.json();
    const parsed = addQuoteSchema.safeParse(body);
    if (!parsed.success) {
      return jsonWithCorrelation(
        correlationId,
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        400,
      );
    }

    const {
      servicePrice,
      accommodationFee,
      travelFee,
      discount,
      discountReason,
      extras,
      packageId,
      packageName,
      depositPercent,
      notes,
    } = parsed.data;

    const updated = await withSerializableTransaction(async (tx) => {
      const [booking] = await tx
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .for("update")
        .limit(1);

      if (!booking) {
        throw new AppError(404, "Booking not found");
      }

      if (booking.status !== "quote_pending") {
        throw new AppError(400, "Booking is not awaiting a quote");
      }

      if (booking.artistId) {
        const [profile] = await tx
          .select({ userId: profiles.userId })
          .from(profiles)
          .where(and(eq(profiles.userId, booking.artistId), eq(profiles.role, "artist")))
          .limit(1);
        if (!profile || profile.userId !== session.id) {
          throw new AppError(403, "Forbidden");
        }
      } else if (booking.studioId) {
        const [profile] = await tx
          .select({ userId: profiles.userId })
          .from(profiles)
          .where(and(eq(profiles.userId, booking.studioId), eq(profiles.role, "studio")))
          .limit(1);
        if (!profile || profile.userId !== session.id) {
          throw new AppError(403, "Forbidden");
        }
      } else {
        throw new AppError(403, "Forbidden");
      }

      let resolvedPackageName = packageName || null;
      if (packageId && !packageName) {
        const [pkg] = await tx
          .select({ name: servicePackages.name })
          .from(servicePackages)
          .where(eq(servicePackages.id, packageId))
          .limit(1);
        resolvedPackageName = pkg?.name || null;
      }

      const extrasCents = (extras ?? []).reduce((sum, extra) => sum + toCents(extra.price), 0);
      const serviceCents = toCents(servicePrice);
      const accommodationCents = toCents(accommodationFee || 0);
      const travelCents = toCents(travelFee || 0);
      const grossCents = serviceCents + accommodationCents + travelCents + extrasCents;
      const discountCents = Math.min(toCents(discount || 0), Math.round(grossCents * 0.5));
      const totalCents = Math.max(0, grossCents - discountCents);
      const depositPercentNum = clampDepositPercent(depositPercent);
      const depositAmountCents = depositCentsFromTotal(totalCents, depositPercentNum);
      const quoteId = `quote_${bookingId}_${Date.now()}`;

      const [option] = await tx
        .insert(quoteOptions)
        .values({
          bookingId,
          name: resolvedPackageName || "Custom quote",
          servicePrice: myrString(serviceCents),
          travelFee: myrString(travelCents),
          accommodationFee: myrString(accommodationCents),
          discount: myrString(discountCents),
          discountReason: discountReason || null,
          extras: extras && extras.length > 0 ? extras : [],
          selected: true,
          selectedAt: new Date(),
        })
        .returning({ id: quoteOptions.id });

      const [row] = await tx
        .update(bookings)
        .set({
          amount: myrString(totalCents),
          depositAmount: myrString(depositAmountCents),
          servicePrice: myrString(serviceCents),
          accommodationFee: myrString(accommodationCents),
          travelSurcharge: myrString(travelCents),
          discount: myrString(discountCents),
          discountReason: discountReason || null,
          extras: extras && extras.length > 0 ? extras : undefined,
          packageName: resolvedPackageName,
          depositPercent: depositPercentNum,
          selectedQuoteOptionId: option?.id ?? packageId ?? null,
          notes: notes || null,
          status: "quote_sent",
          milestone: `deposit_${depositPercentNum}`,
          quoteId,
          quoteSentAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(eq(bookings.id, bookingId), eq(bookings.status, "quote_pending")))
        .returning();

      if (!row) {
        throw new AppError(409, "Booking is not awaiting a quote");
      }

      return {
        booking,
        updated: row,
        extrasTotal: fromCents(extrasCents),
        discountAmount: fromCents(discountCents),
        totalPrice: fromCents(totalCents),
        depositAmount: fromCents(depositAmountCents),
        depositPercentNum,
        resolvedPackageName,
        servicePriceMyr: fromCents(serviceCents),
        accommodationMyr: fromCents(accommodationCents),
        travelMyr: fromCents(travelCents),
      };
    }, { correlationId });

    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, updated.booking.userId))
      .limit(1);

    if (user?.id) {
      await withTimeout(
        db.insert(notifications).values({
          userId: user.id,
          type: "quote_ready",
          title: "Your Quote is Ready",
          body: `Your quote for "${updated.booking.service}" is ready. Review and accept to proceed with booking.`,
          data: { link: `/bookings/${updated.booking.id}`, bookingId: String(updated.booking.id) },
        }),
        NOTIFY_TIMEOUT_MS,
        "quote_ready",
        correlationId,
      );
    }

    if (user?.email) {
      let providerName = "Your Provider";
      if (updated.booking.artistId) {
        const [artistUser] = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, updated.booking.artistId))
          .limit(1);
        providerName = artistUser?.name || providerName;
      } else if (updated.booking.studioId) {
        const [studioUser] = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, updated.booking.studioId))
          .limit(1);
        providerName = studioUser?.name || providerName;
      }

      void withTimeout(
        sendQuoteReadyEmail({
          email: user.email,
          customerName: user.name || "Valued Customer",
          bookingId: String(updated.booking.id),
          serviceName: updated.booking.service || "Service",
          providerName,
          date: new Date(updated.booking.date).toLocaleDateString("en-MY", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          }),
          time: updated.booking.time || "To be confirmed",
          servicePrice: updated.servicePriceMyr,
          accommodationFee: updated.accommodationMyr,
          travelFee: updated.travelMyr,
          totalPrice: updated.totalPrice,
          depositAmount: updated.depositAmount,
          discountAmount: updated.discountAmount,
          discountReason: discountReason || undefined,
          extras: extras && extras.length > 0 ? extras : undefined,
          packageName: updated.resolvedPackageName || undefined,
          depositPercent: updated.depositPercentNum,
        }),
        NOTIFY_TIMEOUT_MS,
        "email_quote_ready",
        correlationId,
      );
    }

    revalidatePath("/bookings");
    revalidatePath("/dashboard/artist");

    return jsonWithCorrelation(correlationId, { success: true, booking: updated.updated });
  } catch (error) {
    if (error instanceof AppError) {
      return jsonWithCorrelation(correlationId, { error: error.message }, error.status);
    }
    logCaught("bookings.quote", error, { correlationId });
    return jsonWithCorrelation(correlationId, { error: "Failed to add quote" }, 500);
  }
}
