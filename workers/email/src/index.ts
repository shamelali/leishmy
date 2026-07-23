import PostalMime from "postal-mime";
import { createDb } from "./db";
import { getDestination } from "./aliases";

export interface Env {
  DATABASE_URL: string;
}

export default {
  async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext) {
    const recipient = (Array.isArray(message.to) ? message.to[0] : message.to) ?? "";
    const destination = getDestination(recipient);

    const rawText = await new Response(message.raw).text();

    let parsed: { html?: string; text?: string } = {};
    try {
      parsed = await new PostalMime().parse(rawText);
    } catch {
      console.error("Failed to parse email body");
    }

    const db = createDb(env.DATABASE_URL);

    ctx.waitUntil(
      (async () => {
        try {
          await db.insertReceivedEmail({
            recipient,
            sender: message.from,
            subject: message.subject,
            bodyText: parsed.text ?? null,
            bodyHtml: parsed.html ?? null,
            messageId: message.headers.get("Message-ID"),
            source: "cloudflare-worker",
          });
        } catch (err) {
          console.error("DB insert failed:", err);
        }
      })(),
    );

    await message.forward(destination);
  },
};
