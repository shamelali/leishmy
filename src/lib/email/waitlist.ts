import { sendEmail, hasBrevoKey } from "./brevo";
import { waitlistWelcomeTemplate } from "./waitlist-welcome";
import { behindTheScenesTemplate } from "./behind-the-scenes";
import { launchReminderTemplate } from "./launch-reminder";

export async function sendWaitlistWelcomeEmail(params: { email: string; name: string }) {
  if (!hasBrevoKey()) return { success: false, error: "Brevo not configured" };
  const template = waitlistWelcomeTemplate(params);
  return sendEmail({
    to: params.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function sendBehindTheScenesEmail(params: { email: string; name: string }) {
  if (!hasBrevoKey()) return { success: false, error: "Brevo not configured" };
  const template = behindTheScenesTemplate(params);
  return sendEmail({
    to: params.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function sendLaunchReminderEmail(params: { email: string; name: string }) {
  if (!hasBrevoKey()) return { success: false, error: "Brevo not configured" };
  const template = launchReminderTemplate(params);
  return sendEmail({
    to: params.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}