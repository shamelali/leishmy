import { notificationEmailTemplate } from "./templates";

const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://leish.my";

export function launchReminderTemplate(params: { name: string }) {
  const { name } = params;
  const template = notificationEmailTemplate({
    name,
    title: "It's almost here — get early access",
    body: `Hi ${name},<br><br>Leish! launches in just <strong>2 days</strong> — August 20, 2026.<br><br>As a waitlist member, you'll get:<br>• <strong>RM10 off</strong> your first booking<br>• Priority access to top artists and studios<br>• Early features before anyone else<br><br>Mark your calendar and get ready. We can't wait for you to experience Leish!<br><br><a href="${SITE_URL}/launch">Join the waitlist</a>`,
    type: "Launch",
  });
  return template;
}