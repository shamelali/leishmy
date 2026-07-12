import { BrevoClient } from "@getbrevo/brevo";
import { prefixedEnvReader } from "@/lib/env-prefix";
import * as Sentry from "@sentry/nextjs";

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

type ErrorCategory = "permanent" | "transient" | "unknown";

function classifyError(err: unknown): ErrorCategory {
  const statusCode =
    (err as any)?.statusCode ?? (err as any)?.rawResponse?.status;
  if (statusCode === 401 || statusCode === 403) return "permanent";
  if (statusCode >= 500 && statusCode < 600) return "transient";
  if (statusCode === 429) return "transient";

  const cause = (err as any)?.cause;
  if (cause === "timeout") return "transient";

  const errMessage = String(err);
  const transientPatterns = [
    "fetch failed",
    "ECONNRESET",
    "ETIMEDOUT",
    "ENOTFOUND",
    "EAI_AGAIN",
    "socket hang up",
    "other side closed",
    "Client network socket disconnected",
    "read ECONNRESET",
    "write EPROTO",
    "certificate has expired",
    "self signed certificate",
  ];
  if (transientPatterns.some((p) => errMessage.includes(p))) return "transient";

  if (cause instanceof Error && transientPatterns.some((p) => cause.message.includes(p)))
    return "transient";

  return "unknown";
}

function describeError(err: unknown): string {
  const body = (err as any)?.body;
  if (body?.message) return body.message;
  const cause = (err as any)?.cause;
  if (typeof cause === "string") return cause;
  if (cause instanceof Error) return cause.message;
  return String(err);
}

const MAX_RETRIES = 2;
const BASE_DELAY_MS = 1000;

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function sendEmail(payload: EmailPayload) {
  const apiKey = brevoEnv.get("API_KEY");
  if (!apiKey) {
    return { success: false, error: new Error("BREVO_API_KEY is not set") };
  }

  const fromEmail = payload.from || process.env.FROM_EMAIL || "hello@leish.my";
  const fromName = payload.fromName || process.env.FROM_NAME || "Leish";
  const recipients = Array.isArray(payload.to)
    ? payload.to.map((email) => ({ email }))
    : [{ email: payload.to }];

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const client = getBrevoClient();
      const response = await (
        client.transactionalEmails as any
      ).sendTransacEmail({
        sender: { email: fromEmail, name: fromName },
        to: recipients,
        subject: payload.subject,
        htmlContent: payload.html,
        textContent: payload.text,
      });

      if (attempt > 0) {
        console.log(
          `[email] succeeded on attempt ${attempt + 1} to ${payload.to}`,
        );
      }
      return { success: true, data: response };
    } catch (err) {
      lastError = err;
      const category = classifyError(err);
      const desc = describeError(err);

      console.error(
        `[email] attempt ${attempt + 1}/${MAX_RETRIES + 1} failed ` +
          `[${category}] to=${payload.to} subject="${payload.subject}": ${desc}`,
      );

      if (category === "permanent") break;
      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  Sentry.captureException(lastError, {
    extra: { to: payload.to, subject: payload.subject },
  });
  return { success: false, error: lastError };
}

export function hasBrevoKey(): boolean {
  return !!brevoEnv.get("API_KEY");
}
