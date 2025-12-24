/**
 * Shared utility functions for TubeGrow
 * Used across multiple components for consistent formatting
 */

/**
 * Format large numbers to human-readable strings
 * @example formatNumber(1234567) => "1.2M"
 * @example formatNumber(5678) => "5.7K"
 */
export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

/**
 * Format date string to localized short format
 * @example formatDate("2024-01-15T10:30:00Z") => "Jan 15, 2024"
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Parse ISO 8601 duration (PT5M30S) to readable format (5:30)
 * @example formatISODuration("PT1H5M30S") => "1:05:30"
 * @example formatISODuration("PT5M30S") => "5:30"
 */
export function formatISODuration(isoDuration: string | undefined): string {
  if (!isoDuration) return "";
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return isoDuration;

  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Format seconds to MM:SS or HH:MM:SS format
 * @example formatDuration(90) => "1:30"
 * @example formatDuration(3661) => "1:01:01"
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Get color classes for SEO/viral scores
 * @example getScoreColor(95) => "bg-green-500/30 text-green-400 border-green-500/50"
 */
export function getScoreColor(score: number): string {
  if (score >= 85) return "bg-green-500/30 text-green-400 border-green-500/50";
  if (score >= 70) return "bg-yellow-500/30 text-yellow-400 border-yellow-500/50";
  return "bg-orange-500/30 text-orange-400 border-orange-500/50";
}

/**
 * Get gradient color classes for SEO scores with more granularity
 * @example getDetailedScoreColor(95) => "bg-green-500/30 text-green-400"
 */
export function getDetailedScoreColor(score: number): string {
  if (score >= 95) return "bg-green-500/30 text-green-400";
  if (score >= 90) return "bg-blue-500/30 text-blue-400";
  if (score >= 85) return "bg-cyan-500/30 text-cyan-400";
  if (score >= 80) return "bg-yellow-500/30 text-yellow-400";
  if (score >= 75) return "bg-orange-500/30 text-orange-400";
  return "bg-gray-500/30 text-gray-400";
}

/**
 * Truncate text with ellipsis
 * @example truncate("Hello World", 5) => "Hello..."
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * Calculate YouTube tag character limit usage
 * Tags have a 500 character total limit
 * @example getTagsCharCount(["tag1", "tag2"]) => 9
 */
export function getTagsCharCount(tags: string[]): number {
  return tags.join(", ").length;
}

/**
 * Check if tags are within YouTube's 500 character limit
 */
export function isTagsWithinLimit(tags: string[]): boolean {
  return getTagsCharCount(tags) <= 500;
}

/**
 * Classname helper for conditional classes
 * @example cn("base", condition && "conditional", "always")
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Format date string to short label for chart axes
 * @example formatDateLabel("2024-01-15") => "Jan 15"
 */
export function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Format a decimal as percentage string
 * @example formatPercentage(0.1234) => "12.3%"
 * @example formatPercentage(0.5, 0) => "50%"
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 * @example formatRelativeTime("2024-01-15T10:30:00Z") => "2 hours ago"
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks !== 1 ? "s" : ""} ago`;
  return `${diffMonths} month${diffMonths !== 1 ? "s" : ""} ago`;
}

/**
 * Calculate percentage change between two values
 * @example calculateTrend(120, 100) => 20 (20% increase)
 * @example calculateTrend(80, 100) => -20 (20% decrease)
 */
export function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// ============================================
// Mobile Preview Utilities
// ============================================

/** YouTube mobile title truncation limit (chars visible before "...") */
export const MOBILE_TITLE_LIMIT = 48;

/** YouTube mobile description truncation limit (chars visible in search) */
export const MOBILE_DESC_LIMIT = 100;

/** YouTube mobile channel name truncation limit */
export const MOBILE_CHANNEL_LIMIT = 15;

export interface MobileTruncationResult {
  /** Whether the text is truncated on mobile */
  truncated: boolean;
  /** How the text appears on mobile (with "..." if truncated) */
  display: string;
  /** Number of characters hidden on mobile */
  hiddenChars: number;
  /** Warning message for user */
  warning: string | null;
  /** Original text length */
  originalLength: number;
  /** Character limit used */
  limit: number;
}

/**
 * Get mobile truncation info for a YouTube video title
 * @example getMobileTitleTruncation("This is a very long title...") => { truncated: true, ... }
 */
export function getMobileTitleTruncation(title: string): MobileTruncationResult {
  const originalLength = title.length;

  if (originalLength <= MOBILE_TITLE_LIMIT) {
    return {
      truncated: false,
      display: title,
      hiddenChars: 0,
      warning: null,
      originalLength,
      limit: MOBILE_TITLE_LIMIT,
    };
  }

  const hiddenChars = originalLength - MOBILE_TITLE_LIMIT;
  return {
    truncated: true,
    display: title.slice(0, MOBILE_TITLE_LIMIT) + "...",
    hiddenChars,
    warning: `Last ${hiddenChars} characters hidden on mobile`,
    originalLength,
    limit: MOBILE_TITLE_LIMIT,
  };
}

/**
 * Get mobile truncation info for a YouTube video description
 * Only the first ~100 chars show in mobile search results
 */
export function getMobileDescriptionTruncation(description: string): MobileTruncationResult {
  const originalLength = description.length;

  if (originalLength <= MOBILE_DESC_LIMIT) {
    return {
      truncated: false,
      display: description,
      hiddenChars: 0,
      warning: null,
      originalLength,
      limit: MOBILE_DESC_LIMIT,
    };
  }

  const hiddenChars = originalLength - MOBILE_DESC_LIMIT;
  return {
    truncated: true,
    display: description.slice(0, MOBILE_DESC_LIMIT) + "...",
    hiddenChars,
    warning: `Only first ${MOBILE_DESC_LIMIT} chars visible in mobile search`,
    originalLength,
    limit: MOBILE_DESC_LIMIT,
  };
}

/**
 * Get mobile truncation info for channel name
 */
export function getMobileChannelTruncation(channelName: string): MobileTruncationResult {
  const originalLength = channelName.length;

  if (originalLength <= MOBILE_CHANNEL_LIMIT) {
    return {
      truncated: false,
      display: channelName,
      hiddenChars: 0,
      warning: null,
      originalLength,
      limit: MOBILE_CHANNEL_LIMIT,
    };
  }

  return {
    truncated: true,
    display: channelName.slice(0, MOBILE_CHANNEL_LIMIT) + "...",
    hiddenChars: originalLength - MOBILE_CHANNEL_LIMIT,
    warning: null,
    originalLength,
    limit: MOBILE_CHANNEL_LIMIT,
  };
}

/**
 * Check if important keywords appear before the mobile truncation point
 * Returns list of keywords that will be hidden on mobile
 */
export function getHiddenKeywords(title: string, keywords: string[]): string[] {
  const visiblePart = title.slice(0, MOBILE_TITLE_LIMIT).toLowerCase();
  return keywords.filter(
    (keyword) => !visiblePart.includes(keyword.toLowerCase()) &&
                  title.toLowerCase().includes(keyword.toLowerCase())
  );
}
