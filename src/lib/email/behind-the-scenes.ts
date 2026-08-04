import { notificationEmailTemplate } from "./templates";

const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://leish.my";

export function behindTheScenesTemplate(params: { name: string }) {
  const { name } = params;
  const template = notificationEmailTemplate({
    name,
    title: "Behind the scenes at Leish",
    body: `Hi ${name},<br><br>We're working hard to get Leish! ready for launch. Here's a peek at what's coming:<br><br>✨ <strong>Verified Artists</strong> — Browse and book top makeup artists across Malaysia<br>📅 <strong>Instant Booking</strong> — Select your date, time, and services in minutes<br>💳 <strong>Easy Payments</strong> — Pay securely via Billplz<br>⭐ <strong>Reviews & Ratings</strong> — Find the perfect artist for you<br><br>We'll share more updates as launch day approaches. Follow us on social media for the latest!<br><br><a href="${SITE_URL}">Visit Leish!</a>`,
    type: "Update",
  });
  return template;
}