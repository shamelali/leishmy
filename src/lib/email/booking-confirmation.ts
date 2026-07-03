import { sendEmail } from "./brevo";
import { bookingConfirmationTemplate, providerNewBookingTemplate } from "./templates";

export async function sendBookingConfirmationEmail(params: {
  email: string;
  customerName: string;
  bookingId: string;
  serviceName: string;
  providerName: string;
  date: string;
  time: string;
  amount: number;
  paymentType: "full" | "deposit";
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
  });
  return sendEmail({
    to: params.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
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
}) {
  const template = providerNewBookingTemplate({
    providerName: params.providerName,
    customerName: params.customerName,
    bookingId: params.bookingId,
    serviceName: params.serviceName,
    date: params.date,
    time: params.time,
  });
  return sendEmail({
    to: params.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}
