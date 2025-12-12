/**
 * Centralized configuration for the frontend application.
 * All environment-dependent values should be imported from here.
 */

// API Configuration
// Trim to avoid malformed URLs if env values include whitespace/newlines.
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").trim();

// Auth endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: `${API_URL}/auth/login`,
  LOGOUT: `${API_URL}/auth/logout`,
  STATUS: `${API_URL}/auth/status`,
} as const;

// API endpoint prefixes
export const API_ENDPOINTS = {
  CHANNEL: `${API_URL}/api/channel`,
  VIDEOS: `${API_URL}/api/videos`,
  AGENT: `${API_URL}/api/agent`,
  SEO: `${API_URL}/api/seo`,
  CLIPS: `${API_URL}/api/clips`,
  ANALYSIS: `${API_URL}/api/analysis`,
  YOUTUBE: `${API_URL}/api/youtube`,
  BILLING: `${API_URL}/api/billing`,
  ADMIN: `${API_URL}/api/admin`,
  USER: `${API_URL}/api/user`,
} as const;

// Admin endpoints
export const ADMIN_ENDPOINTS = {
  STATUS: `${API_ENDPOINTS.ADMIN}/status`,
  SEO_RANKINGS: `${API_ENDPOINTS.ADMIN}/seo/rankings`,
  SEO_DOMAINS: `${API_ENDPOINTS.ADMIN}/seo/domains`,
  SEO_KEYWORDS: `${API_ENDPOINTS.ADMIN}/seo/keywords`,
  SEO_SUGGESTED: `${API_ENDPOINTS.ADMIN}/seo/suggested-keywords`,
  // Dashboard
  DASHBOARD: `${API_ENDPOINTS.ADMIN}/dashboard`,
  // User management
  USERS: `${API_ENDPOINTS.ADMIN}/users`,
  // Subscriptions
  SUBSCRIPTIONS: `${API_ENDPOINTS.ADMIN}/subscriptions`,
  // Revenue
  REVENUE_METRICS: `${API_ENDPOINTS.ADMIN}/revenue/metrics`,
  // Analytics
  ANALYTICS_USERS: `${API_ENDPOINTS.ADMIN}/analytics/users`,
  ANALYTICS_FEATURES: `${API_ENDPOINTS.ADMIN}/analytics/features`,
  ANALYTICS_SYSTEM: `${API_ENDPOINTS.ADMIN}/analytics/system`,
  // Activity log
  ACTIVITY_LOG: `${API_ENDPOINTS.ADMIN}/activity-log`,
  // Impersonation
  IMPERSONATE_END: `${API_ENDPOINTS.ADMIN}/impersonate/end`,
  // API Costs
  API_COSTS_SUMMARY: `${API_ENDPOINTS.ADMIN}/api-costs/summary`,
  API_COSTS_BREAKDOWN: `${API_ENDPOINTS.ADMIN}/api-costs/breakdown`,
  API_COSTS_RECENT: `${API_ENDPOINTS.ADMIN}/api-costs/recent`,
  API_COSTS_BY_USER: `${API_ENDPOINTS.ADMIN}/api-costs/by-user`,
} as const;

// Billing endpoints
export const BILLING_ENDPOINTS = {
  PLANS: `${API_ENDPOINTS.BILLING}/plans`,
  SUBSCRIPTION: `${API_ENDPOINTS.BILLING}/subscription`,
  CHECKOUT: `${API_ENDPOINTS.BILLING}/checkout`,
  PORTAL: `${API_ENDPOINTS.BILLING}/portal`,
  USAGE: `${API_ENDPOINTS.BILLING}/usage`,
  DOWNGRADE: `${API_ENDPOINTS.BILLING}/downgrade`,
  INVOICES: `${API_ENDPOINTS.BILLING}/invoices`,
  PAYMENT_METHOD: `${API_ENDPOINTS.BILLING}/payment-method`,
  NEXT_BILLING: `${API_ENDPOINTS.BILLING}/next-billing`,
} as const;

// User endpoints
export const USER_ENDPOINTS = {
  PROFILE: `${API_ENDPOINTS.USER}/profile`,
  SETTINGS: `${API_ENDPOINTS.USER}/settings`,
  CHANNELS: `${API_ENDPOINTS.USER}/channels`,
  EXPORT_DATA: `${API_ENDPOINTS.USER}/export-data`,
  REQUEST_DELETION: `${API_ENDPOINTS.USER}/request-deletion`,
  CANCEL_DELETION: `${API_ENDPOINTS.USER}/cancel-deletion`,
} as const;

// App configuration
export const APP_CONFIG = {
  APP_NAME: "YouTube Creator SaaS",
  DEFAULT_VIDEO_LIMIT: 10,
  DEFAULT_ANALYTICS_DAYS: 30,
} as const;
