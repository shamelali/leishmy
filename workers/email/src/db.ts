import { neon } from "@neondatabase/serverless";

export function createDb(databaseUrl: string) {
  const sql = neon(databaseUrl);

  return {
    async insertReceivedEmail(data: {
      recipient: string;
      sender: string;
      subject: string | null;
      bodyText: string | null;
      bodyHtml: string | null;
      messageId: string | null;
      source: string;
    }) {
      await sql`
        INSERT INTO received_emails (recipient, sender, subject, body_text, body_html, message_id, source)
        VALUES (${data.recipient}, ${data.sender}, ${data.subject}, ${data.bodyText}, ${data.bodyHtml}, ${data.messageId}, ${data.source})
      `;
    },
  };
}
