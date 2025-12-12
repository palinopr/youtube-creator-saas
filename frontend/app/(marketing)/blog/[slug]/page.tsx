import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock, ArrowRight } from "lucide-react";
import { getAllPosts, getPostBySlug } from "@/lib/blog";

interface Props {
  params: { slug: string };
}

// Force runtime rendering to avoid static prerendering to 404 on Vercel.
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPostBySlug(params.slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: { absolute: post.title },
    description: post.description,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: `${post.title} | TubeGrow Blog`,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author.name],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  Analytics: { bg: "bg-blue-500/10", text: "text-blue-400" },
  Growth: { bg: "bg-purple-500/10", text: "text-purple-400" },
  AI: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  SEO: { bg: "bg-orange-500/10", text: "text-orange-400" },
  Clips: { bg: "bg-pink-500/10", text: "text-pink-400" },
};

export default function BlogPostPage({ params }: Props) {
  const post = getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  const allPosts = getAllPosts();
  const currentIndex = allPosts.findIndex((p) => p.slug === params.slug);
  const nextPost = allPosts[currentIndex + 1];
  const prevPost = allPosts[currentIndex - 1];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="py-12 border-b border-white/10">
        <div className="max-w-3xl mx-auto px-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                categoryColors[post.category]?.bg || "bg-gray-500/10"
              } ${categoryColors[post.category]?.text || "text-gray-400"}`}
            >
              {post.category}
            </span>
            <span className="flex items-center gap-1 text-sm text-gray-400">
              <Calendar className="w-4 h-4" />
              {new Date(post.date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              {post.readTime}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            {post.title}
          </h1>

          <p className="text-xl text-gray-400">{post.description}</p>

          <div className="flex items-center gap-3 mt-8 pt-8 border-t border-white/10">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
              {post.author.name.charAt(0)}
            </div>
            <div>
              <p className="text-white font-medium">{post.author.name}</p>
              <p className="text-sm text-gray-400">Author</p>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <article className="max-w-3xl mx-auto px-6 prose prose-invert prose-lg prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-gray-300 prose-li:text-gray-300 prose-strong:text-white prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline prose-code:text-emerald-400 prose-code:bg-white/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-[#111] prose-pre:border prose-pre:border-white/10">
          <div dangerouslySetInnerHTML={{ __html: formatContent(post.content) }} />
        </article>
      </section>

      {/* Navigation */}
      <section className="py-12 border-t border-white/10">
        <div className="max-w-3xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6">
            {prevPost ? (
              <Link
                href={`/blog/${prevPost.slug}`}
                className="group p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
              >
                <span className="text-sm text-gray-400 flex items-center gap-1 mb-2">
                  <ArrowLeft className="w-4 h-4" />
                  Previous Article
                </span>
                <p className="text-white font-medium group-hover:text-emerald-400 transition-colors">
                  {prevPost.title}
                </p>
              </Link>
            ) : (
              <div />
            )}
            {nextPost && (
              <Link
                href={`/blog/${nextPost.slug}`}
                className="group p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-right"
              >
                <span className="text-sm text-gray-400 flex items-center justify-end gap-1 mb-2">
                  Next Article
                  <ArrowRight className="w-4 h-4" />
                </span>
                <p className="text-white font-medium group-hover:text-emerald-400 transition-colors">
                  {nextPost.title}
                </p>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-white/10">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to Grow Your Channel?
          </h2>
          <p className="text-gray-400 mb-6">
            Put these strategies into action with TubeGrow's AI-powered analytics.
          </p>
          <Link
            href="/api/auth/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-lg font-medium transition-all"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

// Simple markdown-like content formatter
function formatContent(content: string): string {
  return content
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/^(\d+)\. (.*$)/gim, '<li>$2</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/<li>/g, '<ul><li>')
    .replace(/<\/li>\n(?!<li>)/g, '</li></ul>')
    .replace(/<\/li><ul>/g, '</li>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}
