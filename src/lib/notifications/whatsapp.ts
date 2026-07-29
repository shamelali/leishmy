import { prefixedEnvReader } from "@/lib/env-prefix";

const whatsappEnv = prefixedEnvReader("WHATSAPP_");

const WHATSAPP_PHONE_NUMBER_ID = whatsappEnv.get("PHONE_NUMBER_ID");
const WHATSAPP_ACCESS_TOKEN = whatsappEnv.get("ACCESS_TOKEN");
const WHATSAPP_BASE_URL = "https://graph.facebook.com/v20.0";

function isConfigured(): boolean {
  return !!WHATSAPP_PHONE_NUMBER_ID && !!WHATSAPP_ACCESS_TOKEN;
}

function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("60")) return `+${cleaned}`;
  if (cleaned.startsWith("0")) return `+60${cleaned.slice(1)}`;
  return `+60${cleaned}`;
}

interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendMessage(to: string, message: string): Promise<SendMessageResult> {
  if (!isConfigured()) {
    return { success: false, error: "WhatsApp not configured" };
  }

  try {
    const response = await fetch(
      `${WHATSAPP_BASE_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: formatPhoneNumber(to),
          type: "text",
          text: { body: message },
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("WhatsApp API error:", data);
      return { success: false, error: data.error?.message || "Failed to send message" };
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (error) {
    console.error("Failed to send WhatsApp message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendPaymentConfirmation({
  customerName,
  bookingId,
  amount,
  phone,
}: {
  customerName: string;
  bookingId: string;
  amount: number;
  phone: string;
}) {
  const message =
    `Hi ${customerName}! Payment received.\n\n` +
    `💰 MYR ${amount}\n` +
    `📋 Ref: ${bookingId}\n\n` +
    `Thank you! - Leish`;

  return sendMessage(phone, message);
}

export async function sendCancellationNotice({
  customerName,
  bookingId,
  phone,
  depositForfeited,
}: {
  customerName: string;
  bookingId: string;
  phone: string;
  depositForfeited?: boolean;
}) {
  const forfeitureNote = depositForfeited
    ? "\n⚠️ Your deposit has been forfeited per our 48-hour cancellation policy."
    : "";

  const message =
    `Hi ${customerName}, your booking has been cancelled.\n\n` +
    `📋 Ref: ${bookingId}\n` +
    `${forfeitureNote}` +
    `\nIf you have questions, contact us at hello@leish.my\n` +
    `- Leish`;

  return sendMessage(phone, message);
}
