import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, bookings, users, services } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";
import { hasAdminAccess } from "@/lib/auth/admin";

function escapeHtml(str: string | number | null | undefined): string {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAuthSession();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "html";

    if (!session || !hasAdminAccess(session)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, Number(id)))
      .limit(1);

    if (!invoice) {
      return new Response("Invoice not found", { status: 404 });
    }

    if (invoice.issuerId !== session.id && invoice.recipientId !== session.id && !hasAdminAccess(session)) {
      return new Response("Forbidden", { status: 403 });
    }

    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, invoice.bookingId))
      .limit(1);

    const [issuer] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, invoice.issuerId))
      .limit(1);

    const [recipient] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, invoice.recipientId))
      .limit(1);

    let serviceName = "Service";
    if (booking?.serviceId) {
      const [svc] = await db
        .select({ name: services.name })
        .from(services)
        .where(eq(services.id, booking.serviceId))
        .limit(1);
      if (svc) serviceName = svc.name;
    }

    const lineItems = (invoice.lineItems as Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      amount: number;
    }>) || [];

    const issuedDate = invoice.issuedAt
      ? new Date(invoice.issuedAt).toLocaleDateString("en-MY", { year: "numeric", month: "long", day: "numeric" })
      : "—";

    const serviceDate = booking?.date
      ? new Date(booking.date).toLocaleDateString("en-MY", { year: "numeric", month: "long", day: "numeric" })
      : "—";

    const formatRM = (v: number) => `RM ${v.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const rowsHtml = lineItems
    .map(
      (item) => `  <tr>
  <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#374151;">${escapeHtml(item.description)}</td>
  <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#374151;text-align:center;">${escapeHtml(item.quantity)}</td>
  <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#374151;text-align:right;">${formatRM(item.unitPrice / 100)}</td>
  <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#374151;text-align:right;font-weight:600;">${formatRM(item.amount / 100)}</td>
  </tr>`,
    )
    .join("");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Invoice ${escapeHtml(invoice.invoiceNumber)}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; color: #111827; padding: 32px; }
.container { max-width: 700px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.header { background: linear-gradient(135deg, #f43f5e, #e11d48); padding: 32px 40px; }
.header h1 { color: #fff; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; }
.header p { color: rgba(255,255,255,0.8); font-size: 13px; margin-top: 4px; }
.meta { display: flex; justify-content: space-between; padding: 24px 40px; border-bottom: 1px solid #f3f4f6; }
.meta-group h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin-bottom: 6px; }
.meta-group p { font-size: 14px; color: #374151; line-height: 1.5; }
table { width: 100%; border-collapse: collapse; }
thead th { padding: 12px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
thead th:nth-child(2) { text-align: center; }
thead th:nth-child(3), thead th:nth-child(4) { text-align: right; }
.totals { padding: 16px 40px 32px; }
.totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: #6b7280; }
.totals-row.total { border-top: 2px solid #e5e7eb; padding-top: 12px; margin-top: 6px; font-size: 18px; font-weight: 700; color: #111827; }
.footer { background: #f9fafb; padding: 24px 40px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
.badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; }
.badge-issued { background: #dbeafe; color: #1d4ed8; }
.badge-paid { background: #dcfce7; color: #16a34a; }
@media print { body { padding: 0; background: #fff; } .container { box-shadow: none; } }
</style>
</head>
<body>
<div class="container">
<div class="header">
<h1>Leish!</h1>
<p>Beauty Booking Platform &mdash; Malaysia</p>
</div>
<div class="meta">
<div class="meta-group">
<h3>Invoice</h3>
<p>${escapeHtml(invoice.invoiceNumber)}</p>
<p style="margin-top:4px;">
<span class="badge ${invoice.status === "paid" ? "badge-paid" : "badge-issued"}">${escapeHtml(invoice.status === "paid" ? "Paid" : "Issued")}</span>
</p>
</div>
<div class="meta-group" style="text-align:right;">
<h3>Date Issued</h3>
<p>${escapeHtml(issuedDate)}</p>
<p style="margin-top:4px;"><strong>Service Date:</strong> ${escapeHtml(serviceDate)}</p>
</div>
</div>
<div class="meta">
<div class="meta-group">
<h3>From</h3>
<p>${escapeHtml(issuer?.name || "Leish!")}</p>
<p>${escapeHtml(issuer?.email || "")}</p>
</div>
<div class="meta-group" style="text-align:right;">
<h3>To</h3>
<p>${escapeHtml(recipient?.name || "Customer")}</p>
<p>${escapeHtml(recipient?.email || "")}</p>
</div>
</div>
<table>
<thead>
<tr>
<th>Description</th>
<th>Qty</th>
<th>Unit Price</th>
<th>Amount</th>
</tr>
</thead>
<tbody>
${rowsHtml}
</tbody>
</table>
<div class="totals">
<div class="totals-row">
<span>Subtotal</span>
<span>${formatRM(Number(invoice.subtotal))}</span>
</div>
<div class="totals-row">
<span>Platform Commission (${(Number(invoice.commissionRate) * 100).toFixed(0)}%)</span>
<span>-${formatRM(Number(invoice.commissionAmount))}</span>
</div>
<div class="totals-row total">
<span>Total</span>
<span>${formatRM(Number(invoice.total))}</span>
</div>
</div>
<div class="footer">
<p>Duta Integra Solutions (TR0325441-K) &bull; Leish! Beauty Booking Platform</p>
<p style="margin-top:4px;">Questions? Contact us at support@leish.my</p>
</div>
</div>
</body>
</html>`;

  if (format === "pdf") {
    const htmlPdfNode = (await import("html-pdf-node")).default;
    const pdfBuffer = await htmlPdfNode.generatePdf(
      { content: html },
      { format: "A4", printBackground: true },
    );
    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${escapeHtml(invoice.invoiceNumber)}.pdf"`,
      },
    });
  }

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="${escapeHtml(invoice.invoiceNumber)}.html"`,
    },
  });
  } catch (error) {
    console.error("Invoice download error:", error);
    return new Response("Failed to generate invoice", { status: 500 });
  }
}
