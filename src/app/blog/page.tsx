import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { BookOpen, ArrowRight, Calendar } from "lucide-react";
import { db } from "@/db";
import { blogPosts, users } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { JsonLd } from "@/components/JsonLd";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Leish!",
  description: "Tips, guides, and stories from Malaysia's tattoo & beauty community.",
};

type Post = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  tags: string[] | null;
  publishedAt: Date | null;
  createdAt: Date;
  authorName: string | null;
  authorAvatar: string | null;
};

async function getPosts(): Promise<Post[]> {
  try {
    const rows = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        coverImage: blogPosts.coverImage,
        tags: blogPosts.tags,
        publishedAt: blogPosts.publishedAt,
        createdAt: blogPosts.createdAt,
        authorName: users.name,
        authorAvatar: users.avatar,
      })
      .from(blogPosts)
      .leftJoin(users, eq(users.id, blogPosts.authorId))
      .where(eq(blogPosts.published, true))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(50);
    return rows;
  } catch {
    return [];
  }
}

function formatDate(d: Date | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function BlogIndexPage() {
  const hdrs = await headers();
  const nonce = hdrs.get("x-nonce") || undefined;
  const posts = await getPosts();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Leish! Blog",
    description: "Tips, guides, and stories from Malaysia's tattoo & beauty community.",
    url: `${process.env.NEXT_PUBLIC_URL}/blog`,
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `${process.env.NEXT_PUBLIC_URL}/blog/${p.slug}`,
      datePublished: p.publishedAt?.toISOString(),
      image: p.coverImage || undefined,
      author: p.authorName ? { "@type": "Person", name: p.authorName } : undefined,
    })),
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <JsonLd data={jsonLd} nonce={nonce} />

      <div className="text-center mb-10">
        <BookOpen className="w-10 h-10 mx-auto mb-3 text-rose-500" />
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Leish! Blog</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
          Tips, guides, and stories from Malaysia&apos;s tattoo & beauty community.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <p>No posts yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group block rounded-2xl overflow-hidden bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 hover:shadow-lg transition-shadow"
            >
              {post.coverImage ? (
                <div className="relative aspect-video bg-gray-100 dark:bg-neutral-800">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-950 dark:to-amber-950 flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-rose-400" />
                </div>
              )}

              <div className="p-5">
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <h2 className="font-semibold text-lg mb-2 group-hover:text-rose-500 transition-colors line-clamp-2">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">
                    {post.excerpt}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(post.publishedAt || post.createdAt)}
                  </span>
                  <span className="flex items-center gap-1 text-rose-500 group-hover:translate-x-1 transition-transform">
                    Read <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
