"use client";

import { useState, useMemo } from "react";
import {
  X,
  Copy,
  Check,
  FileCode,
  Info,
  Pencil,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Key,
  Code2,
  Terminal,
  Layers,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { generateToolScript } from "@/lib/script-generator";

interface InspectionModalProps {
  endpoint: any;
  tool: string;
  onClose: () => void;
}

const METHOD_STYLES: Record<string, { bg: string; text: string; border: string; darkBg: string; darkText: string; darkBorder: string }> = {
  GET:    { bg: "bg-sky-500/10",     text: "text-sky-700",     border: "border-sky-500/30",     darkBg: "bg-sky-500/10",     darkText: "text-sky-400",     darkBorder: "border-sky-500/30" },
  POST:   { bg: "bg-emerald-500/10", text: "text-emerald-700", border: "border-emerald-500/30", darkBg: "bg-emerald-500/10", darkText: "text-emerald-400", darkBorder: "border-emerald-500/30" },
  PUT:    { bg: "bg-amber-500/10",   text: "text-amber-700",   border: "border-amber-500/30",   darkBg: "bg-amber-500/10",   darkText: "text-amber-400",   darkBorder: "border-amber-500/30" },
  PATCH:  { bg: "bg-purple-500/10",  text: "text-purple-700",  border: "border-purple-500/30",  darkBg: "bg-purple-500/10",  darkText: "text-purple-400",  darkBorder: "border-purple-500/30" },
  DELETE: { bg: "bg-rose-500/10",    text: "text-rose-700",    border: "border-rose-500/30",    darkBg: "bg-rose-500/10",    darkText: "text-rose-400",    darkBorder: "border-rose-500/30" },
};

export const InspectionModal = ({ endpoint, tool, onClose }: InspectionModalProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const t = (dark: string, light: string) => isDark ? dark : light;

  const [activeTab, setActiveTab] = useState<"info" | "script">("info");
  const [copiedScript, setCopiedScript]   = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedHeaders, setCopiedHeaders] = useState(false);
  const [copiedUrl, setCopiedUrl]         = useState(false);

  const initialScript = useMemo(() => generateToolScript(endpoint, tool), [endpoint, tool]);
  const [scriptContent, setScriptContent] = useState(initialScript);
  const [isEditing, setIsEditing]         = useState(false);
  const [fontSize, setFontSize]           = useState(14);

  const method      = (endpoint?.method || "GET").toUpperCase();
  const ms          = METHOD_STYLES[method] || METHOD_STYLES.GET;
  const methodBg    = isDark ? ms.darkBg    : ms.bg;
  const methodText  = isDark ? ms.darkText  : ms.text;
  const methodBdr   = isDark ? ms.darkBorder : ms.border;

  const copyText = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetScript = () => {
    setScriptContent(initialScript);
    setIsEditing(false);
  };

  const lineCount = useMemo(() => scriptContent.split("\n").length, [scriptContent]);

  const headersObj    = endpoint?.headers || {};
  const hasHeaders    = Object.keys(headersObj).length > 0;
  const headersString = hasHeaders ? JSON.stringify(headersObj, null, 2) : "{}";

  const rawPayload = endpoint?.requestBody || (endpoint as any)?.body || null;
  const formattedPayload = useMemo(() => {
    if (rawPayload === null || rawPayload === undefined) return null;
    const str = String(rawPayload).trim();
    if (str === "") return null;
    try {
      return JSON.stringify(JSON.parse(str), null, 2);
    } catch {
      return str;
    }
  }, [rawPayload]);

  // ── Theme tokens ────────────────────────────────────────────────────────────
  const modal     = t("bg-[#0d1526] text-slate-100", "bg-white text-slate-900");
  const overlay   = t("bg-slate-950/80", "bg-slate-500/40");
  const header    = t("bg-slate-900/70 border-slate-800/80", "bg-slate-50 border-slate-200");
  const tabsBar   = t("bg-[#090e1c] border-slate-800", "bg-slate-100 border-slate-200");
  const tabActive = t("border-sky-500 text-sky-400 bg-sky-500/8", "border-sky-600 text-sky-700 bg-sky-500/8");
  const tabInact  = t("border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5", "border-transparent text-slate-500 hover:text-slate-700 hover:bg-white");
  const card      = t("border-slate-800 bg-slate-900/40", "border-slate-200 bg-slate-50");
  const codeBlock = t("bg-[#060c1a] border-slate-800/80", "bg-slate-900 border-slate-200");
  const label     = t("text-slate-400", "text-slate-500");
  const emptyText = t("text-slate-500", "text-slate-400");
  const toolbarBg = t("bg-slate-900/80 border-slate-800", "bg-white border-slate-200 shadow-sm");
  const editorBg  = t("bg-[#060c1a] border-slate-800", "bg-slate-900 border-slate-200");
  const editorTxt = t(isEditing ? "text-emerald-300" : "text-emerald-400", isEditing ? "text-emerald-700" : "text-emerald-800");
  const statBarBg = t("bg-[#070b17] border-slate-800/80 text-slate-500", "bg-slate-100 border-slate-200 text-slate-400");
  const statStrong= t("text-slate-300", "text-slate-700");
  const editBtn   = isEditing
    ? t("bg-emerald-500/20 text-emerald-300 border-emerald-500/40", "bg-emerald-500/15 text-emerald-700 border-emerald-500/40")
    : t("bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white", "bg-white text-slate-600 border-slate-300 hover:bg-slate-50 hover:text-slate-900");
  const copyBtnBg = t("bg-sky-600 hover:bg-sky-500 shadow-sky-950", "bg-sky-600 hover:bg-sky-500 shadow-sky-200");
  const zoomGroup = t("bg-[#060c1a] border-slate-800", "bg-slate-100 border-slate-200");
  const zoomBtn   = t("text-slate-400 hover:text-white hover:bg-slate-700", "text-slate-500 hover:text-slate-900 hover:bg-slate-200");
  const zoomLabel = t("text-sky-400", "text-sky-700");
  const resetBtn  = t("text-slate-400 hover:text-amber-400 hover:bg-slate-800/60 border-transparent hover:border-slate-700", "text-slate-400 hover:text-amber-600 hover:bg-amber-50 border-transparent hover:border-amber-200");
  const hdrIcon   = t("from-sky-500/20 to-emerald-500/20 border-sky-500/30 text-sky-400", "from-sky-500/15 to-emerald-500/15 border-sky-400/40 text-sky-600");
  const hdrTitle  = t("text-white", "text-slate-900");
  const hdrUrl    = t("text-slate-400", "text-slate-500");
  const closeBtn  = t("text-slate-400 hover:text-white hover:bg-slate-800", "text-slate-400 hover:text-slate-900 hover:bg-slate-100");

  // Headers copy btn
  const copyLinkCls = t("text-slate-400 hover:text-white", "text-slate-400 hover:text-slate-700");
  // URL row bg
  const urlRowBg  = t("bg-[#050813] border-slate-800/80", "bg-white border-slate-200");
  const urlText   = t("text-slate-200", "text-slate-700");

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center ${overlay} backdrop-blur-md p-4 sm:p-6`}
         style={{ animation: "fadeIn 0.15s ease" }}>
      <div className={`${modal} rounded-2xl w-full max-w-4xl border ${t("border-slate-700/50 shadow-[0_25px_70px_rgba(0,0,0,0.8)]", "border-slate-200 shadow-[0_25px_70px_rgba(0,0,0,0.15)]")} flex flex-col max-h-[92vh] overflow-hidden`}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${header} shrink-0`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-gradient-to-br ${hdrIcon} border`}>
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-base font-bold tracking-wide ${hdrTitle}`}>Inspección de Endpoint</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${methodBg} ${methodText} ${methodBdr}`}>
                  {method}
                </span>
              </div>
              <p className={`font-mono text-xs truncate max-w-md sm:max-w-xl ${hdrUrl}`}>
                {endpoint?.endpoint || "http://localhost"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${closeBtn}`}
            title="Cerrar ventana"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div className={`flex border-b ${tabsBar} px-6 gap-2 shrink-0`}>
          {(["info", "script"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold tracking-wide border-b-2 transition-all ${activeTab === tab ? tabActive : tabInact}`}
            >
              {tab === "info"
                ? <><Info className="h-4 w-4" />Configuración &amp; Payload</>
                : <><FileCode className="h-4 w-4" />Script Generado ({tool.toUpperCase()})<span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono ${t("bg-slate-800 text-slate-300", "bg-slate-200 text-slate-600")}`}>YAML</span></>
              }
            </button>
          ))}
        </div>

        {/* ── Content ───────────────────────────────────────────────────── */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === "info" ? (
            <div className="space-y-5">

              {/* URL & Method card */}
              <div className={`rounded-xl border ${card} p-4 space-y-3`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] uppercase font-bold tracking-wider ${label} flex items-center gap-1.5`}>
                    <Layers className="h-3.5 w-3.5 text-sky-500" />Destino HTTP
                  </span>
                  <button onClick={() => copyText(endpoint?.endpoint || "", setCopiedUrl)}
                    className={`inline-flex items-center gap-1 text-xs transition-colors ${copyLinkCls}`}>
                    {copiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedUrl ? "Copiado" : "Copiar URL"}</span>
                  </button>
                </div>
                <div className={`flex items-center gap-3 ${urlRowBg} border rounded-lg p-3`}>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-black border ${methodBg} ${methodText} ${methodBdr}`}>
                    {method}
                  </span>
                  <span className={`font-mono text-xs sm:text-sm break-all flex-1 ${urlText}`}>
                    {endpoint?.endpoint || "http://localhost"}
                  </span>
                </div>
              </div>

              {/* Headers card */}
              <div className={`rounded-xl border ${card} p-4 space-y-3`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] uppercase font-bold tracking-wider ${label} flex items-center gap-1.5`}>
                    <Key className="h-3.5 w-3.5 text-amber-500" />Cabeceras HTTP (Headers)
                  </span>
                  {hasHeaders && (
                    <button onClick={() => copyText(headersString, setCopiedHeaders)}
                      className={`inline-flex items-center gap-1 text-xs transition-colors ${copyLinkCls}`}>
                      {copiedHeaders ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedHeaders ? "Copiado" : "Copiar Headers"}</span>
                    </button>
                  )}
                </div>
                {hasHeaders ? (
                  <pre className={`${codeBlock} border rounded-lg p-4 font-mono text-xs text-sky-500 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed`}>
                    {headersString}
                  </pre>
                ) : (
                  <div className={`${urlRowBg} border rounded-lg p-3.5 text-xs ${emptyText} font-mono italic`}>
                    {"{ }  — No se enviaron cabeceras personalizadas adicionales"}
                  </div>
                )}
              </div>

              {/* Payload card */}
              <div className={`rounded-xl border ${card} p-4 space-y-3`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] uppercase font-bold tracking-wider ${label} flex items-center gap-1.5`}>
                    <Code2 className="h-3.5 w-3.5 text-emerald-500" />Carga Útil (Payload Body)
                  </span>
                  {formattedPayload && (
                    <button onClick={() => copyText(formattedPayload, setCopiedPayload)}
                      className={`inline-flex items-center gap-1 text-xs transition-colors ${copyLinkCls}`}>
                      {copiedPayload ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedPayload ? "Copiado" : "Copiar Payload"}</span>
                    </button>
                  )}
                </div>
                {formattedPayload ? (
                  <pre className={`${codeBlock} border rounded-lg p-4 font-mono text-xs overflow-x-auto whitespace-pre-wrap break-all leading-relaxed ${t("text-emerald-300", "text-emerald-700")}`}>
                    {formattedPayload}
                  </pre>
                ) : (
                  <div className={`${urlRowBg} border rounded-lg p-3.5 text-xs ${emptyText} font-mono italic`}>
                    {"{ }  — Sin Payload Body (Petición sin cuerpo)"}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full space-y-3">

              {/* Script toolbar */}
              <div className={`flex flex-wrap items-center justify-between gap-3 ${toolbarBg} border rounded-xl px-4 py-2.5`}>
                <div className="flex items-center gap-2">

                  {/* Zoom group */}
                  <div className={`flex items-center ${zoomGroup} border rounded-lg p-0.5`}>
                    <button
                      onClick={() => setFontSize(s => Math.max(s - 2, 8))}
                      disabled={fontSize <= 8}
                      className={`p-1.5 rounded transition-colors disabled:opacity-30 ${zoomBtn}`}
                      title="Reducir tamaño (A−)"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </button>
                    <span className={`px-2 text-xs font-mono font-bold select-none min-w-[44px] text-center ${zoomLabel}`}>
                      {fontSize}px
                    </span>
                    <button
                      onClick={() => setFontSize(s => Math.min(s + 2, 32))}
                      disabled={fontSize >= 32}
                      className={`p-1.5 rounded transition-colors disabled:opacity-30 ${zoomBtn}`}
                      title="Aumentar tamaño (A+)"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                  </div>

                  <div className={`h-4 w-px mx-1 ${t("bg-slate-700", "bg-slate-200")}`} />

                  {/* Edit toggle */}
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${editBtn}`}
                  >
                    {isEditing ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                    <span>{isEditing ? "Guardar Edición" : "Editar Script"}</span>
                  </button>

                  {/* Reset */}
                  <button
                    onClick={handleResetScript}
                    className={`p-2 rounded-lg border transition-colors cursor-pointer ${resetBtn}`}
                    title="Restablecer script al valor original"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>

                {/* Copy script */}
                <button
                  onClick={() => copyText(scriptContent, setCopiedScript)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg ${copyBtnBg} text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer`}
                >
                  {copiedScript ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copiedScript ? "¡Copiado!" : "Copiar Script"}</span>
                </button>
              </div>

              {/* Editor */}
              <div className={`relative rounded-xl border ${editorBg} overflow-hidden shadow-inner flex flex-col`}>
                <textarea
                  value={scriptContent}
                  readOnly={!isEditing}
                  onChange={(e) => setScriptContent(e.target.value)}
                  className={`w-full bg-transparent p-5 font-mono resize-none outline-none leading-relaxed transition-all ${editorTxt} ${isEditing ? "focus:ring-1 focus:ring-emerald-500/40" : "select-text"}`}
                  style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: `${Math.round(fontSize * 1.58)}px`,
                    minHeight: "360px",
                    height: "440px",
                  }}
                  spellCheck={false}
                />

                {/* Status bar */}
                <div className={`flex items-center justify-between px-4 py-2 border-t text-[11px] font-mono ${statBarBg}`}>
                  <div className="flex items-center gap-4">
                    <span>Líneas: <strong className={statStrong}>{lineCount}</strong></span>
                    <span>Caracteres: <strong className={statStrong}>{scriptContent.length}</strong></span>
                    <span>Tamaño: <strong className={zoomLabel}>{fontSize}px</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block h-2 w-2 rounded-full ${isEditing ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
                    <span className={t("text-slate-400", "text-slate-500")}>
                      {isEditing ? "Modo Edición activo" : "Solo lectura"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes fadeIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
};
