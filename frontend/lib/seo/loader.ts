import fs from "fs";
import path from "path";
import type { SEOPage, SEOCategory, ContentBlocks } from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content/seo-pages");
const BLOCKS_DIR = path.join(process.cwd(), "content/content-blocks");

// Cache for performance
let cachedPages: SEOPage[] | null = null;
let cachedBlocks: ContentBlocks | null = null;

/**
 * Get all SEO pages from all categories
 */
export function getAllSEOPages(): SEOPage[] {
  if (cachedPages) return cachedPages;

  const categories: SEOCategory[] = [
    "comparisons",
    "niche-tools",
    "how-to",
    "alternatives",
    "long-tail",
  ];

  const pages: SEOPage[] = [];

  for (const category of categories) {
    const categoryDir = path.join(CONTENT_DIR, category);

    if (!fs.existsSync(categoryDir)) continue;

    const files = fs
      .readdirSync(categoryDir)
      .filter((f) => f.endsWith(".json") && f !== "index.json");

    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(categoryDir, file), "utf-8");
        const page = JSON.parse(content) as SEOPage;
        pages.push(page);
      } catch (error) {
        console.error(`Error loading SEO page: ${file}`, error);
      }
    }
  }

  // Sort by priority (rolloutBatch) and date
  pages.sort((a, b) => {
    if (a.rolloutBatch !== b.rolloutBatch) {
      return a.rolloutBatch - b.rolloutBatch;
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  cachedPages = pages;
  return pages;
}

/**
 * Get a single SEO page by category and slug
 */
export function getSEOPage(
  category: string,
  slug: string
): SEOPage | null {
  const filePath = path.join(CONTENT_DIR, category, `${slug}.json`);

  if (!fs.existsSync(filePath)) return null;

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as SEOPage;
  } catch (error) {
    console.error(`Error loading SEO page: ${category}/${slug}`, error);
    return null;
  }
}

/**
 * Get all published SEO pages for sitemap
 */
export function getPublishedSEOPages(): SEOPage[] {
  return getAllSEOPages().filter((page) => page.status === "published");
}

/**
 * Get SEO pages by category
 */
export function getSEOPagesByCategory(category: SEOCategory): SEOPage[] {
  return getAllSEOPages().filter((page) => page.category === category);
}

/**
 * Get related pages based on niche, tools, or category
 */
export function getRelatedSEOPages(
  currentPage: SEOPage,
  limit: number = 6
): SEOPage[] {
  const allPages = getAllSEOPages().filter(
    (p) => p.slug !== currentPage.slug && p.status === "published"
  );

  // Score pages by relevance
  const scored = allPages.map((page) => {
    let score = 0;

    // Same category bonus
    if (page.category === currentPage.category) score += 3;

    // Same niche bonus
    if (page.niche && page.niche === currentPage.niche) score += 5;

    // Shared tools bonus
    if (
      page.primaryTool &&
      (page.primaryTool === currentPage.primaryTool ||
        page.primaryTool === currentPage.secondaryTool)
    ) {
      score += 4;
    }

    // Shared keywords bonus
    const sharedKeywords = page.metadata.keywords.filter((k) =>
      currentPage.metadata.keywords.includes(k)
    );
    score += sharedKeywords.length * 2;

    return { page, score };
  });

  // Sort by score and return top results
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.page);
}

/**
 * Load content blocks for variation system
 */
export function getContentBlocks(): ContentBlocks {
  if (cachedBlocks) return cachedBlocks;

  const blocks: ContentBlocks = {
    intros: [],
    features: [],
    faqs: [],
  };

  try {
    const introsPath = path.join(BLOCKS_DIR, "intro-blocks.json");
    if (fs.existsSync(introsPath)) {
      blocks.intros = JSON.parse(fs.readFileSync(introsPath, "utf-8"));
    }

    const featuresPath = path.join(BLOCKS_DIR, "feature-blocks.json");
    if (fs.existsSync(featuresPath)) {
      blocks.features = JSON.parse(fs.readFileSync(featuresPath, "utf-8"));
    }

    const faqsPath = path.join(BLOCKS_DIR, "faq-blocks.json");
    if (fs.existsSync(faqsPath)) {
      blocks.faqs = JSON.parse(fs.readFileSync(faqsPath, "utf-8"));
    }
  } catch (error) {
    console.error("Error loading content blocks", error);
  }

  cachedBlocks = blocks;
  return blocks;
}

/**
 * Clear cache (useful for development)
 */
export function clearSEOCache(): void {
  cachedPages = null;
  cachedBlocks = null;
}

/**
 * Get page count by status
 */
export function getSEOPageStats(): {
  total: number;
  published: number;
  draft: number;
  byCategory: Record<SEOCategory, number>;
} {
  const pages = getAllSEOPages();

  const byCategory: Record<SEOCategory, number> = {
    comparisons: 0,
    "niche-tools": 0,
    "how-to": 0,
    alternatives: 0,
    "long-tail": 0,
  };

  for (const page of pages) {
    byCategory[page.category]++;
  }

  return {
    total: pages.length,
    published: pages.filter((p) => p.status === "published").length,
    draft: pages.filter((p) => p.status === "draft").length,
    byCategory,
  };
}
