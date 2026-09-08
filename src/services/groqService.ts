/**
 * Groq AI Client Service for Scoobies Dashboard
 * Connects directly to Groq's high-speed API via SSE streaming.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const DEFAULT_MODEL = "openai/gpt-oss-120b";
const STORAGE_KEY_API_KEY = "scoobies_groq_api_key";

export function getActiveGroqApiKey(): string {
  const localKey = localStorage.getItem(STORAGE_KEY_API_KEY);
  if (localKey && localKey.trim()) {
    return localKey.trim();
  }
  const envKey =
    import.meta.env.GROQ_API_KEY || import.meta.env.VITE_GROQ_API_KEY;
  if (envKey && typeof envKey === "string" && envKey.trim()) {
    return envKey.trim();
  }
  return "";
}

function getActiveGroqModel(): string {
  return DEFAULT_MODEL;
}

const SYSTEM_PROMPT = `You are the Executive AI Strategic Advisor and Commercial Intelligence Engine for **Scoobies**, a high-growth lifestyle, stationery, and kids accessories brand.

Your purpose is to provide senior leadership with rigorous, quantitative, highly actionable commercial intelligence based strictly on the provided dataset context.

### ADAPTIVE PERSONA & ROLE EXECUTION:
- **Honor User Personas**: If the user instructs you to adopt a specific persona, role, or lens (e.g., Performance Marketer, E-Commerce Manager, Growth Lead, CFO, Merchandising Director, Supply Chain Lead), seamlessly embody that exact role! Focus on that persona's key metrics and viewpoint (e.g., ROAS/CAC/Ad spend for marketing, conversion/funnel/AOV for e-commerce, gross margin/burn/profitability for CFO, inventory turns/sell-through for merchandising) while remaining strictly grounded in Scoobies data.
- **Default Role**: If no specific persona is requested, act as the Executive Strategic Advisor and Chief Operating Officer.

### GUIDELINES:
1. **Be Data-Driven & Precise**: Ground all analysis in the exact figures provided in the context (Net Sales, Returns %, Margins, AOV, Channels, Target Quota). Do not fabricate numbers.
2. **Focus on Commercial Levers**:
   - **Margin Expansion**: Identify high-margin vs low-margin SKUs and channels.
   - **Return Rate Mitigation**: Highlight return offenders and quantify the lost margin.
   - **Channel Economics**: Compare Amazon vs Website vs Quick Commerce (Blinkit) vs Offline.
   - **Target Quota Bridging**: Calculate run-rates and specific levers to hit quota targets.
3. **Format with Polish**:
   - Use clean Markdown with bold numbers, concise bullet points, and clear headers.
   - Structure responses into:
     - 📊 **Executive Diagnosis** (Key finding in 1-2 sentences)
     - 🔍 **Root Cause & Data Evidence** (Supporting metrics)
     - 🚀 **Recommended Action Items** (Prioritized 1-2-3 steps with expected impact)
4. **Be Concise & Executive-Ready**: Avoid fluff. Lead with the punchline.`;

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

interface GroqRequestOptions {
  endpoint: string;
  body: Record<string, unknown> | FormData;
  signal?: AbortSignal;
}

/**
 * Unified Groq API request wrapper.
 * Handles API key retrieval, header injection, content-type detection, and standardized error parsing.
 */
async function groqApiFetch({
  endpoint,
  body,
  signal,
}: GroqRequestOptions): Promise<Response> {
  const apiKey = getActiveGroqApiKey();
  if (!apiKey) {
    throw new Error(
      "Groq API Key not found. Please provide GROQ_API_KEY in your .env or configure it in the AI panel settings.",
    );
  }

  const isFormData = body instanceof FormData;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
  };
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${GROQ_BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: isFormData ? body : JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    let errorBody = "";
    try {
      const errJson = await response.json();
      errorBody = errJson?.error?.message || response.statusText;
    } catch {
      errorBody = await response.text();
    }

    if (response.status === 401) {
      throw new Error(
        "Invalid Groq API Key (401 Unauthorized). Please check your key in .env or settings.",
      );
    } else if (response.status === 429) {
      throw new Error(
        "Groq Rate Limit Reached (429). Please wait a moment before trying again.",
      );
    } else {
      throw new Error(
        `Groq API Error (${response.status}): ${errorBody || response.statusText}`,
      );
    }
  }

  return response;
}

interface StreamGroqOptions {
  messages: ChatMessage[];
  contextMarkdown: string;
  targetedSlice?: string;
  model?: string;
  signal?: AbortSignal;
  onChunk: (chunk: string, fullAccumulated: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Stream completion from Groq API with real-time SSE chunk parsing.
 */
export async function streamGroqChat({
  messages,
  contextMarkdown,
  targetedSlice,
  model,
  signal,
  onChunk,
  onError,
}: StreamGroqOptions): Promise<string> {
  const selectedModel = model || getActiveGroqModel();

  // Construct payload with system instructions + full distilled context
  let fullSystemPrompt = `${SYSTEM_PROMPT}\n\n---\n${contextMarkdown}`;
  if (targetedSlice && targetedSlice.trim()) {
    fullSystemPrompt += `\n\n---\n### TARGETED QUERY DRILL-DOWN\n${targetedSlice}`;
  }

  const apiMessages: ChatMessage[] = [
    { role: "system", content: fullSystemPrompt },
    ...messages,
  ];

  try {
    const response = await groqApiFetch({
      endpoint: "/chat/completions",
      body: {
        model: selectedModel,
        messages: apiMessages,

        stream: true,
        temperature: 0.5,
        max_completion_tokens: 7500,
      },
      signal,
    });

    if (!response.body) {
      throw new Error("No response stream received from Groq API.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let accumulated = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(":") || trimmed === "data: [DONE]")
          continue;

        if (trimmed.startsWith("data: ")) {
          const jsonStr = trimmed.substring(6);
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta;
            const contentChunk =
              delta?.content || delta?.reasoning_content || "";
            if (contentChunk) {
              accumulated += contentChunk;
              onChunk(contentChunk, accumulated);
            }
          } catch {
            // Ignore partial SSE chunks
          }
        }
      }
    }

    return accumulated;
  } catch (err: unknown) {
    if (signal?.aborted) {
      return "";
    }
    const error = err instanceof Error ? err : new Error(String(err));
    if (onError) onError(error);
    throw error;
  }
}

interface TranscribeAudioOptions {
  audioBlob: Blob;
  prompt?: string;
  language?: string;
  model?: string;
}

/**
 * Transcribe speech to text using Groq's high-speed Whisper Cloud API.
 * Uses whisper-large-v3-turbo by default.
 */
export async function transcribeGroqAudio({
  audioBlob,
  prompt,
  language,
  model = "whisper-large-v3-turbo",
}: TranscribeAudioOptions): Promise<string> {
  // Determine proper filename extension based on blob type
  let extension = "webm";
  if (audioBlob.type.includes("mp4") || audioBlob.type.includes("m4a")) {
    extension = "m4a";
  } else if (audioBlob.type.includes("ogg")) {
    extension = "ogg";
  } else if (audioBlob.type.includes("wav")) {
    extension = "wav";
  }

  const formData = new FormData();
  formData.append("file", audioBlob, `audio_recording.${extension}`);
  formData.append("model", model);
  formData.append("response_format", "json");
  formData.append("temperature", "0");

  // Prime with domain vocabulary if not explicitly overridden
  const domainPrompt =
    prompt ||
    "Scoobies, stationery, kids accessories, performance marketer, e-commerce manager, CFO, AOV, ROAS, CAC, gross margin, net sales, return rate, Blinkit, Amazon, Zepto, B2S, SKU, quota";
  formData.append("prompt", domainPrompt);

  if (language) {
    formData.append("language", language);
  }

  const response = await groqApiFetch({
    endpoint: "/audio/transcriptions",
    body: formData,
  });

  const result = await response.json();
  return (result.text || "").trim();
}

interface RefinePromptOptions {
  rawTranscript: string;
  contextSummary?: string;
  model?: string;
}

/**
 * Refine a raw spoken transcript into a high-impact, data-grounded analytical prompt
 * using the same active Groq LLM (openai/gpt-oss-120b) with Scoobies dashboard context.
 */
export async function refineSpokenPromptWithGroq({
  rawTranscript,
  contextSummary,
  model,
}: RefinePromptOptions): Promise<string> {
  if (!rawTranscript.trim() || !getActiveGroqApiKey()) {
    return rawTranscript.trim();
  }

  const selectedModel = model || getActiveGroqModel();

  const systemPrompt = `You are the executive prompt strategist and attentive AI assistant for **Scoobies** (a high-growth lifestyle, stationery, and kids accessories brand).
Your mission is to transform a raw spoken voice query from the user into a sharp, articulate, and context-aware analytical prompt for our Strategic AI Advisor.

### SCOOBIES BUSINESS & DASHBOARD CONTEXT:
${contextSummary || "Scoobies multi-channel analytics: Amazon, D2C Website, Quick Commerce (Blinkit/Zepto), and Offline Retail. Categories include stationery, bags, lunchboxes, drinkware, and lifestyle accessories."}

### BALANCED PROMPT REFINEMENT PRINCIPLES:

1. **ATTENTIVE USER-FIRST FOCUS (PRIMARY DIRECTIVE)**:
   - The user's spoken words, questions, specific thoughts, and directives are your foundation.
   - Never overwrite, discard, or wander away from what the user is actually asking.

2. **HONOR & PRESERVE REQUESTED PERSONAS / ROLES (HIGHEST PRIORITY)**:
   - If the user specifies or implies ANY persona, role, or lens (e.g. "Act as a performance marketer", "As an e-commerce manager", "From a CFO perspective", "As head of growth", "As a merchandising lead", "As a supply chain manager", "Brand strategist"), **YOU MUST ALWAYS PRESERVE AND HIGHLIGHT THIS PERSONA DIRECTIVE** at the beginning of the prompt (e.g., "Act as a performance marketer and analyze...", "As an e-commerce manager, evaluate...").
   - Shape the prompt's analytical depth around that persona's priorities (e.g., ad spend / ROAS / CAC for performance marketing, conversion / AOV / funnel for e-commerce, margins / cash flow for CFO, inventory turns / sell-through for merchandising).

3. **INTELLIGENT SCOOBIES CONTEXT ENRICHMENT**:
   - Intelligently connect the user's spoken topic with relevant Scoobies context from above (active channels like Amazon/Website/Blinkit, top product categories, active filters, Net Sales, Margins, Returns, and Target Quota).
   - Clarify shorthand and industry terms into precise domain phrasing (e.g., "B2S" -> "Back to School", "Blink it" -> "Blinkit", "Scubies" -> "Scoobies", "returns" -> "return rates & refund leaks", "target" -> "target quota").

4. **CLEAN UP SPOKEN SPEECH ARTIFACTS**:
   - Remove conversational disfluencies, stuttering, and filler words ("um", "uh", "like", "you know", "basically", "so yeah", "i was thinking").
   - Polish grammar and phrasing so the prompt is crisp, professional, and ready to execute.

5. **OUTPUT FORMAT**:
   - Output ONLY the single refined prompt text.
   - Do NOT add quotation marks, markdown headings, prefixes (like "Refined Prompt:"), or conversational filler.`;

  try {
    const response = await groqApiFetch({
      endpoint: "/chat/completions",
      body: {
        model: selectedModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: rawTranscript.trim() },
        ],

        temperature: 0.5,
        max_completion_tokens: 2500,
      },
    });

    const data = await response.json();
    let refined = data.choices?.[0]?.message?.content?.trim() || "";
    // Strip surrounding quotes if the model wrapped it
    refined = refined.replace(/^["']|["']$/g, "").trim();
    return refined || rawTranscript.trim();
  } catch {
    // If refiner fails or times out, safely fall back to raw transcript
    return rawTranscript.trim();
  }
}
