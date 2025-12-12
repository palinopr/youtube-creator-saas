import { blogPosts } from "./blogPosts";

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  content: string;
  date: string;
  readTime: string;
  category: string;
  author: {
    name: string;
    avatar?: string;
  };
  image?: string;
}

export { blogPosts };

let didValidateBlogPosts = false;

function validateBlogPosts(posts: BlogPost[]) {
  if (didValidateBlogPosts || process.env.NODE_ENV === "production") return;
  didValidateBlogPosts = true;

  const yearRegex = /\b(20\d{2})\b/;

  for (const post of posts) {
    const titleYear = post.title.match(yearRegex)?.[1];
    const slugYear = post.slug.match(yearRegex)?.[1];
    if (titleYear && slugYear && titleYear !== slugYear) {
      // eslint-disable-next-line no-console
      console.warn(
        `[blog] Slug year (${slugYear}) does not match title year (${titleYear}) for "${post.slug}".`
      );
    }
  }
}

export function getAllPosts(): BlogPost[] {
  validateBlogPosts(blogPosts);
  return [...blogPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string | string[]): BlogPost | undefined {
  const rawSlug = Array.isArray(slug) ? slug.join("/") : slug;
  const normalizedSlug = decodeURIComponent(rawSlug).trim().toLowerCase();
  return blogPosts.find((post) => post.slug.trim().toLowerCase() === normalizedSlug);
}

export function getPostsByCategory(category: string): BlogPost[] {
  return blogPosts.filter((post) => post.category === category);
}
