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

export function getAllPosts(): BlogPost[] {
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
