// Supabase REST API client for waitlist (no SDK, direct REST calls)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

interface WaitlistSignup {
  email: string;
  referral_source?: string;
}

interface WaitlistEntry {
  id: string;
  email: string;
  position: number;
  status: "pending" | "confirmed" | "invited" | "converted";
  confirmation_token: string;
  confirmed_at: string | null;
  created_at: string;
}

interface SupabaseResponse<T> {
  data: T | null;
  error: string | null;
}

// Common headers for Supabase REST API
function getHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

/**
 * Submit a new waitlist signup
 */
export async function submitWaitlistSignup(
  data: WaitlistSignup
): Promise<SupabaseResponse<WaitlistEntry>> {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        email: data.email.toLowerCase().trim(),
        referral_source: data.referral_source || null,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      // Check for duplicate email
      if (response.status === 409 || errorText.includes("duplicate")) {
        return { data: null, error: "This email is already on the waitlist!" };
      }

      console.error("Supabase error:", errorText);
      return { data: null, error: "Failed to join waitlist. Please try again." };
    }

    const entries = await response.json();
    const entry = Array.isArray(entries) ? entries[0] : entries;

    // Trigger confirmation email via Edge Function
    if (entry && entry.confirmation_token) {
      await sendConfirmationEmail(entry.email, entry.confirmation_token);
    }

    return { data: entry, error: null };
  } catch (error) {
    console.error("Waitlist signup error:", error);
    return { data: null, error: "Network error. Please try again." };
  }
}

/**
 * Send confirmation email via Supabase Edge Function
 */
async function sendConfirmationEmail(
  email: string,
  confirmation_token: string
): Promise<void> {
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/send-waitlist-confirmation`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, confirmation_token }),
    });
  } catch (error) {
    console.error("Failed to send confirmation email:", error);
    // Don't throw - signup still succeeded
  }
}

/**
 * Confirm a waitlist email by token
 */
export async function confirmWaitlistEmail(
  token: string
): Promise<SupabaseResponse<WaitlistEntry>> {
  try {
    // First, find the entry by token
    const findResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/waitlist?confirmation_token=eq.${token}&select=*`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );

    if (!findResponse.ok) {
      return { data: null, error: "Invalid confirmation link" };
    }

    const entries = await findResponse.json();
    if (!entries || entries.length === 0) {
      return { data: null, error: "Invalid confirmation link" };
    }

    const entry = entries[0];

    // Already confirmed?
    if (entry.status === "confirmed") {
      return { data: entry, error: null };
    }

    // Update status to confirmed
    const updateResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/waitlist?confirmation_token=eq.${token}`,
      {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
        }),
      }
    );

    if (!updateResponse.ok) {
      return { data: null, error: "Failed to confirm email" };
    }

    const updated = await updateResponse.json();
    return { data: Array.isArray(updated) ? updated[0] : updated, error: null };
  } catch (error) {
    console.error("Confirm email error:", error);
    return { data: null, error: "Network error. Please try again." };
  }
}
