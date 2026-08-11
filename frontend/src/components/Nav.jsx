import React from "react";
import { MessageSquare } from "lucide-react";
import { useSelector } from "react-redux";

function Nav() {
  const { selectedConversation } = useSelector(
    (state) => state.conversation
  );

  const { messages } = useSelector(
    (state) => state.message
  );

  // Don't show navbar for a completely new/empty chat
  const hasMessages = Array.isArray(messages) && messages.length > 0;

  if (!selectedConversation || !hasMessages) {
    return null;
  }

  return (
    <div
      className="relative h-14 flex items-center gap-2.5 px-5 border-b border-white/[0.07] backdrop-blur-sm animate-[navFadeIn_0.25s_ease-out]"
      style={{
        background:
          "linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%)",
      }}
    >
      {/* Conversation icon */}
      <div
        className="flex items-center justify-center w-7 h-7 rounded-[9px] border border-white/10 shrink-0 transition-all duration-300 ring-1 ring-white/5 hover:ring-[#9B8CFF]/30"
        style={{
          background:
            "linear-gradient(135deg, rgba(155,140,255,0.3) 0%, rgba(79,143,255,0.3) 100%)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow =
            "0 0 14px rgba(139,124,255,0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <MessageSquare
          size={13}
          className="text-[#C1B7FF]"
        />
      </div>

      {/* Conversation title */}
      <div className="text-[14px] font-semibold text-slate-100 tracking-tight truncate">
        {selectedConversation?.title || "New Chat"}
      </div>

      {/* Message count */}
      <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 bg-white/[0.05] border border-white/10 px-2.5 py-1 rounded-full ml-auto shrink-0 transition-colors duration-200 hover:border-[#9B8CFF]/35 hover:text-slate-300">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />

        {messages.length} Messages
      </div>

      {/* Bottom hairline */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <style>{`
        @keyframes navFadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default Nav;