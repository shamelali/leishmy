import { notificationEmailTemplate } from "./templates";

const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://leish.my";

export function waitlistWelcomeTemplate(params: { name: string }) {
  const { name } = params;
  const template = notificationEmailTemplate({
    name,
    title: "You're on the list! 🎉",
    body: `Thank you for joining the Leish! waitlist. We're building Malaysia's premier beauty booking platform and you're one of the first to know.<br><br>Here's what to expect:<br>• Early access when we launch on <strong>August 20, 2026</strong><br>• <strong>RM10 off</strong> your first booking<br>• Curated artist and studio recommendations<br><br>Stay tuned — we'll keep you updated as we get closer to launch. If you have any questions, reply to this email or reach out on WhatsApp at <a href="https://wa.me/601137633788">+60 11-3763 3788</a>.`,
    type: "Waitlist",
  });
  return template;
}