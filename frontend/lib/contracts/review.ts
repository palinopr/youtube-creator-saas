export type ReviewVerdict = "approve" | "warn" | "block";
export type RiskLevel = "low" | "medium" | "high";
export type Confidence = "low" | "medium" | "high";

export type ReviewChangeInput = {
  channel_id: string;
  video_id: string;
  current_title: string;
  current_description: string;
  proposed_title: string;
  proposed_description: string;
};

export type ConservativeSuggestion = {
  title?: string;
  description?: string;
};

export type ReviewMetadata = {
  compared_against?: string;
  notes: string[];
};

export type ReviewReasons = [string] | [string, string] | [string, string, string];

// Strict contract: do not add fields here.
export type ReviewChangeOutput = {
  verdict: ReviewVerdict;
  risk_level: RiskLevel;
  reasons: ReviewReasons; // max 3
  confidence: Confidence;
  conservative_suggestion?: ConservativeSuggestion;
  metadata?: ReviewMetadata;
};
