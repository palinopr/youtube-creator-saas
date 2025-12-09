const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ChannelStats {
  channel_id: string;
  title: string;
  description: string;
  subscriber_count: number;
  view_count: number;
  video_count: number;
  thumbnail_url: string;
}

export interface VideoStats {
  video_id: string;
  title: string;
  published_at: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  thumbnail_url: string;
}

export interface AgentResponse {
  question: string;
  answer: string;
  timestamp: string;
}

class ApiClient {
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

  // Auth
  async getAuthStatus(): Promise<{ authenticated: boolean }> {
    return this.request("/auth/status");
  }

  async logout(): Promise<void> {
    await this.request("/auth/logout", { method: "POST" });
  }

  getLoginUrl(): string {
    return `${this.baseUrl}/auth/login`;
  }

  // Channel
  async getChannelStats(): Promise<ChannelStats> {
    return this.request("/api/channel/stats");
  }

  // Videos
  async getRecentVideos(limit: number = 10): Promise<VideoStats[]> {
    return this.request(`/api/videos/recent?limit=${limit}`);
  }

  async getVideoDetails(videoId: string): Promise<VideoStats> {
    return this.request(`/api/videos/${videoId}`);
  }

  // Analytics
  async getAnalyticsOverview(days: number = 30): Promise<any> {
    return this.request(`/api/analytics/overview?days=${days}`);
  }

  // Agent
  async queryAgent(question: string): Promise<AgentResponse> {
    return this.request("/api/agent/query", {
      method: "POST",
      body: JSON.stringify({ question }),
    });
  }
}

export const api = new ApiClient(API_URL);

