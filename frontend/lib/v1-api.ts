import { API_URL } from "./config";

// =============================================================================
// V1 API Types - matching backend/app/v1/contracts
// =============================================================================

// Enums matching backend contracts
export type ReviewVerdict = "approve" | "warn" | "block";
export type RiskLevel = "low" | "medium" | "high";
export type Confidence = "low" | "medium" | "high";
export type OutcomeStatus = "unknown" | "positive" | "neutral" | "negative";

// Review Change Input
export interface ReviewChangeRequest {
  channel_id: string;
  video_id: string;
  current_title: string;
  current_description: string;
  proposed_title: string;
  proposed_description: string;
}

// Conservative Suggestion - object with optional title and description
export interface ConservativeSuggestion {
  title?: string;
  description?: string;
}

// Review Metadata
export interface ReviewMetadata {
  compared_against?: string;
  notes?: string[];
}

// Review Change Output
export interface ReviewChangeOutput {
  verdict: ReviewVerdict;
  risk_level: RiskLevel;
  confidence: Confidence;
  reasons: string[];
  conservative_suggestion?: ConservativeSuggestion;
  metadata?: ReviewMetadata;
}

// Video Fields for before/after
export interface VideoFields {
  title: string;
  description: string;
}

// Change Log Entry - matches backend ChangeLogEntry contract
export interface ChangeLogEntry {
  review_id: string;
  object_type: "video";
  object_id: string;
  before: VideoFields;
  after: VideoFields;
  verdict: ReviewVerdict;
  risk_level: RiskLevel;
  confidence: Confidence;
  reasons: string[];
  created_at: string;
  outcome_status: OutcomeStatus;
  evaluated_at?: string | null;
}

// =============================================================================
// V1 API Client
// =============================================================================

class V1ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Unknown error" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async reviewChange(data: ReviewChangeRequest): Promise<ReviewChangeOutput> {
    return this.request("/api/v1/review", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getChangeLog(channelId: string, limit: number = 50): Promise<ChangeLogEntry[]> {
    const params = new URLSearchParams({
      channel_id: channelId,
      limit: limit.toString(),
    });
    return this.request(`/api/v1/change-log?${params.toString()}`);
  }
}

export const v1Api = new V1ApiClient(API_URL);
