import {
  Code2,
  MessageSquare,
  Mic,
  Paperclip,
  Send,
  Zap,
  FileText,
  Presentation,
  ImageIcon,
  Globe,
} from "lucide-react";
import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import sendMessage from "../features/sendMessage";
import { createConversation } from "../features/createConversation";
import { updateConversation } from "../features/updateConversation";
import {
  addConversation,
  setConvTitle,
  setSelectedConversation,
} from "../redux/conversationSlice";
import { addMessage, setArtifacts } from "../redux/messageSlice";

const MAX_TITLE_LENGTH = 40;

const AGENTS = [
  { id: "auto", label: "Auto", icon: Zap },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "coding", label: "Coding", icon: Code2 },
  { id: "pdf", label: "PDF", icon: FileText },
  { id: "ppt", label: "PPT", icon: Presentation },
  { id: "vision", label: "Vision", icon: ImageIcon },
  { id: "search", label: "Search", icon: Globe },
];

const iconButtonClasses =
  "flex h-8 w-8 items-center justify-center rounded-lg border border-transparent bg-transparent text-slate-500 transition-all duration-200 hover:scale-105 hover:border-[#9B8CFF]/25 hover:bg-white/[0.06] hover:text-[#C1B7FF] active:scale-95";

function ChatInput() {
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("auto");
  const [isSending, setIsSending] = useState(false);

  const dispatch = useDispatch();

  const { selectedConversation } = useSelector(
    (state) => state.conversation
  );

  const handleSendMessage = useCallback(async () => {
    const prompt = value.trim();

    if (!prompt || isSending) return;

    setIsSending(true);

    try {
      let conversation = selectedConversation;

      // --------------------------------------------------
      // 1. Create conversation if none is selected
      // --------------------------------------------------
      if (!conversation) {
        conversation = await createConversation();

        if (!conversation?._id) {
          console.error("❌ Failed to create conversation");
          return;
        }

        dispatch(addConversation(conversation));
        dispatch(setSelectedConversation(conversation));
      }

      // --------------------------------------------------
      // 2. Optimistically add user's message
      // --------------------------------------------------
      dispatch(
        addMessage({
          role: "user",
          content: prompt,
        })
      );

      setValue("");

      // --------------------------------------------------
      // 3. Update conversation title
      // --------------------------------------------------
      if (conversation.title === "New Chat") {
        const newTitle = prompt.slice(0, MAX_TITLE_LENGTH);

        const updatedConversation = await updateConversation({
          conversationId: conversation._id,
          title: newTitle,
        });

        if (updatedConversation) {
          dispatch(
            setConvTitle({
              conversationId: conversation._id,
              title: newTitle,
            })
          );
        }
      }

      // --------------------------------------------------
      // 4. Send message to AI
      // --------------------------------------------------
      const data = await sendMessage({
        prompt,
        conversationId: conversation._id,
        agent: selectedAgent.toLowerCase(),
      });

      // --------------------------------------------------
      // 5. IMPORTANT:
      // sendMessage can return null when backend returns
      // an error. Never access data.artifacts directly.
      // --------------------------------------------------
      if (!data) {
        console.error("❌ sendMessage returned null");

        dispatch(
          addMessage({
            role: "assistant",
            content:
              "❌ Sorry, I couldn't process your request. Please try again.",
          })
        );

        return;
      }

      // --------------------------------------------------
      // 6. Safely handle artifacts
      // --------------------------------------------------
      const artifacts = data?.artifacts || [];

      dispatch(setArtifacts(artifacts));

      // --------------------------------------------------
      // 7. Safely handle assistant response
      // --------------------------------------------------
      dispatch(
        addMessage({
          role: "assistant",
          content: data?.answer || data?.content || "",
          images: data?.images || [],
          artifacts,
        })
      );
    } catch (error) {
      console.error(
        "❌ Failed to send message:",
        error?.response?.data || error
      );

      dispatch(
        addMessage({
          role: "assistant",
          content:
            error?.response?.data?.message ||
            "❌ Something went wrong while processing your message.",
        })
      );
    } finally {
      setIsSending(false);
    }
  }, [value, isSending, selectedConversation, selectedAgent, dispatch]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  const hasValue = Boolean(value.trim());

  return (
    <div
      className="relative flex min-w-0 max-w-full flex-col gap-2 overflow-hidden rounded-2xl border px-4 pb-3 pt-3.5 backdrop-blur-sm transition-all duration-200 ease-out"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.025) 100%)",
        borderColor: focused
          ? "rgba(155,140,255,0.5)"
          : "rgba(255,255,255,0.1)",
        boxShadow: focused
          ? "0 0 0 3px rgba(139,124,255,0.12), 0 8px 28px rgba(79,143,255,0.16), inset 0 1px 0 rgba(255,255,255,0.05)"
          : "0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      {/* Agent selector */}
      <div className="flex min-w-0 max-w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {AGENTS.map((agent) => {
          const Icon = agent.icon;
          const isActive = selectedAgent === agent.id;

          return (
            <button
              key={agent.id}
              type="button"
              onClick={() => setSelectedAgent(agent.id)}
              aria-pressed={isActive}
              className={`
                group relative flex shrink-0 items-center gap-1.5
                overflow-hidden rounded-xl
                px-3 py-2
                text-xs font-medium
                transition-all duration-200 ease-out
                hover:-translate-y-[1px]
                active:translate-y-0
                active:scale-[0.97]
                ${
                  isActive
                    ? "text-white ring-1 ring-white/15"
                    : "border border-white/[0.07] bg-[#1E2030] text-slate-400 hover:bg-[#292B40] hover:text-white"
                }
              `}
              style={
                isActive
                  ? {
                      background:
                        "linear-gradient(135deg, #9B8CFF 0%, #6B9EFF 55%, #4F8FFF 100%)",
                      boxShadow:
                        "0 3px 12px rgba(139,124,255,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
                    }
                  : undefined
              }
            >
              {/* Shine sweep */}
              <span
                className="
                  pointer-events-none absolute inset-0
                  -translate-x-full
                  bg-gradient-to-r
                  from-transparent
                  via-white/20
                  to-transparent
                  transition-transform
                  duration-700
                  ease-out
                  group-hover:translate-x-full
                "
              />

              {/* Icon */}
              <Icon
                size={14}
                className={`
                  relative shrink-0
                  transition-all duration-200
                  group-hover:scale-110
                  ${
                    isActive
                      ? "text-white"
                      : "text-slate-400 group-hover:text-[#C1B7FF]"
                  }
                `}
              />

              {/* Label */}
              <span className="relative">{agent.label}</span>
            </button>
          );
        })}
      </div>

      {/* Textarea */}
      <textarea
        placeholder="Ask Anything..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={handleKeyDown}
        disabled={isSending}
        className="block min-h-0 w-full min-w-0 max-w-full resize-none overflow-y-auto bg-transparent text-[14px] leading-relaxed text-slate-200 outline-none placeholder:text-slate-600 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        rows={3}
      />

      {/* Bottom controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={iconButtonClasses}
            aria-label="Attach file"
          >
            <Paperclip size={16} />
          </button>

          <button
            type="button"
            className={iconButtonClasses}
            aria-label="Voice input"
          >
            <Mic size={16} />
          </button>
        </div>

        <button
          type="button"
          disabled={!hasValue || isSending}
          onClick={handleSendMessage}
          aria-label="Send message"
          className={`flex h-8 w-8 items-center justify-center rounded-lg border-none text-white transition-all duration-200 ease-out ${
            hasValue && !isSending
              ? "cursor-pointer active:scale-90 hover:-translate-y-[1px]"
              : "cursor-not-allowed opacity-50"
          }`}
          style={{
            background:
              hasValue && !isSending
                ? "linear-gradient(135deg, #9B8CFF 0%, #6B9EFF 55%, #4F8FFF 100%)"
                : "#374151",
            boxShadow:
              hasValue && !isSending
                ? "0 3px 14px rgba(139,124,255,0.4), inset 0 1px 0 rgba(255,255,255,0.25)"
                : "none",
          }}
          onMouseEnter={(e) => {
            if (hasValue && !isSending) {
              e.currentTarget.style.boxShadow =
                "0 5px 20px rgba(139,124,255,0.55), inset 0 1px 0 rgba(255,255,255,0.3)";
            }
          }}
          onMouseLeave={(e) => {
            if (hasValue && !isSending) {
              e.currentTarget.style.boxShadow =
                "0 3px 14px rgba(139,124,255,0.4), inset 0 1px 0 rgba(255,255,255,0.25)";
            }
          }}
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}

export default ChatInput;