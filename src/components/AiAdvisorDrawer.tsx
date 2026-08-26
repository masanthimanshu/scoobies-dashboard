import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  Copy,
  Check,
  Bot,
  User,
  Zap,
  TrendingUp,
  AlertTriangle,
  Target,
  Layers,
  StopCircle,
} from "lucide-react";
import { marked } from "marked";
import {
  ChatMessage,
  streamGroqChat,
  getActiveGroqApiKey,
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

export const AiAdvisorDrawer: React.FC<AiAdvisorDrawerProps> = ({
  isOpen,
  onClose,
  distilledContext,
  rawRecords,
  initialPrompt,
  onClearInitialPrompt,
}) => {
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Abort controller ref for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync API Key state from .env
  const hasApiKey = useMemo(() => {
    return getActiveGroqApiKey().length > 0;
  }, []);

  // Context markdown
  const contextMarkdown = useMemo(() => {
    return formatDistilledContextToMarkdown(distilledContext);
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
      setTimeout(() => inputRef.current?.focus(), 150);
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

  // Quick Action Playbook Prompts
  const quickPlaybooks = [
    {
      icon: <Zap className="w-3.5 h-3.5 text-amber-500" />,
      title: "Executive Strategic Briefing",
      prompt:
        "Generate a comprehensive Executive Strategic Briefing for Scoobies leadership. Highlight our revenue drivers, margin health, channel share, and the top 3 highest-priority commercial recommendations to maximize profit.",
    },
    {
      icon: <AlertTriangle className="w-3.5 h-3.5 text-red-500" />,
      title: "Audit Margin Leaks & Returns",
      prompt:
        "Perform a deep-dive audit of all product returns and margin leakage across our channels. Which specific SKUs and marketplaces are suffering from excessive returns, how much margin are we losing, and what immediate operational actions should we take?",
    },
    {
      icon: <Target className="w-3.5 h-3.5 text-[#5F7161]" />,
      title: `Plan to Hit ₹${(distilledContext.kpis.salesTarget / 100000).toFixed(1)}L Target`,
      prompt: `Analyze our current margin target quota of ${formatCurrency(distilledContext.kpis.salesTarget)}. What is our remaining quota gap, and what specific run-rate, channel levers, and product mix adjustments do we need to hit or exceed this goal?`,
    },
    {
      icon: <Layers className="w-3.5 h-3.5 text-blue-500" />,
      title: "Marketplace Channel Economics",
      prompt:
        "Compare the commercial economics of our sales channels (Amazon vs Website vs Blinkit vs others). Analyze AOV, return rates, margin profitability per channel, and recommend how we should allocate marketing spend.",
    },
  ];

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
              <button
                type="button"
                onClick={handleClearChat}
                className="p-2 rounded-xl text-[#8C8376] hover:text-[#C84B31] hover:bg-[#FFF5F5] transition-colors cursor-pointer"
                title="Clear Chat History"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
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
                      Margin Rate
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
                      Target Quota
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

              {/* Quick Playbooks Section */}
              <div>
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C8376]">
                    Instant Strategic Playbooks
                  </span>
                  <span className="text-[10px] font-bold text-[#5F7161]">
                    1-Click Deep Dive
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {quickPlaybooks.map((pb, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(pb.prompt)}
                      className="flex items-start gap-3 p-3.5 rounded-2xl bg-white hover:bg-[#F9F7F2] border border-[#EBE5D9] hover:border-[#D9CFC1] transition-all text-left shadow-2xs hover:shadow-xs group cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-xl bg-[#FAF8F5] border border-[#EBE5D9] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        {pb.icon}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-[#2D2A26] group-hover:text-[#5F7161] transition-colors leading-snug">
                          {pb.title}
                        </div>
                        <div className="text-[10px] text-[#8C8376] line-clamp-1 mt-0.5 font-medium">
                          {pb.prompt}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {messages.map((msg, index) => {
            const isUser = msg.role === "user";

            return (
              <div
                key={index}
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
                      {renderFormattedMarkdown(msg.content)}

                      {/* Message Footer Controls */}
                      {msg.content && (
                        <div className="mt-3 pt-2.5 border-t border-[#F1EDE5] flex items-center justify-between text-[10px] text-[#8C8376]">
                          <span className="font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#5F7161]" />
                            <span>Groq • GPT OSS 120B</span>
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyMessage(msg.content, index)
                            }
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-[#F9F7F2] text-[#8C8376] hover:text-[#2D2A26] transition-colors cursor-pointer"
                            title="Copy response"
                          >
                            {copiedIndex === index ? (
                              <>
                                <Check className="w-3 h-3 text-[#5F7161]" />
                                <span className="text-[#5F7161] font-bold">
                                  Copied
                                </span>
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
                      <span>{msg.content}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

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
          {/* Quick Prompt Chips (when in active chat) */}
          {messages.length > 0 && !isGenerating && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 no-scrollbar">
              <button
                type="button"
                onClick={() =>
                  handleSendMessage(
                    "What are the top 3 items draining margin through returns?",
                  )
                }
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-[#FAF8F5] hover:bg-[#F1EDE5] border border-[#EBE5D9] text-[10px] font-bold text-[#433E37] transition-colors cursor-pointer shrink-0"
              >
                ⚠️ Top Return Drainers
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSendMessage(
                    "Which sales channel generates the highest profit per order?",
                  )
                }
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-[#FAF8F5] hover:bg-[#F1EDE5] border border-[#EBE5D9] text-[10px] font-bold text-[#433E37] transition-colors cursor-pointer shrink-0"
              >
                📊 Best Margin Channel
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSendMessage(
                    "What price or bundle adjustments would increase our AOV?",
                  )
                }
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-[#FAF8F5] hover:bg-[#F1EDE5] border border-[#EBE5D9] text-[10px] font-bold text-[#433E37] transition-colors cursor-pointer shrink-0"
              >
                💡 Increase AOV Levers
              </button>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask anything about sales, margins, returns, channels, or targets..."
                disabled={isGenerating}
                className="w-full px-4 py-3 pr-10 text-xs border border-[#EBE5D9] rounded-2xl bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5F7161]/30 focus:border-[#5F7161] font-medium placeholder-[#A89F91] transition-all disabled:opacity-60"
              />
            </div>

            {isGenerating ? (
              <button
                type="button"
                onClick={handleStop}
                className="px-4 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                title="Stop generation"
              >
                <StopCircle className="w-4 h-4" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!inputQuery.trim()}
                className="px-4 py-3 rounded-2xl bg-[#5F7161] hover:bg-[#4E5E50] disabled:opacity-40 disabled:hover:bg-[#5F7161] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-[#5F7161]/25 transition-all cursor-pointer"
                title="Send query"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Ask</span>
              </button>
            )}
          </form>

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
    </div>
  );
};

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
