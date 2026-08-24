import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  Code2,
  Copy,
  Eye,
  ExternalLink,
  FileText,
  Presentation,
  PanelRightClose,
  PanelRightOpen,
  X,
} from "lucide-react";
import { useSelector } from "react-redux";
import { AnimatePresence, easeInOut, motion } from "motion/react";
import Editor from "@monaco-editor/react";

const gradientAccent =
  "linear-gradient(135deg, #9B8CFF 0%, #6B9EFF 55%, #4F8FFF 100%)";

const panelBackground =
  "radial-gradient(140% 100% at 100% 0%, #12131C 0%, #0A0B12 60%, #08090F 100%)";

function Artifact() {
  // ============================================================
  // STATE
  // ============================================================

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tab, setTab] = useState("code");
  const [activeFile, setActiveFile] = useState(0);
  const [copied, setCopied] = useState(false);

  const { artifacts } = useSelector((state) => state.message);

  // ============================================================
  // CURRENT ARTIFACT
  // ============================================================

  const artifact = useMemo(() => {
    if (!Array.isArray(artifacts) || artifacts.length === 0) {
      return null;
    }

    return artifacts[0];
  }, [artifacts]);

  // ============================================================
  // ARTIFACT TYPE
  // ============================================================

  const isPdf = artifact?.type === "pdf";

  const isPpt =
    artifact?.type === "ppt" ||
    artifact?.type === "powerpoint" ||
    artifact?.type === "presentation";

  const isCode =
    !isPdf &&
    !isPpt &&
    Array.isArray(artifact?.files) &&
    artifact.files.length > 0;

  // ============================================================
  // FILES
  // ============================================================

  const files = isCode ? artifact.files : [];

  const file = files[activeFile] || files[0] || null;

  const htmlFile = files.find(
    (f) => f?.name?.toLowerCase() === "index.html"
  );

  const cssFile = files.find(
    (f) => f?.name?.toLowerCase() === "style.css"
  );

  const jsFile = files.find(
    (f) => f?.name?.toLowerCase() === "script.js"
  );

  const canPreview = Boolean(htmlFile);

  // ============================================================
  // PPT PREVIEW URL
  // ============================================================

  const pptPreviewUrl = useMemo(() => {
    if (!isPpt || !artifact?.downloadUrl) {
      return "";
    }

    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
      artifact.downloadUrl
    )}`;
  }, [isPpt, artifact?.downloadUrl]);

  // ============================================================
  // RESET WHEN ARTIFACT CHANGES
  // ============================================================

  useEffect(() => {
    setActiveFile(0);
    setCopied(false);
    setMobileOpen(false);

    if (artifact?.type === "pdf") {
      setTab("preview");
    } else if (
      artifact?.type === "ppt" ||
      artifact?.type === "powerpoint" ||
      artifact?.type === "presentation"
    ) {
      setTab("preview");
    } else {
      setTab("code");
    }
  }, [artifact]);

  // ============================================================
  // MAKE SURE ACTIVE FILE EXISTS
  // ============================================================

  useEffect(() => {
    if (!files.length) {
      setActiveFile(0);
      return;
    }

    if (activeFile >= files.length) {
      setActiveFile(0);
    }
  }, [files.length, activeFile]);

  // ============================================================
  // COPY SUCCESS RESET
  // ============================================================

  useEffect(() => {
    if (!copied) return;

    const timer = setTimeout(() => {
      setCopied(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [copied]);

  // ============================================================
  // LOCK BODY SCROLL WHILE MOBILE VIEWER IS OPEN
  // ============================================================

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // ============================================================
  // COPY PDF / PPT URL
  // ============================================================

  const handleCopyDownloadUrl = async () => {
    if (!artifact?.downloadUrl) return;

    try {
      await navigator.clipboard.writeText(artifact.downloadUrl);
      setCopied(true);
    } catch (error) {
      console.error("Failed to copy download URL:", error);
    }
  };

  // ============================================================
  // COPY CODE
  // ============================================================

  const handleCopy = async () => {
    if (!file?.content) return;

    try {
      await navigator.clipboard.writeText(file.content);
      setCopied(true);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  };

  // ============================================================
  // MONACO LANGUAGE
  // ============================================================

  const detectLanguage = (fileName = "") => {
    const name = fileName.toLowerCase();

    if (name.endsWith(".html")) return "html";
    if (name.endsWith(".css")) return "css";
    if (name.endsWith(".js")) return "javascript";
    if (name.endsWith(".jsx")) return "javascript";
    if (name.endsWith(".ts")) return "typescript";
    if (name.endsWith(".tsx")) return "typescript";
    if (name.endsWith(".json")) return "json";
    if (name.endsWith(".py")) return "python";
    if (name.endsWith(".java")) return "java";
    if (name.endsWith(".cpp")) return "cpp";
    if (name.endsWith(".c")) return "c";
    if (name.endsWith(".sql")) return "sql";
    if (name.endsWith(".md")) return "markdown";

    return "plaintext";
  };

  // ============================================================
  // WEBSITE PREVIEW
  // ============================================================

  const previewDoc = useMemo(() => {
    if (!htmlFile?.content) {
      return "";
    }

    let html = htmlFile.content;

    if (cssFile?.content) {
      const styleTag = `<style>${cssFile.content}</style>`;

      if (html.includes("</head>")) {
        html = html.replace("</head>", `${styleTag}</head>`);
      } else {
        html = `${styleTag}${html}`;
      }
    }

    if (jsFile?.content) {
      const scriptTag = `<script>${jsFile.content}<\/script>`;

      if (html.includes("</body>")) {
        html = html.replace("</body>", `${scriptTag}</body>`);
      } else {
        html += scriptTag;
      }
    }

    return html;
  }, [htmlFile, cssFile, jsFile]);

  // ============================================================
  // NO ARTIFACT
  // ============================================================

  if (!artifact) {
    return null;
  }

  // ============================================================
  // MOBILE TRIGGER META (icon / label / accent per type)
  // ============================================================

  const triggerMeta = isPpt
    ? {
        Icon: Presentation,
        label: "View Slides",
        chip: "linear-gradient(135deg, rgba(239,68,68,0.9) 0%, rgba(249,115,22,0.9) 100%)",
      }
    : isPdf
    ? {
        Icon: FileText,
        label: "View PDF",
        chip: gradientAccent,
      }
    : {
        Icon: Code2,
        label: "View Code",
        chip: gradientAccent,
      };

  // ============================================================
  // MOBILE FLOATING TRIGGER
  // ============================================================

  const MobileTrigger = (
    <button
      type="button"
      onClick={() => setMobileOpen(true)}
      className={`lg:hidden fixed bottom-25 right-6 z-40 flex items-center gap-3 pl-2 pr-3 py-1 rounded-full text-[12px] font-semibold text-white transition-all duration-200 active:scale-95 ${
        mobileOpen ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        background: triggerMeta.chip,
      }}
    >
      <triggerMeta.Icon size={14} />
      {triggerMeta.label}
    </button>
  );

  // ============================================================
  // SHARED INFO BAR
  // ============================================================

  const InfoBar = ({ icon: Icon, iconWrapClass, label }) => (
    <div className="px-4 py-3 border-b border-white/[0.07] shrink-0">
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`flex items-center justify-center w-7 h-7 rounded-md border ${iconWrapClass}`}
        >
          <Icon size={14} />
        </div>

        <div className="min-w-0">
          <div className="text-[11px] font-medium text-slate-300">
            {label}
          </div>

          <div className="text-[10px] text-slate-600 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-emerald-400/80" />
            Generated successfully
          </div>
        </div>
      </div>

      {artifact.subtitle && (
        <p className="text-[11px] leading-relaxed text-slate-500">
          {artifact.subtitle}
        </p>
      )}

      {isPpt && artifact.filename && (
        <div className="mt-2 text-[10px] text-slate-600 truncate">
          {artifact.filename}
        </div>
      )}
    </div>
  );

  // ============================================================
  // PPT ARTIFACT
  // ============================================================

  if (isPpt) {
    const pptBody = () => (
      <>
        <InfoBar
          icon={Presentation}
          iconWrapClass="bg-orange-500/10 border-orange-500/20 text-orange-400"
          label="PowerPoint Presentation"
        />

        <div className="flex-1 overflow-hidden bg-[#202124] p-2">
          {pptPreviewUrl ? (
            <motion.div
              key={`ppt-preview-${artifact.title || "presentation"}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              <iframe
                title={artifact.title || "PowerPoint Preview"}
                src={pptPreviewUrl}
                className="w-full h-full rounded-sm bg-white border-0"
                allowFullScreen
              />
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
              <Presentation size={36} className="text-slate-600" />

              <div>
                <p className="text-sm text-slate-400">
                  PowerPoint preview unavailable
                </p>

                <p className="text-[11px] text-slate-600 mt-1">
                  The PowerPoint download URL is missing.
                </p>
              </div>

              {artifact.downloadUrl && (
                <a
                  href={artifact.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white transition-all duration-200 hover:scale-[1.02]"
                  style={{ background: gradientAccent }}
                >
                  <ExternalLink size={13} />
                  Open PowerPoint
                </a>
              )}
            </div>
          )}
        </div>

        {artifact.downloadUrl && (
          <div className="px-4 py-3 border-t border-white/[0.07] shrink-0">
            <a
              href={artifact.downloadUrl}
              download={artifact.filename || "presentation.pptx"}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-[12px] font-medium text-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: gradientAccent,
                boxShadow: "0 4px 14px rgba(139,124,255,0.2)",
              }}
            >
              <ExternalLink size={14} />
              Download PowerPoint
            </a>
          </div>
        )}
      </>
    );

    const pptHeader = (isMobile) => (
      <div className="h-14 px-4 border-b border-white/[0.07] flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => (isMobile ? setMobileOpen(false) : setCollapsed(true))}
          className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-all duration-200 hover:scale-105 active:scale-95 bg-transparent border-none cursor-pointer shrink-0"
        >
          {isMobile ? <X size={18} /> : <PanelRightClose size={16} />}
        </button>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="flex items-center justify-center w-6 h-6 rounded-md border border-white/10 shrink-0 ring-1 ring-white/5"
            style={{
              background:
                "linear-gradient(135deg, rgba(239,68,68,0.22) 0%, rgba(249,115,22,0.18) 100%)",
            }}
          >
            <Presentation className="text-orange-400" size={13} />
          </div>

          <div className="text-[13px] font-medium text-slate-200 truncate">
            {artifact.title || "Generated PowerPoint"}
          </div>
        </div>

        {artifact.downloadUrl && (
          <button
            type="button"
            onClick={handleCopyDownloadUrl}
            title="Copy PowerPoint URL"
            className="flex items-center justify-center w-7 h-7 text-slate-500 hover:text-[#C1B7FF] hover:bg-white/[0.06] rounded-lg transition-all duration-200 bg-transparent border-none cursor-pointer hover:scale-105 active:scale-95"
          >
            {copied ? (
              <Check size={15} className="text-emerald-400" />
            ) : (
              <Copy size={15} />
            )}
          </button>
        )}

        {artifact.downloadUrl && (
          <a
            href={artifact.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open PowerPoint"
            className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-[#C1B7FF] hover:bg-white/[0.06] transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <ExternalLink size={15} />
          </a>
        )}
      </div>
    );

    if (collapsed) {
      return (
        <>
          {MobileTrigger}
          <motion.div
            initial={{ width: 400 }}
            animate={{ width: 48 }}
            transition={{ duration: 0.25, ease: easeInOut }}
            className="hidden lg:flex h-full border-l border-white/[0.07] flex-col items-center py-4 gap-3 shrink-0"
            style={{ background: panelBackground }}
          >
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-all duration-200 hover:scale-105 active:scale-95 bg-transparent border-none cursor-pointer shrink-0"
            >
              <PanelRightOpen size={16} />
            </button>

            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div
                style={{ writingMode: "vertical-lr", transform: "rotate(180deg)" }}
                className="text-[10px] font-medium text-slate-600 tracking-widest uppercase whitespace-nowrap"
              >
                {artifact.title || "PowerPoint"}
              </div>
            </div>
          </motion.div>
        </>
      );
    }

    return (
      <>
        {MobileTrigger}

        <motion.div
          initial={{ width: 400 }}
          animate={{ width: 400 }}
          transition={{ duration: 0.25, ease: easeInOut }}
          className="hidden lg:flex h-full border-l border-white/[0.07] flex-col overflow-hidden shrink-0"
          style={{ background: panelBackground }}
        >
          {pptHeader(false)}
          {pptBody()}
        </motion.div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.28, ease: easeInOut }}
              className="lg:hidden fixed inset-0 z-[60] flex flex-col"
              style={{ background: panelBackground }}
            >
              {pptHeader(true)}
              {pptBody()}
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // ============================================================
  // PDF ARTIFACT
  // ============================================================

  if (isPdf) {
    const pdfHeader = (isMobile) => (
      <div className="h-14 px-4 border-b border-white/[0.07] flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => (isMobile ? setMobileOpen(false) : setCollapsed(true))}
          className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-all duration-200 hover:scale-105 active:scale-95 bg-transparent border-none cursor-pointer shrink-0"
        >
          {isMobile ? <X size={18} /> : <PanelRightClose size={16} />}
        </button>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="flex items-center justify-center w-6 h-6 rounded-md border border-white/10 shrink-0 ring-1 ring-white/5"
            style={{
              background:
                "linear-gradient(135deg, rgba(155,140,255,0.25) 0%, rgba(79,143,255,0.25) 100%)",
            }}
          >
            <FileText className="text-[#C1B7FF]" size={13} />
          </div>

          <div className="text-[13px] font-medium text-slate-200 truncate">
            {artifact.title || "Generated PDF"}
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyDownloadUrl}
          title="Copy PDF URL"
          className="flex items-center justify-center w-7 h-7 text-slate-500 hover:text-[#C1B7FF] hover:bg-white/[0.06] rounded-lg transition-all duration-200 bg-transparent border-none cursor-pointer hover:scale-105 active:scale-95"
        >
          {copied ? (
            <Check size={15} className="text-emerald-400" />
          ) : (
            <Copy size={15} />
          )}
        </button>

        {artifact.downloadUrl && (
          <a
            href={artifact.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open PDF"
            className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-[#C1B7FF] hover:bg-white/[0.06] transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <ExternalLink size={15} />
          </a>
        )}
      </div>
    );

    const pdfBody = () => (
      <>
        <InfoBar
          icon={FileText}
          iconWrapClass="bg-rose-500/10 border-rose-500/20 text-rose-400"
          label="PDF Document"
        />

        <div className="flex-1 overflow-hidden bg-[#202124] p-2">
          {artifact.downloadUrl ? (
            <iframe
              title={artifact.title || "PDF Preview"}
              src={artifact.downloadUrl}
              className="w-full h-full rounded-sm bg-white border-0"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
              <FileText size={36} className="text-slate-600" />

              <div>
                <p className="text-sm text-slate-400">
                  PDF preview unavailable
                </p>

                <p className="text-[11px] text-slate-600 mt-1">
                  The PDF download URL is missing.
                </p>
              </div>
            </div>
          )}
        </div>
      </>
    );

    if (collapsed) {
      return (
        <>
          {MobileTrigger}
          <motion.div
            initial={{ width: 400 }}
            animate={{ width: 48 }}
            transition={{ duration: 0.25, ease: easeInOut }}
            className="hidden lg:flex h-full border-l border-white/[0.07] flex-col items-center py-4 gap-3 shrink-0"
            style={{ background: panelBackground }}
          >
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-all duration-200 hover:scale-105 active:scale-95 bg-transparent border-none cursor-pointer shrink-0"
            >
              <PanelRightOpen size={16} />
            </button>

            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div
                style={{ writingMode: "vertical-lr", transform: "rotate(180deg)" }}
                className="text-[10px] font-medium text-slate-600 tracking-widest uppercase whitespace-nowrap"
              >
                {artifact.title || "PDF"}
              </div>
            </div>
          </motion.div>
        </>
      );
    }

    return (
      <>
        {MobileTrigger}

        <motion.div
          initial={{ width: 400 }}
          animate={{ width: 400 }}
          transition={{ duration: 0.25, ease: easeInOut }}
          className="hidden lg:flex h-full border-l border-white/[0.07] flex-col overflow-hidden shrink-0"
          style={{ background: panelBackground }}
        >
          {pdfHeader(false)}
          {pdfBody()}
        </motion.div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.28, ease: easeInOut }}
              className="lg:hidden fixed inset-0 z-[60] flex flex-col"
              style={{ background: panelBackground }}
            >
              {pdfHeader(true)}
              {pdfBody()}
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // ============================================================
  // INVALID CODE ARTIFACT
  // ============================================================

  if (!isCode) {
    return null;
  }

  // ============================================================
  // CODE ARTIFACT
  // ============================================================

  const codeHeader = (isMobile) => (
    <div className="h-14 px-4 border-b border-white/[0.07] flex items-center gap-3 shrink-0">
      <button
        type="button"
        onClick={() => (isMobile ? setMobileOpen(false) : setCollapsed(true))}
        className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-all duration-200 hover:scale-105 active:scale-95 bg-transparent border-none cursor-pointer shrink-0"
      >
        {isMobile ? <X size={18} /> : <PanelRightClose size={16} />}
      </button>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div
          className="flex items-center justify-center w-6 h-6 rounded-md border border-white/10 shrink-0 ring-1 ring-white/5"
          style={{
            background:
              "linear-gradient(135deg, rgba(155,140,255,0.25) 0%, rgba(79,143,255,0.25) 100%)",
          }}
        >
          <Code2 className="text-[#C1B7FF]" size={12} />
        </div>

        <div className="text-[13px] font-medium text-slate-200 truncate">
          {artifact.title || "Generated Code"}
        </div>
      </div>

      <button
        type="button"
        onClick={handleCopy}
        title="Copy code"
        className="flex items-center justify-center w-7 h-7 text-slate-500 hover:text-[#C1B7FF] hover:bg-white/[0.06] rounded-lg transition-all duration-200 bg-transparent border-none cursor-pointer hover:scale-105 active:scale-95"
      >
        {copied ? (
          <Check size={15} className="text-emerald-400" />
        ) : (
          <Copy size={15} />
        )}
      </button>

      {canPreview && (
        <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.07] p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setTab("code")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md transition-all duration-200 ${
              tab === "code" ? "text-white shadow-sm" : "text-slate-500 hover:text-slate-200"
            }`}
            style={
              tab === "code"
                ? {
                    background: gradientAccent,
                    boxShadow: "0 2px 8px rgba(139,124,255,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
                  }
                : undefined
            }
          >
            <Code2 size={11} />
            Code
          </button>

          <button
            type="button"
            onClick={() => setTab("preview")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md transition-all duration-200 ${
              tab === "preview" ? "text-white shadow-sm" : "text-slate-500 hover:text-slate-200"
            }`}
            style={
              tab === "preview"
                ? {
                    background: gradientAccent,
                    boxShadow: "0 2px 8px rgba(139,124,255,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
                  }
                : undefined
            }
          >
            <Eye size={11} />
            Preview
          </button>
        </div>
      )}
    </div>
  );

  const codeBody = () => (
    <>
      {tab === "code" && (
        <div className="flex border-b border-white/[0.07] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0">
          {files.map((f, index) => (
            <button
              key={f?.name || index}
              type="button"
              onClick={() => {
                setActiveFile(index);
                setCopied(false);
              }}
              className={`px-4 py-2.5 text-[11px] font-medium whitespace-nowrap transition-colors duration-200 border-r border-white/[0.05] relative cursor-pointer bg-transparent ${
                activeFile === index ? "text-[#C1B7FF]" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {f?.name || `File ${index + 1}`}

              {activeFile === index && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full"
                  style={{ background: gradientAccent, boxShadow: "0 0 8px rgba(139,124,255,0.6)" }}
                />
              )}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {tab === "preview" && canPreview ? (
          <motion.div
            key={`preview-${artifact.title || "artifact"}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            <iframe
              title="Website Preview"
              srcDoc={previewDoc}
              sandbox="allow-scripts"
              className="w-full h-full bg-white border-0"
            />
          </motion.div>
        ) : (
          <motion.div
            key={`code-${file?.name || "file"}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            <Editor
              theme="vs-dark"
              language={detectLanguage(file?.name)}
              value={file?.content || ""}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 13,
                wordWrap: "on",
                automaticLayout: true,
                scrollBeyondLastLine: false,
                padding: { top: 16 },
                lineNumbers: "on",
                renderLineHighlight: "none",
              }}
            />
          </motion.div>
        )}
      </div>
    </>
  );

  return (
    <>
      {MobileTrigger}

      <motion.div
        initial={{ width: 400 }}
        animate={{ width: collapsed ? 48 : 400 }}
        transition={{ duration: 0.25, ease: easeInOut }}
        className="hidden lg:flex h-full border-l border-white/[0.07] flex-col overflow-hidden shrink-0"
        style={{ background: panelBackground }}
      >
        {!collapsed ? (
          <div className="flex flex-col h-full">
            {codeHeader(false)}
            {codeBody()}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center py-4 gap-3">
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-all duration-200 hover:scale-105 active:scale-95 bg-transparent border-none cursor-pointer shrink-0"
            >
              <PanelRightOpen size={16} />
            </button>

            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div
                style={{ writingMode: "vertical-lr", transform: "rotate(180deg)" }}
                className="text-[10px] font-medium text-slate-600 tracking-widest uppercase whitespace-nowrap"
              >
                {artifact.title || "Generated Code"}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.28, ease: easeInOut }}
            className="lg:hidden fixed inset-0 z-[60] flex flex-col"
            style={{ background: panelBackground }}
          >
            {codeHeader(true)}
            {codeBody()}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Artifact;