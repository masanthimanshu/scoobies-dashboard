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
  const envKey = import.meta.env.GROQ_API_KEY;
  if (envKey && typeof envKey === "string" && envKey.trim()) {
    return envKey.trim();
  }
  return "";
}

export function getActiveGroqModel(): string {
  return DEFAULT_MODEL;
}

const SYSTEM_PROMPT = `You are the Executive AI Strategic Advisor and Chief Operating Officer for **Scoobies**, a high-growth lifestyle, stationery, and kids accessories brand.

Your purpose is to provide senior leadership with rigorous, quantitative, highly actionable commercial intelligence based strictly on the provided dataset context.

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

export interface StreamGroqOptions {
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
  const apiKey = getActiveGroqApiKey();
  if (!apiKey) {
    const err = new Error(
      "Groq API Key not found. Please provide GROQ_API_KEY in your .env or configure it in the AI panel settings.",
    );
    if (onError) onError(err);
    throw err;
  }

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
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: apiMessages,
          temperature: 0.5,
          max_completion_tokens: 8096,
          stream: true,
        }),
        signal,
      },
    );

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
