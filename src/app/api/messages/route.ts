import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { conversations, messages, users, bookings } from "@/db/schema";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
      const convId = Number(conversationId);
      const [conversation] = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, convId),
            or(
              eq(conversations.participant1Id, session.id),
              eq(conversations.participant2Id, session.id),
            ),
          ),
        )
        .limit(1);

      if (!conversation) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }

      const isP1 = conversation.participant1Id === session.id;

      await db
        .update(conversations)
        .set(isP1 ? { participant1Read: true } : { participant2Read: true })
        .where(eq(conversations.id, convId));

      const messageList = await db
        .select({
          id: messages.id,
          senderId: messages.senderId,
          body: messages.body,
          readAt: messages.readAt,
          createdAt: messages.createdAt,
          senderName: users.name,
        })
        .from(messages)
        .innerJoin(users, eq(messages.senderId, users.id))
        .where(eq(messages.conversationId, convId))
        .orderBy(messages.createdAt);

      const otherUserId = isP1 ? conversation.participant2Id : conversation.participant1Id;
      const [otherUser] = await db
        .select({ id: users.id, name: users.name, image: users.image })
        .from(users)
        .where(eq(users.id, otherUserId))
        .limit(1);

      return NextResponse.json({
        conversation: {
          ...conversation,
          otherUser,
        },
        messages: messageList,
      });
    }

    const convList = await db
      .select({
        id: conversations.id,
        bookingId: conversations.bookingId,
        participant1Id: conversations.participant1Id,
        participant2Id: conversations.participant2Id,
        lastMessageAt: conversations.lastMessageAt,
        lastMessagePreview: conversations.lastMessagePreview,
        participant1Read: conversations.participant1Read,
        participant2Read: conversations.participant2Read,
        closed: conversations.closed,
        createdAt: conversations.createdAt,
      })
      .from(conversations)
      .where(
        or(
          eq(conversations.participant1Id, session.id),
          eq(conversations.participant2Id, session.id),
        ),
      )
      .orderBy(desc(conversations.lastMessageAt));

    const enriched = await Promise.all(
      convList.map(async (conv) => {
        const otherId =
          conv.participant1Id === session.id
            ? conv.participant2Id
            : conv.participant1Id;
        const [other] = await db
          .select({ id: users.id, name: users.name, image: users.image })
          .from(users)
          .where(eq(users.id, otherId))
          .limit(1);

        const isP1 = conv.participant1Id === session.id;
        const unread = isP1 ? !conv.participant1Read : !conv.participant2Read;

        return { ...conv, otherUser: other, unread };
      }),
    );

    return NextResponse.json({ conversations: enriched });
  } catch (error) {
    console.error("Messages fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, recipientId, bookingId, message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    let targetConvId = conversationId;

    if (!targetConvId && recipientId) {
      const [existing] = await db
        .select({ id: conversations.id })
        .from(conversations)
        .where(
          and(
            or(
              and(
                eq(conversations.participant1Id, session.id),
                eq(conversations.participant2Id, recipientId),
              ),
              and(
                eq(conversations.participant1Id, recipientId),
                eq(conversations.participant2Id, session.id),
              ),
            ),
            bookingId ? eq(conversations.bookingId, bookingId) : sql`1=1`,
          ),
        )
        .limit(1);

      if (existing) {
        targetConvId = existing.id;
      } else {
        // Booking gate: new conversations require a confirmed/completed booking
        if (!bookingId) {
          return NextResponse.json(
            { error: "A booking is required to start a new conversation" },
            { status: 403 },
          );
        }

        const [booking] = await db
          .select({ id: bookings.id, status: bookings.status, userId: bookings.userId, artistId: bookings.artistId, studioId: bookings.studioId })
          .from(bookings)
          .where(eq(bookings.id, bookingId))
          .limit(1);

        if (!booking) {
          return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        // Sender must be the client, artist, or studio on this booking
        const isParticipant =
          booking.userId === session.id ||
          booking.artistId === session.id ||
          booking.studioId === session.id;

        if (!isParticipant) {
          return NextResponse.json(
            { error: "You are not part of this booking" },
            { status: 403 },
          );
        }

        // Only confirmed or completed bookings allow messaging
        if (booking.status !== "confirmed" && booking.status !== "completed") {
          return NextResponse.json(
            { error: "Messaging is available after the booking is confirmed" },
            { status: 403 },
          );
        }

        const [p1, p2] = session.id < recipientId
          ? [session.id, recipientId]
          : [recipientId, session.id];

        const [newConv] = await db
          .insert(conversations)
          .values({
            participant1Id: p1,
            participant2Id: p2,
            bookingId: bookingId || null,
            lastMessagePreview: message.slice(0, 200),
          })
          .returning({ id: conversations.id });

        targetConvId = newConv.id;
      }
    }

    if (!targetConvId) {
      return NextResponse.json({ error: "conversationId or recipientId required" }, { status: 400 });
    }

    const [msg] = await db
      .insert(messages)
      .values({
        conversationId: targetConvId,
        senderId: session.id,
        body: message.trim(),
      })
      .returning({ id: messages.id, createdAt: messages.createdAt });

    await db
      .update(conversations)
      .set({
        lastMessageAt: new Date(),
        lastMessagePreview: message.trim().slice(0, 200),
        participant1Read: false,
        participant2Read: false,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, targetConvId));

    return NextResponse.json({ message: msg });
  } catch (error) {
    console.error("Messages send error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
