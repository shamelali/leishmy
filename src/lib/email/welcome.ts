import { sendEmail } from "./brevo";
import { welcomeEmailTemplate } from "./templates";

export async function sendWelcomeEmail(params: {
  email: string;
  name: string;
  role: "client" | "artist" | "studio";
}) {
  const template = welcomeEmailTemplate({
    name: params.name,
    role: params.role,
  });
  return sendEmail({
    to: params.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}
