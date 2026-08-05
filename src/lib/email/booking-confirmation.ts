import { sendEmail } from "./brevo";
import { bookingConfirmationTemplate, providerNewBookingTemplate, bookingCompletedTemplate } from "./templates";
import { getEmailAlias } from "@/lib/constants";

export async function sendBookingReceivedEmail(params: {
  email: string;
  customerName: string;
  bookingId: string;
  serviceName: string;
  providerName: string;
  date: string;
  time: string;
  amount: number;
  paymentType: "full" | "deposit";
  travelSurcharge?: number;
  accommodationFee?: number;
}) {
  const template = bookingConfirmationTemplate({
    customerName: params.customerName,
    bookingId: params.bookingId,
    serviceName: params.serviceName,
    providerName: params.providerName,
    date: params.date,
    time: params.time,
    amount: params.amount,
    paymentType: params.paymentType,
    travelSurcharge: params.travelSurcharge,
    accommodationFee: params.accommodationFee,
  });
  return sendEmail({
    to: params.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    from: getEmailAlias("notifications"),
  });
}

export async function sendProviderNewBookingEmail(params: {
  email: string;
  providerName: string;
  customerName: string;
  bookingId: string;
  serviceName: string;
  date: string;
  time: string;
  travelSurcharge?: number;
  accommodationFee?: number;
  totalPrice?: number;
  depositAmount?: number;
  depositPercent?: number;
}) {
  const template = providerNewBookingTemplate({
    providerName: params.providerName,
    customerName: params.customerName,
    bookingId: params.bookingId,
    serviceName: params.serviceName,
    date: params.date,
    time: params.time,
    travelSurcharge: params.travelSurcharge,
    accommodationFee: params.accommodationFee,
    totalPrice: params.totalPrice,
    depositAmount: params.depositAmount,
    depositPercent: params.depositPercent,
  });
  return sendEmail({
    to: params.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    from: getEmailAlias("notifications"),
  });
}

export async function sendQuoteRejectedEmail(params: {
  email: string;
  customerName: string;
  bookingId: string;
  serviceName: string;
  providerName: string;
  date: string;
  time: string;
}) {
  const subject = `Quote Rejected — Booking #${params.bookingId}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Quote Rejected</h2>
      <p>Hi ${params.customerName},</p>
      <p>You have rejected the quote for your booking with <strong>${params.providerName}</strong>.</p>
      <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Booking Details</h3>
        <p><strong>Service:</strong> ${params.serviceName}</p>
        <p><strong>Date:</strong> ${params.date}</p>
        <p><strong>Time:</strong> ${params.time}</p>
      </div>
      <p>If you'd like to proceed, you can request a new quote from the provider.</p>
      <p><a href="${process.env.NEXT_PUBLIC_URL || 'https://leish.my'}/bookings/${params.bookingId}" style="display: inline-block; background: #e91e63; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none;">View Booking</a></p>
    </div>
  `;
  return sendEmail({
    to: params.email,
    subject,
    html,
    text: `You have rejected the quote for booking #${params.bookingId}. Service: ${params.serviceName} on ${params.date} at ${params.time}.`,
    from: getEmailAlias("notifications"),
  });
}

export async function sendRemainingPaymentReminderEmail(params: {
  email: string;
  customerName: string;
  bookingId: string;
  serviceName: string;
  providerName: string;
  date: string;
  time: string;
  remainingAmount: number;
  dueDate: string;
  paymentUrl: string;
}) {
  const subject = `Payment Due for Booking #${params.bookingId}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Payment Reminder</h2>
      <p>Hi ${params.customerName},</p>
      <p>Your booking with <strong>${params.providerName}</strong> is coming up, and the remaining balance is now due.</p>
      <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Booking Details</h3>
        <p><strong>Service:</strong> ${params.serviceName}</p>
        <p><strong>Date:</strong> ${params.date}</p>
        <p><strong>Time:</strong> ${params.time}</p>
        <p><strong>Provider:</strong> ${params.providerName}</p>
      </div>
      <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Remaining Balance:</strong> MYR ${params.remainingAmount.toFixed(2)}</p>
        <p><strong>Due Date:</strong> ${params.dueDate}</p>
      </div>
      <p>Please complete the payment to confirm your appointment.</p>
      <p><a href="${params.paymentUrl}" style="display: inline-block; background: #e91e63; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none;">Pay Now</a></p>
      <p style="color: #666; font-size: 12px; margin-top: 20px;">If you have any questions, please contact us at hello@leish.my</p>
    </div>
  `;
  return sendEmail({
    to: params.email,
    subject,
    html,
    text: `Payment due for booking #${params.bookingId}. Remaining balance: MYR ${params.remainingAmount.toFixed(2)}. Due by ${params.dueDate}. Pay here: ${params.paymentUrl}`,
    from: getEmailAlias("notifications"),
  });
}

export async function sendQuoteReadyEmail(params: {
  email: string;
  customerName: string;
  bookingId: string;
  serviceName: string;
  providerName: string;
  date: string;
  time: string;
  servicePrice: number;
  accommodationFee: number;
  travelFee: number;
  totalPrice: number;
  depositAmount?: number;
  discountAmount?: number;
  discountReason?: string;
  extras?: Array<{ name: string; price: number }>;
  packageName?: string;
  depositPercent?: number;
}) {
  const subject = `Your quote is ready for booking #${params.bookingId}`;
  const extrasHtml = params.extras && params.extras.length > 0
    ? params.extras.map((e) => `<tr><td style="padding:4px 0;">${e.name}</td><td style="padding:4px 0;text-align:right;">MYR ${e.price.toFixed(2)}</td></tr>`).join("")
    : "";
  const discountHtml = params.discountAmount && params.discountAmount > 0
    ? `<tr><td style="padding:4px 0;color:#2e7d32;">Discount${params.discountReason ? ` (${params.discountReason})` : ""}</td><td style="padding:4px 0;text-align:right;color:#2e7d32;">-MYR ${params.discountAmount.toFixed(2)}</td></tr>`
    : "";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Your Quote is Ready</h2>
      <p>Hi ${params.customerName},</p>
      <p>The MUA has prepared a quote for your booking request.</p>
      <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Booking Details</h3>
        <p><strong>Service:</strong> ${params.serviceName}</p>
        <p><strong>Date:</strong> ${params.date}</p>
        <p><strong>Time:</strong> ${params.time}</p>
        <p><strong>Provider:</strong> ${params.providerName}</p>
      </div>
      <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Quote Summary</h3>
        ${params.packageName ? `<p><strong>Package:</strong> ${params.packageName}</p>` : ""}
        <p><strong>Service Price:</strong> MYR ${params.servicePrice.toFixed(2)}</p>
        <p><strong>Accommodation Fee:</strong> MYR ${params.accommodationFee.toFixed(2)}</p>
        <p><strong>Travel Fee:</strong> MYR ${params.travelFee.toFixed(2)}</p>
        ${extrasHtml ? `<hr style="border: none; border-top: 1px solid #ddd; margin: 10px 0;"><p><strong>Extras:</strong></p><table style="width:100%;"><tbody>${extrasHtml}</tbody></table>` : ""}
        ${discountHtml}
        <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
        <p style="font-size: 1.2em; font-weight: bold;"><strong>Total: MYR ${params.totalPrice.toFixed(2)}</strong></p>
        <p><strong>Deposit (${params.depositPercent || 30}%):</strong> MYR ${(params.depositAmount || 0).toFixed(2)}</p>
      </div>
      <p>Log in to your account to <strong>Accept</strong> or <strong>Reject</strong> this quote.</p>
      <p><a href="${process.env.NEXT_PUBLIC_URL || 'https://leish.my'}/bookings/${params.bookingId}" style="display: inline-block; background: #e91e63; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none;">View Quote</a></p>
    </div>
  `;
  return sendEmail({
    to: params.email,
    subject,
    html,
    text: `Your quote for booking #${params.bookingId} is ready. Total: MYR ${params.totalPrice}`,
    from: getEmailAlias("notifications"),
  });
}

export async function sendBookingCompletedEmail(params: {
  email: string;
  customerName: string;
  bookingId: string;
  serviceName: string;
  providerName: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://leish.my";
  const reviewUrl = `${baseUrl}/bookings/${params.bookingId}#review`;
  const template = bookingCompletedTemplate({
    customerName: params.customerName,
    bookingId: params.bookingId,
    serviceName: params.serviceName,
    providerName: params.providerName,
    reviewUrl,
  });
  return sendEmail({
    to: params.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    from: getEmailAlias("notifications"),
  });
}
