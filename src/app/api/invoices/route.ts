import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, bookings, users, services, quoteOptions } from "@/db/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";

async function generateInvoiceNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const [last] = await db
    .select({ invoiceNumber: invoices.invoiceNumber })
    .from(invoices)
    .where(eq(invoices.invoiceNumber, `INV-${year}${month}-000000`))
    .orderBy(desc(invoices.id))
    .limit(1);

  let seq = 1;
  if (last) {
    const match = last.invoiceNumber.match(/-(\d{6})$/);
    if (match) seq = parseInt(match[1], 10) + 1;
  }
  return `INV-${year}${month}-${String(seq).padStart(6, "0")}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("id");
    const bookingId = searchParams.get("bookingId");

    if (invoiceId) {
      const [invoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, Number(invoiceId)))
        .limit(1);

      if (!invoice) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }

      if (invoice.issuerId !== session.id && invoice.recipientId !== session.id && !session.isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      return NextResponse.json({ invoice });
    }

    if (bookingId) {
      const [invoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.bookingId, Number(bookingId)))
        .limit(1);
      return NextResponse.json({ invoice: invoice || null });
    }

    const invoiceList = await db
      .select()
      .from(invoices)
      .where(
        session.isAdmin
          ? undefined
          : or(
              eq(invoices.issuerId, session.id),
              eq(invoices.recipientId, session.id),
            ),
      )
      .orderBy(desc(invoices.createdAt))
      .limit(50);

    return NextResponse.json({ invoices: invoiceList });
  } catch (error) {
    console.error("Invoices fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.bookingId, Number(bookingId)))
      .limit(1);

    if (existing) {
      return NextResponse.json({ invoice: existing });
    }

    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, Number(bookingId)))
      .limit(1);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const providerId = booking.artistId || booking.studioId;
    if (!providerId) {
      return NextResponse.json({ error: "No provider on booking" }, { status: 400 });
    }

    const [provider] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, providerId))
      .limit(1);

    let serviceName = booking.service || "Service";
    if (booking.serviceId) {
      const [svc] = await db
        .select({ name: services.name })
        .from(services)
        .where(eq(services.id, booking.serviceId))
        .limit(1);
      if (svc) serviceName = svc.name;
    }

    const subtotal = Number(booking.amount) || 0;
    const commissionRate = 0.08;
    const commissionAmount = Math.round(subtotal * commissionRate);
    const total = subtotal;
    const invoiceNumber = await generateInvoiceNumber();

    const lineItems = [
      {
        description: serviceName,
        quantity: 1,
        unitPrice: subtotal,
        amount: subtotal,
      },
    ];

    if (booking.travelSurcharge && Number(booking.travelSurcharge) > 0) {
      lineItems.push({
        description: "Travel surcharge",
        quantity: 1,
        unitPrice: Number(booking.travelSurcharge),
        amount: Number(booking.travelSurcharge),
      });
    }

    if (booking.accommodationFee && Number(booking.accommodationFee) > 0) {
      lineItems.push({
        description: "Accommodation fee",
        quantity: 1,
        unitPrice: Number(booking.accommodationFee),
        amount: Number(booking.accommodationFee),
      });
    }

    const [invoice] = await db
      .insert(invoices)
      .values({
        invoiceNumber,
        bookingId: Number(bookingId),
        issuerId: providerId,
        recipientId: booking.userId,
        subtotal: String(subtotal / 100),
        commissionAmount: String(commissionAmount / 100),
        commissionRate: String(commissionRate),
        total: String(total / 100),
        status: "issued",
        lineItems,
        issuedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("Invoice creation error:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
