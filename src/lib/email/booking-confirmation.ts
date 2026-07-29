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
