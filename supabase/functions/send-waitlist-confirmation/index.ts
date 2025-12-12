import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://www.tubegrow.io";

interface WaitlistRequest {
  email: string;
  confirmation_token: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, confirmation_token }: WaitlistRequest = await req.json();

    if (!email || !confirmation_token) {
      return new Response(
        JSON.stringify({ error: "Missing email or confirmation_token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const confirmationUrl = `${FRONTEND_URL}/waitlist/confirm?token=${confirmation_token}`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your TubeGrow Waitlist Spot</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0f;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0f; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background: linear-gradient(180deg, rgba(239, 68, 68, 0.1) 0%, rgba(10, 10, 15, 1) 100%); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1);">
          <tr>
            <td style="padding: 40px 32px;">
              <!-- Logo -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 32px;">
                    <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); border-radius: 12px; display: inline-block; text-align: center; line-height: 48px;">
                      <span style="color: white; font-size: 24px;">▶</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Headline -->
              <h1 style="margin: 0 0 16px 0; font-size: 28px; font-weight: 600; color: #ffffff; text-align: center; line-height: 1.3;">
                You're almost in!
              </h1>

              <!-- Subtext -->
              <p style="margin: 0 0 32px 0; font-size: 16px; color: rgba(255, 255, 255, 0.7); text-align: center; line-height: 1.6;">
                Click the button below to confirm your spot on the TubeGrow waitlist and get early access to AI-powered YouTube analytics.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 32px;">
                    <a href="${confirmationUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);">
                      Confirm My Spot
                    </a>
                  </td>
                </tr>
              </table>

              <!-- What you'll get -->
              <div style="background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <p style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #ffffff;">
                  What you'll get access to:
                </p>
                <ul style="margin: 0; padding-left: 20px; color: rgba(255, 255, 255, 0.7); font-size: 14px; line-height: 1.8;">
                  <li>AI-powered channel analytics</li>
                  <li>Video SEO optimization tools</li>
                  <li>Viral clips generator</li>
                  <li>Deep performance insights</li>
                </ul>
              </div>

              <!-- Footer -->
              <p style="margin: 0; font-size: 13px; color: rgba(255, 255, 255, 0.4); text-align: center; line-height: 1.6;">
                If you didn't sign up for TubeGrow, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer logo -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px;">
          <tr>
            <td style="padding: 24px; text-align: center;">
              <span style="color: rgba(255, 255, 255, 0.3); font-size: 14px;">TubeGrow</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    // Send email via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "TubeGrow <noreply@tubegrow.io>",
        to: [email],
        subject: "Confirm your TubeGrow waitlist spot",
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Resend API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
