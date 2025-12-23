// SEO Page Types for Programmatic Content Generation

export type SEOCategory =
  | "comparisons"
  | "niche-tools"
  | "how-to"
  | "alternatives"
  | "long-tail";

export type PageStatus = "draft" | "scheduled" | "published";

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  canonical?: string;
}

export interface HeroSection {
  badge: string;
  headline: string;
  subheadline: string;
  primaryKeyword: string;
}

export interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

export interface ComparisonRow {
  feature: string;
  toolA: string | boolean;
  toolB: string | boolean;
  tubeGrow: string | boolean;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface RelatedLink {
  title: string;
  href: string;
  description: string;
}

export interface ContentSection {
  type: "intro" | "features" | "comparison" | "steps" | "benefits" | "stats" | "checklist";
  title?: string;
  content: string | FeatureItem[] | ComparisonRow[] | string[];
  variant?: number; // 1-10 for content variation tracking
}

export interface SEOPage {
  // Core identifiers
  slug: string;
  category: SEOCategory;
  status: PageStatus;

  // Metadata
  metadata: SEOMetadata;

  // Content sections
  hero: HeroSection;
  sections: ContentSection[];
  faq: FAQItem[];
  relatedLinks: RelatedLink[];

  // Tracking
  createdAt: string;
  updatedAt: string;
  rolloutBatch: number; // For gradual publishing

  // Dynamic data for uniqueness
  niche?: string;
  primaryTool?: string;
  secondaryTool?: string;
}

// Content block types for variation system
export interface IntroBlock {
  id: string;
  category: SEOCategory;
  template: string; // Template with {placeholders}
}

export interface FeatureBlock {
  id: string;
  category: SEOCategory;
  features: FeatureItem[];
}

export interface FAQBlock {
  id: string;
  category: SEOCategory;
  items: FAQItem[];
}

export interface ContentBlocks {
  intros: IntroBlock[];
  features: FeatureBlock[];
  faqs: FAQBlock[];
}

// Keyword manifest for programmatic generation
export interface KeywordEntry {
  slug: string;
  category: SEOCategory;
  primaryKeyword: string;
  secondaryKeywords: string[];
  niche?: string;
  toolA?: string;
  toolB?: string;
  searchVolume?: number;
  difficulty?: number;
  priority: 1 | 2 | 3;
}

export interface KeywordManifest {
  comparisons: KeywordEntry[];
  nicheTools: KeywordEntry[];
  howTo: KeywordEntry[];
  alternatives: KeywordEntry[];
  longTail: KeywordEntry[];
}
