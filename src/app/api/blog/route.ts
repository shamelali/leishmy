import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { blogPosts, users } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";
import { hasAdminAccess } from "@/lib/auth/admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 10));
    const tag = searchParams.get("tag");
    const adminView = searchParams.get("admin") === "true";

    const session = adminView ? await getAuthSession() : null;
    const showAll = adminView && session && hasAdminAccess(session);

    const conditions = showAll ? undefined : eq(blogPosts.published, true);
    const tagCondition = tag ? sql`EXISTS (SELECT 1 FROM unnest(${blogPosts.tags}) AS t WHERE t = ${tag})` : undefined;

    const where = conditions && tagCondition
      ? sql`${conditions} AND ${tagCondition}`
      : conditions
        ? conditions
        : tagCondition || sql`true`;

    const offset = (page - 1) * limit;

    const [posts, [{ total }]] = await Promise.all([
      db
        .select({
          id: blogPosts.id,
          title: blogPosts.title,
          slug: blogPosts.slug,
          excerpt: blogPosts.excerpt,
          coverImage: blogPosts.coverImage,
          authorName: users.name,
          authorAvatar: users.avatar,
          tags: blogPosts.tags,
          published: blogPosts.published,
          publishedAt: blogPosts.publishedAt,
        })
        .from(blogPosts)
        .leftJoin(users, eq(users.id, blogPosts.authorId))
        .where(where as any)
        .orderBy(desc(blogPosts.publishedAt || blogPosts.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`COUNT(*)::int` })
        .from(blogPosts)
        .where(where as any),
    ]);

    return NextResponse.json({
      posts,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    console.error("List blog posts error:", error);
    return NextResponse.json({ error: "Failed to list blog posts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || !hasAdminAccess(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, excerpt, coverImage, tags, published } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "title and content required" }, { status: 400 });
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const now = new Date();

    const [created] = await db
      .insert(blogPosts)
      .values({
        title,
        slug,
        content,
        excerpt: excerpt || null,
        coverImage: coverImage || null,
        authorId: session.id,
        tags: tags || null,
        published: published ?? false,
        publishedAt: published ? now : null,
      })
      .returning();

    return NextResponse.json({ success: true, post: created }, { status: 201 });
  } catch (error) {
    console.error("Create blog post error:", error);
    return NextResponse.json({ error: "Failed to create blog post" }, { status: 500 });
  }
}
