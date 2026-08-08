import { NextRequest, NextResponse } from "next/server";
import { WebhookRetryService } from "@/lib/webhook-retry";
import { getAuthSession } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (session.role !== "admin" && !session.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const eventIdStr = searchParams.get("eventId");

    if (!eventIdStr) {
      return NextResponse.json(
        { error: "eventId parameter is required" },
        { status: 400 }
      );
    }

    const eventId = parseInt(eventIdStr, 10);
    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: "eventId must be a valid integer" },
        { status: 400 }
      );
    }

    // Attempt to manually retry the dead letter event
    const success = await WebhookRetryService.manualRetryDeadLetter(eventId);

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Webhook event ${eventId} moved from dead letter queue to retry queue`
      });
    } else {
      return NextResponse.json(
        { error: `Failed to move webhook event ${eventId} from dead letter queue` },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error manually retrying webhook:", error);
    return NextResponse.json(
      { error: "Failed to manually retry webhook" },
      { status: 500 }
    );
  }
}