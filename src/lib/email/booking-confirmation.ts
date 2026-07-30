import { sendEmail } from "./brevo";
import { bookingConfirmationTemplate, providerNewBookingTemplate } from "./templates";
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
  });
  return sendEmail({
    to: params.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
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
}) {
  const subject = `Your quote is ready for booking #${params.bookingId}`;
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
        <p><strong>Service Price:</strong> MYR ${params.servicePrice}</p>
        <p><strong>Accommodation Fee:</strong> MYR ${params.accommodationFee}</p>
        <p><strong>Travel Fee:</strong> MYR ${params.travelFee}</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
        <p style="font-size: 1.2em; font-weight: bold;"><strong>Total: MYR ${params.totalPrice}</strong></p>
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
