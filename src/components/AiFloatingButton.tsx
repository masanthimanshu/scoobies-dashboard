import React from "react";
import { Bot } from "lucide-react";

interface AiFloatingButtonProps {
  isOpen: boolean;
  onClick: () => void;
  filteredCount?: number;
}

export const AiFloatingButton: React.FC<AiFloatingButtonProps> = ({
  isOpen,
  onClick,
  filteredCount = 0,
}) => {
  if (isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        type="button"
        id="scoobies-ai-fab-btn"
        onClick={onClick}
        className="group relative w-13 h-13 flex items-center justify-center bg-[#5F7161] hover:bg-[#4E5E50] active:scale-95 text-white rounded-full shadow-xl shadow-[#5F7161]/35 border border-[#788C7A] transition-all duration-300 cursor-pointer hover:shadow-2xl hover:-translate-y-0.5"
        title={`Scoobies AI Advisor (⌘J or Ctrl+J)${
          filteredCount
            ? ` • ${filteredCount.toLocaleString()} orders loaded`
            : ""
        }`}
        aria-label="Open Scoobies AI Advisor"
      >
        {/* Pulsing ring indicator */}
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E7AB79] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#E7AB79] border-2 border-white"></span>
        </span>

        {/* Robot Icon */}
        <Bot className="w-6 h-6 text-amber-200 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
      </button>
    </div>
  );
};
