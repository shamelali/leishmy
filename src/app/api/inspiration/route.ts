import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inspirationBoards, savedInspiration } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");
    const boardId = searchParams.get("boardId");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }
    if (!session || session.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (action === "boards") {
      const boards = await db
        .select()
        .from(inspirationBoards)
        .where(eq(inspirationBoards.userId, userId))
        .orderBy(desc(inspirationBoards.updatedAt));
      return NextResponse.json({ boards });
    }

    if (action === "saved" && boardId) {
      const items = await db
        .select()
        .from(savedInspiration)
        .where(
          and(
            eq(savedInspiration.boardId, Number(boardId)),
            eq(savedInspiration.userId, userId),
          ),
        )
        .orderBy(desc(savedInspiration.createdAt));
      return NextResponse.json({ items });
    }

    const boards = await db
      .select()
      .from(inspirationBoards)
      .where(eq(inspirationBoards.userId, userId))
      .orderBy(desc(inspirationBoards.updatedAt));

    const boardIds = boards.map((b) => b.id);
    const items = boardIds.length > 0
      ? await db
          .select()
          .from(savedInspiration)
          .where(eq(savedInspiration.userId, userId))
          .orderBy(desc(savedInspiration.createdAt))
      : [];

    return NextResponse.json({ boards, items });
  } catch (error) {
    console.error("Inspiration GET error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const body = await request.json().catch(() => ({}));
    const userId = searchParams.get("userId") || body.userId;

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }
    if (!session || session.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (action === "create-board") {
      const { name, description, isPublic } = body;
      if (!name) {
        return NextResponse.json({ error: "Board name required" }, { status: 400 });
      }
      const [board] = await db
        .insert(inspirationBoards)
        .values({ userId, name, description, isPublic: isPublic || false })
        .returning();
      return NextResponse.json({ success: true, board });
    }

    if (action === "save") {
      const { boardId, imageUrl, sourceArtistId, sourceType, caption, tags } = body;
      if (!boardId || !imageUrl) {
        return NextResponse.json({ error: "boardId and imageUrl required" }, { status: 400 });
      }
      const [item] = await db
        .insert(savedInspiration)
        .values({
          boardId: Number(boardId),
          userId,
          imageUrl,
          sourceArtistId: sourceArtistId ? Number(sourceArtistId) : null,
          sourceType: sourceType || "user_upload",
          caption: caption || null,
          tags: tags || [],
        })
        .returning();

      await db
        .update(inspirationBoards)
        .set({ coverImage: imageUrl, updatedAt: new Date() })
        .where(eq(inspirationBoards.id, Number(boardId)));

      return NextResponse.json({ success: true, item });
    }

    if (action === "update-board") {
      const { boardId, name, description, isPublic } = body;
      if (!boardId) {
        return NextResponse.json({ error: "boardId required" }, { status: 400 });
      }
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (isPublic !== undefined) updateData.isPublic = isPublic;
      await db
        .update(inspirationBoards)
        .set(updateData)
        .where(
          and(
            eq(inspirationBoards.id, Number(boardId)),
            eq(inspirationBoards.userId, userId),
          ),
        );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Inspiration POST error:", error);
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const body = await request.json().catch(() => ({}));
    const userId = searchParams.get("userId") || body.userId;

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }
    if (!session || session.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (action === "delete-board") {
      const { boardId } = body;
      if (!boardId) {
        return NextResponse.json({ error: "boardId required" }, { status: 400 });
      }
      await db
        .delete(savedInspiration)
        .where(eq(savedInspiration.boardId, Number(boardId)));
      await db
        .delete(inspirationBoards)
        .where(
          and(
            eq(inspirationBoards.id, Number(boardId)),
            eq(inspirationBoards.userId, userId),
          ),
        );
      return NextResponse.json({ success: true });
    }

    if (action === "delete-item") {
      const { itemId } = body;
      if (!itemId) {
        return NextResponse.json({ error: "itemId required" }, { status: 400 });
      }
      await db
        .delete(savedInspiration)
        .where(
          and(
            eq(savedInspiration.id, Number(itemId)),
            eq(savedInspiration.userId, userId),
          ),
        );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Inspiration DELETE error:", error);
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}
