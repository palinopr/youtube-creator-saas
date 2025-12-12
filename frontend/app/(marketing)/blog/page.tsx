import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calendar, Clock, Tag } from "lucide-react";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Tips, strategies, and insights to help you grow your YouTube channel. Learn about analytics, SEO, content strategy, and more.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Blog | TubeGrow - YouTube Growth Tips & Strategies",
    description:
      "Tips, strategies, and insights to help you grow your YouTube channel.",
  },
};

const categoryColors: Record<string, { bg: string; text: string }> = {
  Analytics: { bg: "bg-blue-500/10", text: "text-blue-400" },
  Growth: { bg: "bg-purple-500/10", text: "text-purple-400" },
  AI: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  SEO: { bg: "bg-orange-500/10", text: "text-orange-400" },
  Clips: { bg: "bg-pink-500/10", text: "text-pink-400" },
};

export default function BlogPage() {
  const posts = getAllPosts();
  const featuredPost = posts[0];
  const otherPosts = posts.slice(1);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-black to-black" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px]" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              TubeGrow
            </span>{" "}
            Blog
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Tips, strategies, and insights to help you grow your YouTube channel
            and create better content.
          </p>
          <p className="text-sm md:text-base text-gray-500 max-w-2xl mx-auto mt-4">
            Start with our{" "}
            <Link href="/ai-youtube-tools" className="text-emerald-400 hover:underline">
              AI tools guide
            </Link>
            , learn how to{" "}
            <Link href="/viral-clips-generator" className="text-emerald-400 hover:underline">
              create viral Shorts
            </Link>
            , and explore{" "}
            <Link href="/features" className="text-emerald-400 hover:underline">
              TubeGrow features
            </Link>
            .
          </p>
          <p className="text-sm md:text-base text-gray-500 max-w-2xl mx-auto mt-4">
            Inside the TubeGrow blog you’ll find practical tutorials and data‑driven strategies for
            growing a YouTube channel. We cover how to read analytics, improve retention and CTR,
            pick topics that match your audience, optimize titles/descriptions/tags for YouTube SEO,
            and repurpose long videos into high‑performing Shorts. Every guide is built around
            workflows you can use today and the tools we’re bringing to creators in TubeGrow.
          </p>
        </div>
      </section>

      {/* Featured Post */}
      {featuredPost && (
        <section className="py-12 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">
              Featured Article
            </h2>
            <Link href={`/blog/${featuredPost.slug}`} className="group block">
              <article className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-2xl p-8 md:p-12 hover:border-emerald-500/40 transition-colors">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      categoryColors[featuredPost.category]?.bg || "bg-gray-500/10"
                    } ${categoryColors[featuredPost.category]?.text || "text-gray-400"}`}
                  >
                    {featuredPost.category}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    {new Date(featuredPost.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-gray-400">
                    <Clock className="w-4 h-4" />
                    {featuredPost.readTime}
                  </span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 group-hover:text-emerald-400 transition-colors">
                  {featuredPost.title}
                </h3>
                <p className="text-gray-400 mb-6 max-w-2xl">
                  {featuredPost.description}
                </p>
                <div className="inline-flex items-center gap-2 text-emerald-400 font-medium group-hover:gap-3 transition-all">
                  Read Article
                  <ArrowRight className="w-4 h-4" />
                </div>
              </article>
            </Link>
          </div>
        </section>
      )}

      {/* Other Posts */}
      <section className="py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">
            All Articles
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block"
              >
                <article className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-white/20 transition-all h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        categoryColors[post.category]?.bg || "bg-gray-500/10"
                      } ${categoryColors[post.category]?.text || "text-gray-400"}`}
                    >
                      {post.category}
                    </span>
                    <span className="text-xs text-gray-500">{post.readTime}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4 flex-1">
                    {post.description}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {new Date(post.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="text-emerald-400 font-medium group-hover:underline">
                      Read →
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">
            Stay Updated
          </h2>
          <p className="text-gray-400 mb-8">
            Get the latest YouTube growth tips and TubeGrow updates delivered to
            your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50"
            />
            <button className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-lg font-medium transition-all">
              Subscribe
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </section>
    </div>
  );
}
