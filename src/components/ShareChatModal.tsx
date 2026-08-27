import React, { useState, useEffect } from "react";
import {
  X,
  Mail,
  Send,
  Check,
  Copy,
  AlertTriangle,
  Loader2,
  Sparkles,
  Key,
} from "lucide-react";
import { ChatMessage } from "../services/groqService";
import { DistilledSalesContext } from "../utils/aiContextDistiller";
import { buildChatBriefingEmailHtml } from "../utils/chatEmailTemplate";
import {
  sendEmailWithResend,
  getActiveResendApiKey,
  setActiveResendApiKey,
} from "../services/emailService";

interface ShareChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  distilledContext: DistilledSalesContext;
}

const STORAGE_KEY_RECIPIENT = "scoobies_ai_email_recipient";

export const ShareChatModal: React.FC<ShareChatModalProps> = ({
  isOpen,
  onClose,
  messages,
  distilledContext,
}) => {
  const [recipientEmail, setRecipientEmail] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_RECIPIENT) || "";
  });

  const formattedDate = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const defaultSubject = `Scoobies Strategic Briefing (${formattedDate})`;
  const [subject, setSubject] = useState(defaultSubject);

  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  // API Key management
  const hasEnvApiKey = Boolean(getActiveResendApiKey());
  const [showApiKeyInput, setShowApiKeyInput] = useState(!hasEnvApiKey);
  const [apiKeyInput, setApiKeyInput] = useState(getActiveResendApiKey());

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(false);
      setCopiedHtml(false);
      setShowApiKeyInput(!getActiveResendApiKey());
      setApiKeyInput(getActiveResendApiKey());
      setSubject(defaultSubject);
    }
  }, [isOpen, defaultSubject]);

  if (!isOpen) return null;

  const totalUserQuestions = messages.filter((m) => m.role === "user").length;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailTrimmed = recipientEmail.trim();
    if (!emailTrimmed || !emailTrimmed.includes("@")) {
      setError("Please enter a valid recipient email address.");
      return;
    }

    if (showApiKeyInput && apiKeyInput.trim()) {
      setActiveResendApiKey(apiKeyInput.trim());
    }

    if (!getActiveResendApiKey()) {
      setError(
        "Resend API Key is missing. Please add RESEND_API_KEY to your .env or enter it below.",
      );
      setShowApiKeyInput(true);
      return;
    }

    setIsSending(true);

    try {
      const html = buildChatBriefingEmailHtml({
        messages,
        distilledContext,
        recipientEmail: emailTrimmed,
        customSubject: subject.trim() || defaultSubject,
      });

      await sendEmailWithResend({
        to: emailTrimmed,
        subject: subject.trim() || defaultSubject,
        html,
      });

      // Save recipient email for convenience
      localStorage.setItem(STORAGE_KEY_RECIPIENT, emailTrimmed);
      setSuccess(true);

      setTimeout(() => {
        onClose();
      }, 2200);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to send email briefing.";
      setError(msg);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyHtml = () => {
    try {
      const html = buildChatBriefingEmailHtml({
        messages,
        distilledContext,
        recipientEmail,
        customSubject: subject,
      });
      navigator.clipboard.writeText(html);
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2500);
    } catch {
      setError("Failed to copy HTML to clipboard.");
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#2D2A26]/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-[#FAF8F5] rounded-3xl shadow-2xl border border-[#EBE5D9] p-6 z-10 animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#EBE5D9]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#5F7161] flex items-center justify-center text-white shadow-xs">
              <Mail className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#2D2A26] tracking-tight">
                Share AI Strategic Briefing
              </h3>
              <p className="text-xs text-[#8C8376] font-medium mt-0.5">
                Send conversation transcript via Resend HTML email
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#8C8376] hover:text-[#2D2A26] hover:bg-[#F1EDE5] transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Summary Badge */}
        <div className="mt-4 p-3 bg-white rounded-2xl border border-[#EBE5D9] flex items-center justify-between text-xs">
          <span className="text-[#8C8376] font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#5F7161]" />
            <span>
              <strong>{totalUserQuestions}</strong> question
              {totalUserQuestions === 1 ? "" : "s"} & answers included
            </span>
          </span>
          <span className="text-[11px] font-bold text-[#5F7161] bg-[#E9EFEA] px-2.5 py-0.5 rounded-full border border-[#C5D5C7]">
            HTML Responsive
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSend} className="mt-4 space-y-3.5">
          {/* Recipient Email */}
          <div>
            <label className="block text-xs font-bold text-[#2D2A26] mb-1">
              Recipient Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="e.g. founder@scoobies.in, leadership@brand.com"
              disabled={isSending || success}
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#EBE5D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5F7161]/30 focus:border-[#5F7161] font-medium placeholder-[#A89F91] transition-all disabled:opacity-60"
            />
          </div>

          {/* Subject Line */}
          <div>
            <label className="block text-xs font-bold text-[#2D2A26] mb-1">
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSending || success}
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#EBE5D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5F7161]/30 focus:border-[#5F7161] font-medium placeholder-[#A89F91] transition-all disabled:opacity-60"
            />
          </div>

          {/* Resend API Key Config Toggle (if not in .env or user wants to customize) */}
          {showApiKeyInput && (
            <div className="p-3 bg-[#FAF0E6] rounded-2xl border border-[#E8D2C2] space-y-1.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs font-bold text-[#AF8260]">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  <span>Resend API Key</span>
                </span>
                <span className="text-[10px] font-normal">
                  (saved locally in browser)
                </span>
              </div>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="re_xxxxxxxxxxxxxxxxxxxx"
                disabled={isSending || success}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8D2C2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF8260]/30 font-mono transition-all"
              />
              <p className="text-[10px] text-[#8C8376] leading-tight">
                Tip: You can also define <code>RESEND_API_KEY</code> in your{" "}
                <code>.env</code> file.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-medium flex items-start gap-2 animate-in fade-in duration-200">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-2xl text-xs text-green-800 font-bold flex items-center gap-2 animate-in fade-in duration-200">
              <Check className="w-4 h-4 text-green-600 shrink-0" />
              <span>Email sent successfully to {recipientEmail}!</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleCopyHtml}
              disabled={isSending}
              className="px-3.5 py-2.5 rounded-xl border border-[#EBE5D9] bg-white hover:bg-[#F9F7F2] text-[#2D2A26] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Copy HTML to clipboard"
            >
              {copiedHtml ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#5F7161]" />
                  <span className="text-[#5F7161]">Copied HTML!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#8C8376]" />
                  <span>Copy HTML</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSending}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#8C8376] hover:text-[#2D2A26] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSending || success || !recipientEmail.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#5F7161] hover:bg-[#4E5E50] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-[#5F7161]/25 transition-all cursor-pointer disabled:opacity-50 disabled:hover:bg-[#5F7161]"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Briefing...</span>
                  </>
                ) : success ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Sent!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Email</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
