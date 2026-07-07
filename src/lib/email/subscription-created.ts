import { sendEmail } from "./brevo";
import { subscriptionCreatedTemplate } from "./templates";

export async function sendSubscriptionCreatedEmail(params: {
  email: string;
  customerName: string;
  planName: string;
  amount: number;
}) {
  const { subject, html, text } = subscriptionCreatedTemplate({
    customerName: params.customerName,
    planName: params.planName,
    amount: params.amount,
  });

  await sendEmail({
    to: params.email,
    subject,
    html,
    text,
  });
}
