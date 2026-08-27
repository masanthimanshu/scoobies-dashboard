import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  Share2,
  Copy,
  Check,
  Bot,
  User,
  TrendingUp,
  AlertTriangle,
  StopCircle,
  Mic,
  Square,
  Loader2,
} from "lucide-react";
import { marked } from "marked";
import {
  ChatMessage,
  streamGroqChat,
  getActiveGroqApiKey,
  transcribeGroqAudio,
  refineSpokenPromptWithGroq,
} from "../services/groqService";
import {
  DistilledSalesContext,
  formatDistilledContextToMarkdown,
  extractTargetedMicroSlice,
} from "../utils/aiContextDistiller";
import { generateOfflineStrategicBrief } from "../utils/offlineAiEngine";
import { SaleRecord } from "../types";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from "../utils/formatters";
import { ShareChatModal } from "./ShareChatModal";

// Configure marked with GitHub Flavored Markdown and line breaks
marked.setOptions({
  gfm: true,
  breaks: true,
});

interface AiAdvisorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  distilledContext: DistilledSalesContext;
  rawRecords: SaleRecord[];
  initialPrompt?: string | null;
  onClearInitialPrompt?: () => void;
}

const CHAT_STORAGE_KEY = "scoobies_ai_chat_history";

export const AiAdvisorDrawer: React.FC<AiAdvisorDrawerProps> = ({
  isOpen,
  onClose,
  distilledContext,
  rawRecords,
  initialPrompt,
  onClearInitialPrompt,
}) => {
  // Chat state initialized from localStorage
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to load chat history from localStorage:", e);
    }
    return [];
  });
  const [inputQuery, setInputQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Sync messages to localStorage whenever conversation updates
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
      } else {
        localStorage.removeItem(CHAT_STORAGE_KEY);
      }
    } catch (e) {
      console.warn("Failed to persist chat history to localStorage:", e);
    }
  }, [messages]);

  // Audio Recording & STT state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  // Abort controller ref for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height as content expands
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [inputQuery]);

  // Clean up audio streams and timers on unmount or drawer close
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Sync API Key state from .env
  const hasApiKey = useMemo(() => {
    return getActiveGroqApiKey().length > 0;
  }, []);

  // Context markdown for full chat
  const contextMarkdown = useMemo(() => {
    return formatDistilledContextToMarkdown(distilledContext);
  }, [distilledContext]);

  // Concise context summary for voice prompt refinement
  const contextSummary = useMemo(() => {
    const chNames = distilledContext.channels.map((c) => c.name).join(", ");
    const catNames = distilledContext.categories
      .slice(0, 8)
      .map((c) => c.name)
      .join(", ");
    return `Dataset: ${distilledContext.datasetInfo.totalRecords} records (${distilledContext.datasetInfo.dateSpan || "All time"}).
Active Filters: ${distilledContext.datasetInfo.activeFiltersDescription}.
Active Sales Channels: ${chNames || "All"}.
Top Product Categories: ${catNames || "All"}.
Key Metrics: Net Sales ${formatCurrency(distilledContext.kpis.netSales)}, Margin ${formatPercent(distilledContext.kpis.scoobiesMarginPct)}, Returns ${formatPercent(distilledContext.kpis.returnRateQtyPct)}, Target Quota ${formatCurrency(distilledContext.kpis.salesTarget)}.`;
  }, [distilledContext]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isGenerating, isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Handle Initial Prompt if triggered from external component (e.g. Executive Summary card)
  useEffect(() => {
    if (isOpen && initialPrompt) {
      handleSendMessage(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [isOpen, initialPrompt]);

  // Keyboard shortcut listener (Esc to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Stop active generation
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  // Clear chat
  const handleClearChat = () => {
    handleStop();
    setMessages([]);
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch (e) {
      console.warn("Failed to remove chat history from localStorage:", e);
    }
  };

  // Start Speech-to-Text recording
  const handleStartRecording = async () => {
    setAudioError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone access is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Determine best supported MIME type
      let options: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        options = { mimeType: "audio/webm;codecs=opus" };
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        options = { mimeType: "audio/webm" };
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        options = { mimeType: "audio/mp4" };
      }

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        // Stop audio tracks so the mic light turns off
        stream.getTracks().forEach((track) => track.stop());

        if (audioChunksRef.current.length === 0) {
          setIsTranscribing(false);
          return;
        }

        const mimeType = recorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];

        setIsTranscribing(true);
        try {
          // Step 1: Transcribe audio with Groq Whisper Large V3 Turbo
          const rawTranscript = await transcribeGroqAudio({
            audioBlob,
            model: "whisper-large-v3-turbo",
          });

          if (rawTranscript) {
            // Step 2: Refine spoken transcript with Groq 120B using active dashboard context
            const refinedPrompt = await refineSpokenPromptWithGroq({
              rawTranscript,
              contextSummary,
              model: "openai/gpt-oss-120b",
            });

            setInputQuery((prev) =>
              prev.trim() ? `${prev.trim()} ${refinedPrompt}` : refinedPrompt,
            );
            setTimeout(() => textareaRef.current?.focus(), 100);
          }
        } catch (err: unknown) {
          const msg =
            err instanceof Error ? err.message : "Failed to transcribe audio.";
          setAudioError(msg);
          setTimeout(() => setAudioError(null), 5000);
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordingDuration(0);

      timerIntervalRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Microphone access denied or unavailable.";
      setAudioError(msg);
      setTimeout(() => setAudioError(null), 5000);
    }
  };

  // Stop recording and trigger Whisper transcription
  const handleStopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Copy assistant response
  const handleCopyMessage = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Handle Send Chat
  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isGenerating) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: textToSend.trim(),
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputQuery("");

    // If no API Key is set, generate offline brief or prompt to configure
    if (!hasApiKey) {
      const offlineResponse = `${generateOfflineStrategicBrief(distilledContext)}

---
💡 **Want to ask custom interactive questions?**
Ensure \`GROQ_API_KEY\` is defined in your \`.env\` file to enable real-time Groq GPT OSS 120B answers.`;

      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: offlineResponse,
        },
      ]);
      return;
    }

    // Prepare streaming assistant response placeholder
    const assistantIndex = updatedMessages.length;
    setMessages([...updatedMessages, { role: "assistant", content: "" }]);
    setIsGenerating(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Semantic micro-slice for the question
    const targetedSlice = extractTargetedMicroSlice(
      textToSend,
      rawRecords,
      distilledContext,
    );

    try {
      await streamGroqChat({
        messages: updatedMessages,
        contextMarkdown,
        targetedSlice,
        model: "openai/gpt-oss-120b",
        signal: controller.signal,
        onChunk: (_chunk, accumulated) => {
          setMessages((prev) => {
            const next = [...prev];
            if (next[assistantIndex]) {
              next[assistantIndex] = {
                ...next[assistantIndex],
                content: accumulated,
              };
            }
            return next;
          });
        },
        onError: (err) => {
          setMessages((prev) => {
            const next = [...prev];
            if (next[assistantIndex]) {
              next[assistantIndex] = {
                ...next[assistantIndex],
                content: `⚠️ **Groq Error**: ${err.message}`,
              };
            }
            return next;
          });
        },
      });
    } catch (err: unknown) {
      if (!controller.signal.aborted) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setMessages((prev) => {
          const next = [...prev];
          if (next[assistantIndex]) {
            next[assistantIndex] = {
              ...next[assistantIndex],
              content: `⚠️ **Groq Error**: ${errorMsg}`,
            };
          }
          return next;
        });
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#2D2A26]/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-2xl bg-[#FAF8F5] shadow-2xl border-l border-[#EBE5D9] flex flex-col h-full z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#EBE5D9] bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#5F7161] flex items-center justify-center text-white shadow-sm border border-[#4A594C]">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-[#2D2A26] tracking-tight">
                  Scoobies AI Advisor
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E9EFEA] text-[#5F7161] border border-[#C5D5C7]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5F7161] animate-pulse"></span>
                  Groq 120B
                </span>
              </div>
              <p className="text-xs text-[#8C8376] font-medium flex items-center gap-1.5">
                <span>
                  {formatNumber(distilledContext.datasetInfo.totalRecords)}{" "}
                  transactions distilled
                </span>
                <span>•</span>
                <span
                  className="truncate max-w-[200px]"
                  title={distilledContext.datasetInfo.activeFiltersDescription}
                >
                  {distilledContext.datasetInfo.activeFiltersDescription}
                </span>
              </p>
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="p-2 rounded-xl text-[#8C8376] hover:text-[#5F7161] hover:bg-[#E9EFEA] transition-colors cursor-pointer"
                  title="Share / Email Conversation"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleClearChat}
                  className="p-2 rounded-xl text-[#8C8376] hover:text-[#C84B31] hover:bg-[#FFF5F5] transition-colors cursor-pointer"
                  title="Clear Chat History"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#8C8376] hover:text-[#2D2A26] hover:bg-[#F9F7F2] transition-colors cursor-pointer"
              title="Close panel (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Welcome / Empty State */}
          {messages.length === 0 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Overview Hero Card */}
              <div className="bg-white rounded-3xl p-5 border border-[#EBE5D9] shadow-xs">
                <div className="flex items-start gap-3.5 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#FAF0E6] border border-[#E8D2C2] flex items-center justify-center text-[#AF8260] shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#2D2A26]">
                      Commercial Intelligence at Scale
                    </h3>
                    <p className="text-xs text-[#8C8376] mt-0.5 leading-relaxed font-medium">
                      Powered by <strong>Groq + GPT OSS 120B</strong>. Your
                      entire dataset is mathematically pre-distilled into
                      high-density context for zero-lag executive analysis.
                    </p>
                  </div>
                </div>

                {/* Quick KPI pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-[#F1EDE5] text-center">
                  <div className="bg-[#FAF8F5] rounded-xl p-2 border border-[#EBE5D9]">
                    <div className="text-[10px] text-[#8C8376] font-bold">
                      Net Sales
                    </div>
                    <div className="text-xs font-black text-[#2D2A26]">
                      {formatCurrency(distilledContext.kpis.netSales)}
                    </div>
                  </div>
                  <div className="bg-[#FAF8F5] rounded-xl p-2 border border-[#EBE5D9]">
                    <div className="text-[10px] text-[#8C8376] font-bold">
                      Margin
                    </div>
                    <div className="text-xs font-black text-[#5F7161]">
                      {formatPercent(distilledContext.kpis.scoobiesMarginPct)}
                    </div>
                  </div>
                  <div className="bg-[#FAF8F5] rounded-xl p-2 border border-[#EBE5D9]">
                    <div className="text-[10px] text-[#8C8376] font-bold">
                      Return Rate
                    </div>
                    <div className="text-xs font-black text-[#AF8260]">
                      {formatPercent(distilledContext.kpis.returnRateQtyPct)}
                    </div>
                  </div>
                  <div className="bg-[#FAF8F5] rounded-xl p-2 border border-[#EBE5D9]">
                    <div className="text-[10px] text-[#8C8376] font-bold">
                      Goal Achieved
                    </div>
                    <div className="text-xs font-black text-[#2D2A26]">
                      {formatPercent(
                        distilledContext.kpis.targetProgressPct,
                        0,
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {messages.map((msg, index) => (
            <MemoizedChatMessageItem
              key={index}
              message={msg}
              index={index}
              isCopied={copiedIndex === index}
              onCopy={handleCopyMessage}
            />
          ))}

          {/* Typing / Streaming indicator */}
          {isGenerating && messages[messages.length - 1]?.content === "" && (
            <div className="flex gap-3 justify-start animate-in fade-in duration-200">
              <div className="w-8 h-8 rounded-xl bg-[#5F7161] border border-[#4A594C] flex items-center justify-center text-white shrink-0 mt-1">
                <Bot className="w-4 h-4 text-amber-200" />
              </div>
              <div className="bg-white rounded-3xl rounded-tl-xs px-4 py-3 border border-[#EBE5D9] shadow-2xs flex items-center gap-2 text-xs text-[#8C8376]">
                <span className="w-2 h-2 rounded-full bg-[#5F7161] animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-[#AF8260] animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-[#E7AB79] animate-bounce [animation-delay:0.4s]"></span>
                <span className="font-bold text-[#5F7161] ml-1">
                  Analyzing sales data with Groq 120B...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Footer / Input Area */}
        <div className="p-4 bg-white border-t border-[#EBE5D9] shrink-0">
          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isRecording) {
                handleStopRecording();
                return;
              }
              handleSendMessage();
            }}
            className="w-full"
          >
            <div
              className={`relative flex flex-col rounded-2xl border transition-all duration-200 shadow-2xs ${
                isRecording
                  ? "border-red-400 ring-2 ring-red-400/20 bg-red-50/40 text-red-900"
                  : "border-[#EBE5D9] bg-[#FAF8F5] focus-within:bg-white focus-within:border-[#5F7161] focus-within:ring-2 focus-within:ring-[#5F7161]/20"
              }`}
            >
              {/* Auto-growing Textarea */}
              <textarea
                ref={textareaRef}
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    if (e.nativeEvent.isComposing) return;
                    e.preventDefault();
                    if (isRecording) {
                      handleStopRecording();
                      return;
                    }
                    handleSendMessage();
                  }
                }}
                rows={1}
                placeholder={
                  isRecording
                    ? `🎙️ Recording (${Math.floor(recordingDuration / 60)}:${(recordingDuration % 60).toString().padStart(2, "0")})... Click stop to finish`
                    : isTranscribing
                      ? "⚡ Transcribing & refining with Groq AI..."
                      : "Ask anything or specify a persona (e.g., 'Act as a performance marketer...')"
                }
                disabled={isGenerating || isTranscribing}
                className="w-full px-3.5 pt-3 pb-1.5 text-xs bg-transparent border-0 outline-none resize-none font-medium placeholder-[#A89F91] text-[#2D2A26] disabled:opacity-60 max-h-40 overflow-y-auto leading-relaxed focus:ring-0 focus:outline-none"
              />

              {/* Bottom Action Controls inside Text Area */}
              <div className="flex items-center justify-between px-2.5 pb-2 pt-1">
                {/* Left side actions (Mic / Audio recording status) */}
                <div className="flex items-center gap-1.5">
                  {isTranscribing ? (
                    <div
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-xl bg-[#E9EFEA] text-[#5F7161] text-[11px] font-semibold animate-pulse"
                      title="Transcribing audio with Whisper Turbo..."
                    >
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Transcribing...</span>
                    </div>
                  ) : isRecording ? (
                    <button
                      type="button"
                      onClick={handleStopRecording}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold shadow-xs animate-pulse transition-all cursor-pointer"
                      title="Stop recording and transcribe"
                    >
                      <Square className="w-3 h-3 fill-current" />
                      <span>
                        Stop ({Math.floor(recordingDuration / 60)}:
                        {(recordingDuration % 60).toString().padStart(2, "0")})
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartRecording}
                      disabled={isGenerating}
                      className="p-1.5 rounded-xl text-[#8C8376] hover:text-[#5F7161] hover:bg-[#F1EDE5] transition-all cursor-pointer disabled:opacity-40"
                      title="Speak question (Groq Whisper Turbo)"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Right side actions (Send / Stop button) */}
                <div className="flex items-center gap-1.5">
                  {isGenerating ? (
                    <button
                      type="button"
                      onClick={handleStop}
                      className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                      title="Stop generation"
                    >
                      <StopCircle className="w-3.5 h-3.5" />
                      <span>Stop</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={
                        !inputQuery.trim() || isRecording || isTranscribing
                      }
                      className="px-3.5 py-1.5 rounded-xl bg-[#5F7161] hover:bg-[#4E5E50] disabled:opacity-30 disabled:hover:bg-[#5F7161] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs shadow-[#5F7161]/25 transition-all cursor-pointer shrink-0"
                      title="Send query (Enter)"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Ask</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>

          {/* Audio Error Alert if any */}
          {audioError && (
            <div className="mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-700 font-semibold flex items-center justify-between animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>{audioError}</span>
              </div>
              <button
                type="button"
                onClick={() => setAudioError(null)}
                className="text-red-400 hover:text-red-700 ml-2 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Footer note */}
          <div className="mt-2 flex items-center justify-between text-[10px] text-[#8C8376] font-medium px-1">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#5F7161]" />
              <span>
                Token-Optimized Context (
                {formatNumber(distilledContext.datasetInfo.totalRecords)} rows
                distilled)
              </span>
            </span>
            <span>
              Shortcut: <strong>⌘J</strong> to toggle
            </span>
          </div>
        </div>
      </div>

      {/* Share / Email Briefing Modal */}
      <ShareChatModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        messages={messages}
        distilledContext={distilledContext}
      />
    </div>
  );
};

/**
 * Memoized single chat message item to prevent redundant markdown re-parsing on keystrokes.
 */
const MemoizedChatMessageItem: React.FC<{
  message: ChatMessage;
  index: number;
  isCopied: boolean;
  onCopy: (text: string, index: number) => void;
}> = React.memo(({ message, index, isCopied, onCopy }) => {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex gap-3 w-full min-w-0 ${isUser ? "justify-end" : "justify-start"} animate-in fade-in duration-200`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-[#5F7161] border border-[#4A594C] flex items-center justify-center text-white shrink-0 mt-1 shadow-2xs">
          <Bot className="w-4 h-4 text-amber-200" />
        </div>
      )}

      <div
        className={`max-w-[94%] sm:max-w-[88%] min-w-0 overflow-hidden break-words rounded-3xl p-4 text-xs leading-relaxed shadow-2xs ${
          isUser
            ? "bg-[#5F7161] text-white font-medium rounded-tr-xs"
            : "bg-white text-[#2D2A26] border border-[#EBE5D9] rounded-tl-xs"
        }`}
      >
        {!isUser ? (
          <div className="w-full min-w-0 overflow-hidden">
            {/* Formatted Markdown Content */}
            {renderFormattedMarkdown(message.content)}

            {/* Message Footer Controls */}
            {message.content && (
              <div className="mt-3 pt-2.5 border-t border-[#F1EDE5] flex items-center justify-between text-[10px] text-[#8C8376]">
                <span className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#5F7161]" />
                  <span>Groq • GPT OSS 120B</span>
                </span>
                <button
                  type="button"
                  onClick={() => onCopy(message.content, index)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-[#F9F7F2] text-[#8C8376] hover:text-[#2D2A26] transition-colors cursor-pointer"
                  title="Copy response"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3 h-3 text-[#5F7161]" />
                      <span className="text-[#5F7161] font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 opacity-70 shrink-0" />
            <span>{message.content}</span>
          </div>
        )}
      </div>
    </div>
  );
});

/**
 * Renders full GitHub Flavored Markdown (headings, tables, lists, code, bold, links)
 * to HTML using the marked library, wrapping tables in responsive scroll containers.
 */
function renderFormattedMarkdown(text: string) {
  if (!text) return null;
  try {
    let rawHtml = marked.parse(text) as string;

    // Wrap tables in responsive scroll container
    rawHtml = rawHtml
      .replace(
        /<table(\b[^>]*)>/gi,
        '<div class="ai-table-container"><table$1>',
      )
      .replace(/<\/table>/gi, "</table></div>");

    return (
      <div
        className="ai-markdown-content font-sans text-xs w-full min-w-0"
        dangerouslySetInnerHTML={{ __html: rawHtml }}
      />
    );
  } catch {
    return (
      <div className="whitespace-pre-wrap font-sans text-xs break-words">
        {text}
      </div>
    );
  }
}
