import React, { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, ExternalLink, X } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

function MessageBubble({ role, content, images = [] }) {
  const isUser = role === "user";

  const [lightBox, setLightBox] = useState(null);
  const [copiedCode, setCopiedCode] = useState("");

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);

      setTimeout(() => {
        setCopiedCode("");
      }, 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  };

  const markdownComponents = {
    h1: ({ children }) => (
      <h1 className="text-2xl font-bold text-white mt-4 mb-3 tracking-tight">
        {children}
      </h1>
    ),

    h2: ({ children }) => (
      <h2 className="text-xl font-bold text-white mt-4 mb-3 tracking-tight">
        {children}
      </h2>
    ),

    h3: ({ children }) => (
      <h3 className="text-lg font-semibold text-white mt-3 mb-2">
        {children}
      </h3>
    ),

    p: ({ children }) => (
      <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
    ),

    ul: ({ children }) => (
      <ul className="list-disc pl-5 mb-3 space-y-1 marker:text-[#9B8CFF]">
        {children}
      </ul>
    ),

    ol: ({ children }) => (
      <ol className="list-decimal pl-5 mb-3 space-y-1 marker:text-[#9B8CFF] marker:font-semibold">
        {children}
      </ol>
    ),

    li: ({ children }) => <li className="pl-1">{children}</li>,

    strong: ({ children }) => (
      <strong className="font-semibold text-white">{children}</strong>
    ),

    em: ({ children }) => <em className="italic text-slate-300">{children}</em>,

    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-medium underline decoration-[#9B8CFF]/40 underline-offset-2 transition-colors hover:decoration-[#B4A9FF]"
        style={{
          background: "linear-gradient(135deg, #A79BFF 0%, #6BA6FF 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {children}
        <ExternalLink size={13} className="shrink-0 text-[#9B8CFF]" />
      </a>
    ),

    blockquote: ({ children }) => (
      <blockquote
        className="pl-4 py-2 my-3 italic text-slate-300 rounded-r-lg"
        style={{
          borderLeft: "3px solid transparent",
          borderImage: "linear-gradient(180deg, #9B8CFF, #4F8FFF) 1",
          background:
            "linear-gradient(90deg, rgba(155,140,255,0.08) 0%, transparent 100%)",
        }}
      >
        {children}
      </blockquote>
    ),

    hr: () => (
      <hr className="my-4 border-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
    ),

    /*
     * react-markdown puts fenced code inside <pre>.
     * We let the custom `code` renderer handle the actual UI.
     */
    pre: ({ children }) => <>{children}</>,

    code: ({ className, children }) => {
      const value = String(children).replace(/\n$/, "");

      const language = className?.replace("language-", "") || "";

      /*
       * Inline code
       */
      if (!className) {
        return (
          <code className="rounded-md bg-[#9B8CFF]/[0.12] border border-[#9B8CFF]/20 px-1.5 py-0.5 font-mono text-[13px] text-[#C1B7FF]">
            {children}
          </code>
        );
      }

      /*
       * Fenced code block
       */
      return (
        <div
          className="mb-3 last:mb-0 overflow-hidden rounded-xl border border-white/[0.08]"
          style={{
            background: "#0D0E14",
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
          }}
        >
          <div
            className="flex items-center justify-between border-b border-white/[0.08] px-4 py-2"
            style={{
              background:
                "linear-gradient(90deg, rgba(155,140,255,0.08) 0%, rgba(79,143,255,0.04) 100%)",
            }}
          >
            <span className="flex items-center gap-1.5 uppercase text-[11px] font-semibold tracking-wide text-slate-400">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background:
                    "linear-gradient(135deg, #9B8CFF, #4F8FFF)",
                }}
              />
              {language || "text"}
            </span>

            <button
              type="button"
              className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-[#C1B7FF] transition-colors duration-200"
              onClick={() => copyCode(value)}
            >
              {copiedCode === value ? (
                <>
                  <Check size={14} className="text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  Copy
                </>
              )}
            </button>
          </div>

          <SyntaxHighlighter
            language={language || "text"}
            style={oneDark}
            customStyle={{
              margin: 0,
              padding: "0.85rem",
              background: "transparent",
              fontSize: "13px",
              lineHeight: "1.6",
              overflowX: "auto",
            }}
            codeTagProps={{
              style: {
                fontFamily: "inherit",
              },
            }}
          >
            {value}
          </SyntaxHighlighter>
        </div>
      );
    },

    /*
     * Images generated/returned inside Markdown.
     *
     * Example:
     * ![Generated Image](https://...)
     */
    img: ({ src, alt }) => {
      if (!src) return null;

      return (
        <img
          src={src}
          alt={alt || "Generated image"}
          loading="lazy"
          onClick={() => setLightBox(src)}
          onError={(e) => e.currentTarget.remove()}
          className="max-w-full w-auto h-auto max-h-[500px] rounded-xl border border-white/10 cursor-zoom-in hover:opacity-90 hover:border-[#9B8CFF]/30 transition-all duration-200 object-contain"
        />
      );
    },

    table: ({ children }) => (
      <div className="mb-3 last:mb-0 overflow-x-auto rounded-lg border border-white/[0.08]">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    ),

    thead: ({ children }) => (
      <thead
        style={{
          background:
            "linear-gradient(90deg, rgba(155,140,255,0.1) 0%, rgba(79,143,255,0.05) 100%)",
        }}
      >
        {children}
      </thead>
    ),

    tbody: ({ children }) => <tbody>{children}</tbody>,

    tr: ({ children }) => (
      <tr className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
        {children}
      </tr>
    ),

    th: ({ children }) => (
      <th className="border-b border-white/10 px-3 py-2 text-left font-semibold text-white">
        {children}
      </th>
    ),

    td: ({ children }) => (
      <td className="border-b border-white/5 px-3 py-2 align-top text-slate-300">
        {children}
      </td>
    ),
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[92vw] w-fit md:max-w-[72%] px-4 py-2.5 rounded-2xl break-words overflow-hidden leading-relaxed transition-shadow duration-200 ${
          isUser
            ? "text-white rounded-tr-sm"
            : "bg-white/[0.04] border border-white/[0.07] text-slate-200 rounded-tl-sm"
        }`}
        style={
          isUser
            ? {
                background:
                  "linear-gradient(135deg, #9B8CFF 0%, #6B9EFF 55%, #4F8FFF 100%)",
                boxShadow:
                  "0 4px 18px rgba(139,124,255,0.28), inset 0 1px 0 rgba(255,255,255,0.15)",
              }
            : {
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
              }
        }
      >
        {/* Direct image attachments */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`Attachment ${i + 1}`}
                loading="lazy"
                onClick={() => setLightBox(img)}
                onError={(e) => e.currentTarget.remove()}
                className="w-40 h-28 rounded-xl object-cover border border-white/10 cursor-zoom-in hover:opacity-90 transition"
              />
            ))}
          </div>
        )}

        {/* Markdown content */}
        <div className="text-[14px]">
          <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {content || ""}
          </Markdown>
        </div>
      </div>

      {/* Image Lightbox */}
      {lightBox && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center backdrop-blur-md p-6"
          onClick={() => setLightBox(null)}
        >
          <button
            type="button"
            aria-label="Close image preview"
            className="absolute top-5 right-5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-all duration-200 hover:scale-105"
            onClick={(e) => {
              e.stopPropagation();
              setLightBox(null);
            }}
          >
            <X size={22} />
          </button>

          <img
            src={lightBox}
            alt="Expanded attachment"
            className="max-w-[90vw] max-h-[85vh] rounded-2xl border border-white/10 shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

export default MessageBubble;