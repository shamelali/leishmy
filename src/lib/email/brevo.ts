import { BrevoClient } from "@getbrevo/brevo";
import { prefixedEnvReader } from "@/lib/env-prefix";

const brevoEnv = prefixedEnvReader("BREVO_");

let brevoClient: any | null = null;

function getBrevoClient(): any {
  if (!brevoClient) {
    const apiKey = brevoEnv.get("API_KEY");
    if (!apiKey) {
      throw new Error("BREVO_API_KEY is not set");
    }
    brevoClient = new BrevoClient({ apiKey });
  }
  return brevoClient;
}

export type EmailPayload = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  from?: string;
  fromName?: string;
};

export async function sendEmail(payload: EmailPayload) {
  const fromEmail = payload.from || process.env.FROM_EMAIL || "hello@leish.my";
  const fromName = payload.fromName || process.env.FROM_NAME || "Leish";

  try {
    const client = getBrevoClient();

    const recipients = Array.isArray(payload.to)
      ? payload.to.map((email) => ({ email }))
      : [{ email: payload.to }];

    const response = await (client.transactionalEmails as any).sendTransacEmail(
      {
        sender: { email: fromEmail, name: fromName },
        to: recipients,
        subject: payload.subject,
        htmlContent: payload.html,
        textContent: payload.text,
      },
    );

    return { success: true, data: response };
  } catch (err) {
    console.error("Email send exception:", err);
    return { success: false, error: err };
  }
}
