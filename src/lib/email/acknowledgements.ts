import { sendEmail, hasBrevoKey } from "./brevo";
import { notificationEmailTemplate } from "./templates";

const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://leish.my";

// 1. Contact form auto-ack to submitter
export async function sendContactAckEmail(params: {
  email: string;
  name: string;
}) {
  if (!hasBrevoKey()) return { success: false, error: "Brevo not configured" };
  const template = notificationEmailTemplate({
    name: params.name,
    title: "We received your message",
    body: `Thank you for reaching out to Leish. Our team typically responds within 24–48 hours. If your matter is urgent, message us on WhatsApp at <a href="https://wa.me/601137633788">+60 11-3763 3788</a>.`,
    type: "Support",
  });
  return sendEmail({
    to: params.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

// 2. Inquiry confirmation to client
export async function sendInquiryAckEmail(params: {
  email: string;
  name: string;
  artistName: string;
}) {
  if (!hasBrevoKey()) return { success: false, error: "Brevo not configured" };
  const template = notificationEmailTemplate({
    name: params.name,
    title: "Your inquiry has been sent",
    body: `Your inquiry has been forwarded to <strong>${params.artistName}</strong>. They typically respond within 24–48 hours. In the meantime, feel free to <a href="${SITE_URL}/artists">browse more artists</a> on Leish.`,
    type: "Inquiry",
  });
  return sendEmail({
    to: params.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

// 3. Artist onboarding submitted — email to artist
export async function sendArtistOnboardingSubmittedEmail(params: {
  email: string;
  name: string;
}) {
  if (!hasBrevoKey()) return { success: false, error: "Brevo not configured" };
  const template = notificationEmailTemplate({
    name: params.name,
    title: "Application submitted — under review",
    body: `Thank you for applying to join Leish as a beauty professional. Our team will review your portfolio and get back to you within 3–5 business days. You can check your status anytime in your <a href="${SITE_URL}/artist-onboarding/create">onboarding dashboard</a>.`,
    type: "Onboarding",
  });
  return sendEmail({
    to: params.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

// 4. Admin notification — new artist awaiting verification
export async function sendAdminNewArtistNotification(params: {
  adminEmails: string[];
  artistName: string;
  artistEmail: string;
}) {
  if (!hasBrevoKey()) return { success: false, error: "Brevo not configured" };
  if (params.adminEmails.length === 0) return { success: true };
  const template = notificationEmailTemplate({
    name: "Admin",
    title: "New artist awaiting verification",
    body: `<strong>${params.artistName}</strong> (${params.artistEmail}) has submitted their artist profile for review. <a href="${SITE_URL}/dashboard/admin/people">Review in dashboard</a>.`,
    type: "Onboarding",
  });
  return sendEmail({
    to: params.adminEmails,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

// 5. Lead follow-up email to client
export async function sendLeadFollowUpEmail(params: {
  email: string;
  name: string;
  artistName: string;
}) {
  if (!hasBrevoKey()) return { success: false, error: "Brevo not configured" };
  const template = notificationEmailTemplate({
    name: params.name,
    title: "Still interested in booking?",
    body: `Hi ${params.name}, you sent an inquiry to <strong>${params.artistName}</strong> a few days ago. We'd love to help you book your next look. <a href="${SITE_URL}/artists">Browse artists</a> or reply to this email with any questions.`,
    type: "Follow-up",
  });
  return sendEmail({
    to: params.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

// 6. Inbound email auto-ack (per-alias)
export async function sendInboundAckEmail(params: {
  to: string;
  from: string;
  aliasLabel: string;
}) {
  if (!hasBrevoKey()) return { success: false, error: "Brevo not configured" };
  const templates: Record<string, { title: string; body: string }> = {
    support: {
      title: "We received your email",
      body: `Thank you for contacting Leish support. Our team typically responds within 24–48 hours. For urgent matters, message us on WhatsApp at <a href="https://wa.me/601137633788">+60 11-3763 3788</a>.`,
    },
    billing: {
      title: "We received your billing inquiry",
      body: `Thank you for your billing inquiry. Our finance team will review and respond within 2–3 business days.`,
    },
    info: {
      title: "We received your email",
      body: `Thank you for reaching out to Leish. We'll get back to you shortly.`,
    },
    artist: {
      title: "We received your message",
      body: `Thank you for your interest in Leish. Our artist relations team will respond within 2–3 business days. In the meantime, visit <a href="${SITE_URL}/artist-onboarding/create">our onboarding page</a> for more info.`,
    },
  };
  const fallback = {
    title: "We received your email",
    body: `Thank you for reaching out to Leish. We'll get back to you shortly.`,
  };
  const pick = templates[params.aliasLabel] || fallback;
  const template = notificationEmailTemplate({
    name: params.from.split("@")[0],
    title: pick.title,
    body: pick.body,
    type: "Support",
  });
  return sendEmail({
    to: params.to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}
