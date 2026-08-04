import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { db } from "@/db";
import { blogPosts, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { JsonLd } from "@/components/JsonLd";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

async function getPost(slug: string) {
  const [post] = await db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      excerpt: blogPosts.excerpt,
      content: blogPosts.content,
      coverImage: blogPosts.coverImage,
      authorId: blogPosts.authorId,
      authorName: users.name,
      authorAvatar: users.avatar,
      tags: blogPosts.tags,
      published: blogPosts.published,
      publishedAt: blogPosts.publishedAt,
      createdAt: blogPosts.createdAt,
    })
    .from(blogPosts)
    .leftJoin(users, eq(users.id, blogPosts.authorId))
    .where(eq(blogPosts.slug, slug))
    .limit(1);
  return post;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post || !post.published) return { title: "Post not found" };
  return {
    title: `${post.title} | Leish! Blog`,
    description: post.excerpt || post.title,
    openGraph: {
      title: post.title,
      description: post.excerpt || post.title,
      images: post.coverImage ? [post.coverImage] : undefined,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
    },
  };
}

function formatDate(d: Date | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const hdrs = await headers();
  const nonce = hdrs.get("x-nonce") || undefined;

  const post = await getPost(slug);
  if (!post || !post.published) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || post.title,
    image: post.coverImage || undefined,
    datePublished: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
    author: post.authorName
      ? { "@type": "Person", name: post.authorName }
      : { "@type": "Organization", name: "Leish!" },
    publisher: {
      "@type": "Organization",
      name: "Leish!",
    },
    mainEntityOfPage: `${process.env.NEXT_PUBLIC_URL}/blog/${post.slug}`,
  };

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <JsonLd data={jsonLd} nonce={nonce} />

      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-rose-500 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to blog
      </Link>

      <h1 className="text-3xl sm:text-4xl font-bold mb-4">{post.title}</h1>

      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
        {post.authorName && (
          <span className="flex items-center gap-1.5">
            {post.authorAvatar ? (
              <Image
                src={post.authorAvatar}
                alt={post.authorName}
                width={24}
                height={24}
                className="rounded-full"
              />
            ) : (
              <User className="w-4 h-4" />
            )}
            {post.authorName}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          {formatDate(post.publishedAt || post.createdAt)}
        </span>
      </div>

      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {post.coverImage && (
        <div className="relative aspect-video rounded-2xl overflow-hidden mb-8 bg-gray-100 dark:bg-neutral-800">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>
      )}

      <div className="prose dark:prose-invert max-w-none">
        {post.content.split(/\n\n+/).map((para, i) => (
          <p key={i} className="mb-4 leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
            {para}
          </p>
        ))}
      </div>
    </article>
  );
}
