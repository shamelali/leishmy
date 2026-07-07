import { sendEmail } from "./brevo";
import { paymentReceiptTemplate } from "./templates";
import { getEmailAlias } from "@/lib/constants";

export async function sendPaymentReceiptEmail(params: {
  email: string;
  customerName: string;
  bookingId: string;
  amount: number;
  paymentMethod: string;
  date: string;
}) {
  const template = paymentReceiptTemplate({
    customerName: params.customerName,
    bookingId: params.bookingId,
    amount: params.amount,
    paymentMethod: params.paymentMethod,
    date: params.date,
  });
  return sendEmail({
    to: params.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    from: getEmailAlias("billing"),
  });
}
