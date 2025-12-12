export type Platform = "youtube";

export type FormatCluster = {
  name: string;
  criteria_summary: string;
};

export type NumberRange = {
  low: number;
  high: number;
};

export type FormatBaseline = {
  format_name: string;
  ctr_range: NumberRange; // ratio 0..1
  avd_range: NumberRange; // seconds
  retention_notes: string;
};

export type TitlePatternGroup = {
  winners: string[];
  losers: string[];
};

export type ChannelMemory = {
  channel_id: string;
  platform: Platform;
  video_count_analyzed: number;
  format_clusters: FormatCluster[];
  baselines: FormatBaseline[];
  common_title_patterns: TitlePatternGroup;
  common_description_structure_issues: string[];
  last_updated: string; // ISO-8601 datetime
};
