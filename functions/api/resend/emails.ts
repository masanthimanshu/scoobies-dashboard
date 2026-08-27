/**
 * Cloudflare Pages Function: /api/resend/emails
 * Proxies email sending requests to Resend API from Cloudflare Edge to avoid CORS issues.
 */

interface Env {
  RESEND_API_KEY?: string;
}

interface EventContext {
  request: Request;
  env: Env;
}

export async function onRequestPost(context: EventContext): Promise<Response> {
  const request = context.request;
  const clientAuth = request.headers.get("Authorization");
  const envAuth = context.env.RESEND_API_KEY
    ? `Bearer ${context.env.RESEND_API_KEY}`
    : "";
  const authHeader = clientAuth || envAuth;

  if (!authHeader) {
    return new Response(
      JSON.stringify({
        error: {
          message:
            "Missing Resend API Key. Pass Authorization header or configure RESEND_API_KEY in Cloudflare Pages settings.",
        },
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }

  try {
    const body = await request.json();

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const responseText = await resendResponse.text();

    return new Response(responseText, {
      status: resendResponse.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({
        error: { message: `Cloudflare Edge Proxy Error: ${errorMsg}` },
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
