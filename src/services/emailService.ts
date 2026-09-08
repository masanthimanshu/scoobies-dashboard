/**
 * Email Service for Scoobies AI Advisor
 * Integrates with Resend REST API to send formatted executive briefings.
 */

const STORAGE_KEY_RESEND_KEY = "scoobies_resend_api_key";
const DEFAULT_FROM_ADDRESS = "Logs <logs@email.scoobies.ai>";
const PROXY_ENDPOINT = "/api/resend/emails";
const DIRECT_ENDPOINT = "https://api.resend.com/emails";

export function getActiveResendApiKey(): string {
  const localKey = localStorage.getItem(STORAGE_KEY_RESEND_KEY);
  if (localKey && localKey.trim()) {
    return localKey.trim();
  }
  const envKey =
    import.meta.env.RESEND_API_KEY || import.meta.env.VITE_RESEND_API_KEY;
  if (envKey && typeof envKey === "string" && envKey.trim()) {
    return envKey.trim();
  }
  return "";
}

export function setActiveResendApiKey(key: string) {
  if (key.trim()) {
    localStorage.setItem(STORAGE_KEY_RESEND_KEY, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_RESEND_KEY);
  }
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

interface SendEmailResponse {
  id: string;
  success: boolean;
  message?: string;
}

/**
 * Sends a rich HTML email via the Resend API (using Vite dev proxy /api/resend to avoid browser CORS issues).
 */
export async function sendEmailWithResend(
  options: SendEmailOptions,
): Promise<SendEmailResponse> {
  const apiKey = getActiveResendApiKey();
  if (!apiKey) {
    throw new Error(
      "Resend API Key is missing. Please add RESEND_API_KEY to your .env file or enter it in the share dialog.",
    );
  }

  const recipients = Array.isArray(options.to)
    ? options.to
    : [options.to.trim()];

  // Validate recipient email
  for (const email of recipients) {
    if (!email || !email.includes("@")) {
      throw new Error(`Invalid recipient email address: "${email}"`);
    }
  }

  const payload = {
    from: options.from || DEFAULT_FROM_ADDRESS,
    to: recipients,
    subject: options.subject,
    html: options.html,
    ...(options.replyTo ? { reply_to: options.replyTo } : {}),
  };

  // Determine endpoint (use proxy in browser to avoid CORS)
  const endpoint = PROXY_ENDPOINT;

  try {
    let response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // If proxy returned 404 (e.g. static production deployment), retry direct
    if (response.status === 404 && endpoint === PROXY_ENDPOINT) {
      response = await fetch(DIRECT_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    }

    interface ResendApiResponse {
      id?: string;
      message?: string;
      error?: string | { message?: string };
    }
    let data: ResendApiResponse | null = null;
    try {
      data = (await response.json()) as ResendApiResponse;
    } catch {
      data = null;
    }

    if (!response.ok) {
      const errorMsg =
        data?.message ||
        (typeof data?.error === "object"
          ? data?.error?.message
          : data?.error) ||
        response.statusText;

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          `Resend Authentication Error (401): ${errorMsg || "Invalid API Key. Please verify RESEND_API_KEY in .env."}`,
        );
      }
      if (response.status === 422) {
        throw new Error(
          `Resend Sandbox Restriction: ${errorMsg || "On Resend's free tier (onboarding@resend.dev), you can only send test emails to your own registered account email address. To send to any recipient, verify your domain at resend.com/domains."}`,
        );
      }
      throw new Error(
        `Resend Error (${response.status}): ${errorMsg || "Failed to send email"}`,
      );
    }

    return {
      id: data?.id || "sent",
      success: true,
      message: "Email sent successfully!",
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(message);
  }
}
