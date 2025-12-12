import { getAllPosts } from "@/lib/blog";

export const runtime = "nodejs";

function escapeXml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.tubegrow.io";
  const posts = getAllPosts();

  const items = posts
    .map((post) => {
      const url = `${siteUrl}/blog/${post.slug}`;
      const title = escapeXml(post.title);
      const description = escapeXml(post.description);
      const pubDate = new Date(post.date).toUTCString();

      return `
  <item>
    <title>${title}</title>
    <link>${url}</link>
    <guid>${url}</guid>
    <pubDate>${pubDate}</pubDate>
    <description>${description}</description>
  </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>TubeGrow Blog</title>
    <link>${siteUrl}/blog</link>
    <description>TubeGrow blog: analytics, SEO, Shorts, and creator growth guides.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

