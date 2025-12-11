import { API_URL } from "./config";

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

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string | null;
  last_login_at: string | null;
  subscription: {
    plan_id: string;
    status: string;
  };
  channels: YouTubeChannel[];
  channels_count: number;
}

export interface YouTubeChannel {
  id: string;
  channel_id: string;
  title: string;
  thumbnail_url: string | null;
  subscriber_count: number;
  video_count: number;
  is_active: boolean;
}

export interface UserSettings {
  timezone: string;
  theme_preference: "dark" | "light";
  language: string;
  notification_preferences: {
    email_marketing: boolean;
    email_product_updates: boolean;
    email_weekly_digest: boolean;
    email_billing_alerts: boolean;
  };
}

export interface Invoice {
  id: string;
  number: string | null;
  status: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  created: string | null;
  period_start: string | null;
  period_end: string | null;
  invoice_pdf: string | null;
  hosted_invoice_url: string | null;
}

export interface PaymentMethod {
  type: string;
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

export interface NextBilling {
  next_billing_date: string | null;
  amount: number;
  currency: string;
  cancel_at_period_end: boolean;
}

// Alert types
export type AlertType = "viral" | "drop" | "milestone" | "engagement" | "comment_surge" | "opportunity" | "warning";
export type AlertPriority = "critical" | "high" | "medium" | "low";

export interface Alert {
  id: number;
  alert_type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  video_id: string | null;
  video_title: string | null;
  data: Record<string, any>;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
  read_at: string | null;
}

export interface AlertsResponse {
  alerts: Alert[];
  count: number;
  unread_count: number;
  generated_at: string;
}

export interface AlertTypeInfo {
  value: AlertType;
  label: string;
  description: string;
  icon: string;
}

export interface AlertPriorityInfo {
  value: AlertPriority;
  label: string;
  description: string;
  color: string;
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

  // User Profile
  async getProfile(): Promise<UserProfile> {
    return this.request("/api/user/profile");
  }

  async updateProfile(data: { name?: string; bio?: string }): Promise<{ message: string; user: Partial<UserProfile> }> {
    return this.request("/api/user/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // User Settings
  async getSettings(): Promise<UserSettings> {
    return this.request("/api/user/settings");
  }

  async updateSettings(data: Partial<UserSettings>): Promise<{ message: string; settings: UserSettings }> {
    return this.request("/api/user/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // User Channels
  async getUserChannels(): Promise<{ channels: YouTubeChannel[]; total: number }> {
    return this.request("/api/user/channels");
  }

  // Data Management (GDPR)
  async requestDataExport(): Promise<{ message: string; requested_at: string }> {
    return this.request("/api/user/export-data", { method: "POST" });
  }

  async requestAccountDeletion(confirmEmail: string, reason?: string): Promise<{ message: string; grace_period_ends: string }> {
    return this.request("/api/user/request-deletion", {
      method: "POST",
      body: JSON.stringify({ confirm_email: confirmEmail, reason }),
    });
  }

  async cancelAccountDeletion(): Promise<{ message: string }> {
    return this.request("/api/user/cancel-deletion", { method: "POST" });
  }

  // Billing - Invoices
  async getInvoices(limit: number = 10): Promise<{ invoices: Invoice[]; has_more: boolean }> {
    return this.request(`/api/billing/invoices?limit=${limit}`);
  }

  async getPaymentMethod(): Promise<{ payment_method: PaymentMethod | null }> {
    return this.request("/api/billing/payment-method");
  }

  async getNextBilling(): Promise<NextBilling> {
    return this.request("/api/billing/next-billing");
  }

  // Audience Intelligence
  async getAudienceDemographics(days: number = 30): Promise<any> {
    return this.request(`/api/audience/demographics?days=${days}`);
  }

  async getAudienceGeography(days: number = 30, limit: number = 20): Promise<any> {
    return this.request(`/api/audience/geography?days=${days}&limit=${limit}`);
  }

  async getAudienceDevices(days: number = 30): Promise<any> {
    return this.request(`/api/audience/devices?days=${days}`);
  }

  async getAudienceSummary(days: number = 30): Promise<any> {
    return this.request(`/api/audience/summary?days=${days}`);
  }

  // Traffic Sources
  async getTrafficSources(days: number = 30): Promise<any> {
    return this.request(`/api/traffic/sources?days=${days}`);
  }

  async getSubscriberSources(days: number = 30): Promise<any> {
    return this.request(`/api/traffic/subscribers?days=${days}`);
  }

  async getPlaybackLocations(days: number = 30): Promise<any> {
    return this.request(`/api/traffic/playback-locations?days=${days}`);
  }

  async getTrafficSummary(days: number = 30): Promise<any> {
    return this.request(`/api/traffic/summary?days=${days}`);
  }

  // Revenue & Monetization
  async getRevenueOverview(days: number = 30): Promise<any> {
    return this.request(`/api/revenue/overview?days=${days}`);
  }

  async getRevenueByCountry(days: number = 30, limit: number = 10): Promise<any> {
    return this.request(`/api/revenue/by-country?days=${days}&limit=${limit}`);
  }

  async getDailyRevenue(days: number = 30): Promise<any> {
    return this.request(`/api/revenue/daily?days=${days}`);
  }

  async getMonetizationStatus(): Promise<any> {
    return this.request("/api/revenue/status");
  }

  // Comment Intelligence
  async analyzeChannelComments(limit: number = 50, includeNotable: boolean = true): Promise<any> {
    return this.request(`/api/comments/analyze?limit=${limit}&include_notable=${includeNotable}`);
  }

  async analyzeVideoComments(videoId: string, limit: number = 50, includeNotable: boolean = true): Promise<any> {
    return this.request(`/api/comments/analyze/${videoId}?limit=${limit}&include_notable=${includeNotable}`);
  }

  async getCommentSentimentTrend(videoIds: string[], commentsPerVideo: number = 20): Promise<any> {
    const idsParam = videoIds.join(",");
    return this.request(`/api/comments/sentiment-trend?video_ids=${idsParam}&comments_per_video=${commentsPerVideo}`);
  }

  async getCommentQuestions(videoId?: string, limit: number = 50): Promise<any> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (videoId) params.set("video_id", videoId);
    return this.request(`/api/comments/questions?${params.toString()}`);
  }

  async getContentIdeasFromComments(videoId?: string, limit: number = 50): Promise<any> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (videoId) params.set("video_id", videoId);
    return this.request(`/api/comments/content-ideas?${params.toString()}`);
  }

  async getNotableCommenters(videoId?: string, minSubscribers: number = 1000): Promise<any> {
    const params = new URLSearchParams({ min_subscribers: minSubscribers.toString() });
    if (videoId) params.set("video_id", videoId);
    return this.request(`/api/comments/notable-commenters?${params.toString()}`);
  }

  // Alerts
  async getAlerts(limit: number = 20, unreadOnly: boolean = false, alertType?: AlertType): Promise<AlertsResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      unread_only: unreadOnly.toString(),
    });
    if (alertType) params.set("alert_type", alertType);
    return this.request(`/api/alerts?${params.toString()}`);
  }

  async getUnreadAlertCount(): Promise<{ unread_count: number }> {
    return this.request("/api/alerts/unread-count");
  }

  async markAlertRead(alertId: number): Promise<{ success: boolean; message: string; alert_id: number }> {
    return this.request(`/api/alerts/${alertId}/read`, { method: "POST" });
  }

  async markAllAlertsRead(): Promise<{ success: boolean; message: string; updated_count: number }> {
    return this.request("/api/alerts/read-all", { method: "POST" });
  }

  async dismissAlert(alertId: number): Promise<{ success: boolean; message: string; alert_id: number }> {
    return this.request(`/api/alerts/${alertId}/dismiss`, { method: "POST" });
  }

  async checkForAlerts(): Promise<{ success: boolean; new_alerts_count: number; alerts: Alert[]; message: string; checked_at: string }> {
    return this.request("/api/alerts/check", { method: "POST" });
  }

  async getAlertTypes(): Promise<{ types: AlertTypeInfo[] }> {
    return this.request("/api/alerts/types");
  }

  async getAlertPriorities(): Promise<{ priorities: AlertPriorityInfo[] }> {
    return this.request("/api/alerts/priorities");
  }
}

export const api = new ApiClient(API_URL);

