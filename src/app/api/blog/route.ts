import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { blogPosts, users } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";
import { hasAdminAccess } from "@/lib/auth/admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(sp.get("limit")) || 10));
  const tag = sp.get("tag");
  const admin = sp.get("admin") === "true";

  try {
    const conditions = admin ? [] : [eq(blogPosts.published, true)];
    if (tag) conditions.push(sql`${tag} = ANY(${blogPosts.tags})`);

    const [totalRow] = await db
      .select({ total: sql<number>`COUNT(*)::int` })
      .from(blogPosts)
      .where(and(...conditions));

    const posts = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        coverImage: blogPosts.coverImage,
        tags: blogPosts.tags,
        published: blogPosts.published,
        publishedAt: blogPosts.publishedAt,
        createdAt: blogPosts.createdAt,
        authorName: users.name,
        authorAvatar: users.avatar,
      })
      .from(blogPosts)
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .where(and(...conditions))
      .orderBy(desc(blogPosts.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return NextResponse.json({ posts, total: totalRow?.total ?? 0, page, totalPages: Math.ceil((totalRow?.total ?? 0) / limit) });
  } catch (error) {
    console.error("Blog list error:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session || !hasAdminAccess(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { title, content, excerpt, coverImage, tags, published } = body;

    if (!title || !content) return NextResponse.json({ error: "title and content required" }, { status: 400 });

    const slug = body.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const [post] = await db
      .insert(blogPosts)
      .values({
        title,
        slug,
        excerpt: excerpt || null,
        content,
        coverImage: coverImage || null,
        authorId: session.id,
        tags: tags || null,
        published: published || false,
        publishedAt: published ? new Date() : null,
      })
      .returning();

    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (error) {
    console.error("Blog create error:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}