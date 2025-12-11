/**
 * Shared utility functions for the YouTube Creator SaaS
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
