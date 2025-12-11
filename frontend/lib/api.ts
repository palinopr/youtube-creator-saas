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
}

export const api = new ApiClient(API_URL);

