import React from "react";
import {
  Bot,
  Code2,
  FileText,
  Presentation,
  Search,
  Sparkles,
} from "lucide-react";

// Agent -> visual identity
const AGENTS = {
  chat: {
    icon: Bot,
    label: "Thinking",
  },

  auto: {
    icon: Sparkles,
    label: "Working",
  },

  coding: {
    icon: Code2,
    label: "Writing code",
  },

  ppt: {
    icon: Presentation,
    label: "Building slides",
  },

  pdf: {
    icon: FileText,
    label: "Reading document",
  },

  search: {
    icon: Search,
    label: "Searching the web",
  },

  vision: {
    icon: Sparkles,
    label: "Analyzing image",
  },
};

// Backend agent/intent -> LoadingAnimation agent
const AGENT_MAP = {
  chat: "chat",
  auto: "auto",

  coding: "code",
  code: "code",

  search: "search",

  pdf: "pdf",
  pdfrag: "pdf",

  ppt: "ppt",

  vision: "chat",
  imageanalyzer: "chat",
};

function LoadingAnimation({ agent = "chat", label }) {
  
  // Normalize backend agent name
  const normalizedAgent =
    AGENT_MAP[agent?.toUpperCase()] || agent?.toLowerCase() || "chat";

  const { icon: Icon, label: defaultLabel } =
    AGENTS[normalizedAgent] || AGENTS.chat;

  const text = label || defaultLabel;

  return (
    <div className="flex justify-start">
      <div
        className="flex items-center gap-3 px-4 py-2.5 rounded-2xl rounded-tl-sm border border-white/[0.07] bg-white/[0.04]"
        style={{
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      >
        {/* Agent avatar */}
        <div
          className="relative flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
          style={{
            background:
              "linear-gradient(135deg, #9B8CFF 0%, #5B9CFF 50%, #4F8FFF 100%)",
            boxShadow: "0 0 12px rgba(139,124,255,0.5)",
          }}
        >
          <Icon size={14} className="text-white" strokeWidth={2.2} />

          {/* Rotating ring */}
          <span
            className="absolute -inset-[3px] rounded-[10px]"
            style={{
              border: "1.5px solid transparent",
              borderTopColor: "#B4A9FF",
              borderRightColor: "rgba(180,169,255,0.4)",
              animation: "nexusAgentSpin 1s linear infinite",
            }}
          />
        </div>

        {/* Shimmering label + bouncing dots */}
        <div className="flex items-center gap-2">
          <span
            className="text-[13px] font-medium bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #64748b 0%, #e2e8f0 50%, #64748b 100%)",
              backgroundSize: "200% 100%",
              animation: "nexusShimmer 1.8s linear infinite",
            }}
          >
            {text}
          </span>

          <span className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-[5px] h-[5px] rounded-full"
                style={{
                  background: "#9B8CFF",
                  animation: "nexusAgentDot 1.2s ease-in-out infinite",
                  animationDelay: `${i * 0.18}s`,
                }}
              />
            ))}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes nexusAgentSpin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes nexusShimmer {
          0% {
            background-position: 200% 0;
          }

          100% {
            background-position: -200% 0;
          }
        }

        @keyframes nexusAgentDot {
          0%,
          80%,
          100% {
            opacity: 0.3;
            transform: translateY(0);
          }

          40% {
            opacity: 1;
            transform: translateY(-3px);
          }
        }
      `}</style>
    </div>
  );
}

export default LoadingAnimation;