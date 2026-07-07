import { sendEmail } from "./brevo";
import { subscriptionCanceledTemplate } from "./templates";

export async function sendSubscriptionCanceledEmail(params: {
  email: string;
  customerName: string;
  planName: string;
  cancelDate: string;
}) {
  const { subject, html, text } = subscriptionCanceledTemplate({
    customerName: params.customerName,
    planName: params.planName,
    cancelDate: params.cancelDate,
  });

  await sendEmail({
    to: params.email,
    subject,
    html,
    text,
  });
}
