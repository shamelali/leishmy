import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, users, profiles, servicePackages, notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";
import { addQuoteSchema } from "@/lib/validations/bookings";
import { sendQuoteReadyEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const bookingId = Number(id);

    const body = await request.json();
    const parsed = addQuoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
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

    // Verify booking exists and is in quote_pending status
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "quote_pending") {
      return NextResponse.json(
        { error: "Booking is not awaiting a quote" },
        { status: 400 },
      );
    }

    // Verify MUA owns this booking
    if (booking.artistId) {
      const [profile] = await db
        .select({ userId: profiles.userId })
        .from(profiles)
        .where(and(eq(profiles.userId, booking.artistId), eq(profiles.role, "artist")))
        .limit(1);
      if (!profile || profile.userId !== session.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (booking.studioId) {
      const [profile] = await db
        .select({ userId: profiles.userId })
        .from(profiles)
        .where(and(eq(profiles.userId, booking.studioId), eq(profiles.role, "studio")))
        .limit(1);
      if (!profile || profile.userId !== session.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Resolve package name from packageId if not provided
    let resolvedPackageName = packageName || null;
    if (packageId && !packageName) {
      const [pkg] = await db
        .select({ name: servicePackages.name })
        .from(servicePackages)
        .where(eq(servicePackages.id, packageId))
        .limit(1);
      resolvedPackageName = pkg?.name || null;
    }

    const extrasTotal = extras?.reduce((sum, e) => sum + e.price, 0) || 0;
    const discountAmount = Math.min(discount || 0, (servicePrice + (accommodationFee || 0) + (travelFee || 0) + extrasTotal) * 0.5);
    const totalPrice = servicePrice + (accommodationFee || 0) + (travelFee || 0) + extrasTotal - discountAmount;
    const depositPercentNum = Math.min(100, Math.max(10, depositPercent || 30));
    const depositAmount = Math.round(totalPrice * (depositPercentNum / 100) * 100) / 100;

    const quoteId = `quote_${bookingId}_${Date.now()}`;

    // Update booking with quote
    const [updated] = await db
      .update(bookings)
      .set({
        amount: String(totalPrice),
        depositAmount: String(depositAmount),
        servicePrice: String(servicePrice),
        accommodationFee: String(accommodationFee || 0),
        travelSurcharge: String(travelFee || 0),
        discount: String(discountAmount),
        discountReason: discountReason || null,
        extras: extras && extras.length > 0 ? extras : undefined,
        packageName: resolvedPackageName,
        depositPercent: depositPercentNum,
        selectedQuoteOptionId: packageId || null,
        notes: notes || null,
        status: "quote_sent",
        milestone: `deposit_${depositPercentNum}`,
        quoteId,
        quoteSentAt: new Date(),
      })
      .where(eq(bookings.id, bookingId))
      .returning();

    // Notify customer
    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, booking.userId))
      .limit(1);

    if (user?.id) {
      await db.insert(notifications).values({
        userId: user.id,
        type: "quote_ready",
        title: "Your Quote is Ready",
        body: `Your quote for "${booking.service}" is ready. Review and accept to proceed with booking.`,
        data: { link: `/bookings/${booking.id}`, bookingId: String(booking.id) },
      }).catch(() => {});
    }

    // Email customer
    if (user?.email) {
      let providerName = "Your Provider";
      if (booking.artistId) {
        const [artistUser] = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, booking.artistId))
          .limit(1);
        providerName = artistUser?.name || providerName;
      } else if (booking.studioId) {
        const [studioUser] = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, booking.studioId))
          .limit(1);
        providerName = studioUser?.name || providerName;
      }

      sendQuoteReadyEmail({
        email: user.email,
        customerName: user.name || "Valued Customer",
        bookingId: String(booking.id),
        serviceName: booking.service || "Service",
        providerName,
        date: new Date(booking.date).toLocaleDateString("en-MY", {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
        }),
        time: booking.time || "To be confirmed",
        servicePrice,
        accommodationFee: accommodationFee || 0,
        travelFee: travelFee || 0,
        totalPrice,
        depositAmount,
        discountAmount: discountAmount,
        discountReason: discountReason || undefined,
        extras: extras && extras.length > 0 ? extras : undefined,
        packageName: resolvedPackageName || undefined,
        depositPercent: depositPercentNum,
      }).catch((err) => console.error("sendQuoteReadyEmail failed:", err));
    }

    revalidatePath("/bookings");
    revalidatePath("/dashboard/artist");

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error("Add quote error:", error);
    return NextResponse.json(
      { error: "Failed to add quote" },
      { status: 500 }
    );
  }
}
