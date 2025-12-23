/**
 * Waitlist API client.
 * Calls backend FastAPI endpoints instead of Supabase.
 */

import { API_URL } from "./config";

interface WaitlistSignup {
  email: string;
  referral_source?: string;
}

interface WaitlistSignupResponse {
  success: boolean;
  message: string;
  position?: number;
}

interface WaitlistConfirmResponse {
  success: boolean;
  message: string;
  email?: string;
}

interface WaitlistStatusResponse {
  email: string;
  status: "pending" | "confirmed" | "invited" | "converted";
  position: number;
  confirmed_at: string | null;
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Submit a new waitlist signup.
 * Backend handles email sending automatically.
 */
export async function submitWaitlistSignup(
  data: WaitlistSignup
): Promise<ApiResponse<WaitlistSignupResponse>> {
  try {
    const response = await fetch(`${API_URL}/api/waitlist/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email.toLowerCase().trim(),
        referral_source: data.referral_source || null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || "Failed to join waitlist. Please try again.";

      // Check for duplicate email (422 Unprocessable Entity from FastAPI)
      if (response.status === 422 || errorMessage.includes("already")) {
        return { data: null, error: "This email is already on the waitlist!" };
      }

      return { data: null, error: errorMessage };
    }

    const result: WaitlistSignupResponse = await response.json();
    return { data: result, error: null };
  } catch (error) {
    console.error("Waitlist signup error:", error);
    return { data: null, error: "Network error. Please try again." };
  }
}

/**
 * Confirm a waitlist email by token.
 */
export async function confirmWaitlistEmail(
  token: string
): Promise<ApiResponse<WaitlistConfirmResponse>> {
  try {
    const response = await fetch(`${API_URL}/api/waitlist/confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        data: null,
        error: errorData.detail || "Invalid confirmation link",
      };
    }

    const result: WaitlistConfirmResponse = await response.json();
    return { data: result, error: null };
  } catch (error) {
    console.error("Confirm email error:", error);
    return { data: null, error: "Network error. Please try again." };
  }
}

/**
 * Get waitlist status by token.
 */
export async function getWaitlistStatus(
  token: string
): Promise<ApiResponse<WaitlistStatusResponse>> {
  try {
    const response = await fetch(`${API_URL}/api/waitlist/status/${token}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        data: null,
        error: errorData.detail || "Token not found",
      };
    }

    const result: WaitlistStatusResponse = await response.json();
    return { data: result, error: null };
  } catch (error) {
    console.error("Get waitlist status error:", error);
    return { data: null, error: "Network error. Please try again." };
  }
}
