import "server-only";
import { sendEmail } from "./brevo";
import { payoutNotificationTemplate } from "./templates";

export async function sendPayoutNotificationEmail(params: {
  email: string;
  name: string;
  amount: number;
  date: string;
}) {
  const { subject, html, text } = payoutNotificationTemplate(params);

  const result = await sendEmail({
    to: params.email,
    subject,
    html,
    text,
  });

  if (!result.success) {
    console.error("sendPayoutNotificationEmail failed:", result.error);
  }

  return result;
}
