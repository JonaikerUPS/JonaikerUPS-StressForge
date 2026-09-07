"use client";

import { useState } from "react";
import { X, Copy, Check, FileCode, Info, Pencil, Trash2, ZoomIn, ZoomOut } from "lucide-react";
import { generateToolScript } from "@/lib/script-generator";

interface InspectionModalProps {
  endpoint: any;
  tool: string;
  onClose: () => void;
}

export const InspectionModal = ({ endpoint, tool, onClose }: InspectionModalProps) => {
  const [activeTab, setActiveTab] = useState<"info" | "script">("info");
  const [copied, setCopied] = useState(false);
  const [scriptContent, setScriptContent] = useState(() => generateToolScript(endpoint, tool));
  const [isEditing, setIsEditing] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState(300);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(scriptContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/5 shrink-0">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Inspeccionar Endpoint</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="flex border-b border-slate-100 dark:border-white/5 shrink-0">
          <button
            onClick={() => setActiveTab("info")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "info" ? "border-sky-500 text-sky-600 dark:text-sky-400" : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"}`}
          >
            <Info className="h-4 w-4" /> Configuración
          </button>
          <button
            onClick={() => setActiveTab("script")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "script" ? "border-sky-500 text-sky-600 dark:text-sky-400" : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"}`}
          >
            <FileCode className="h-4 w-4" /> Script Generado ({tool.toUpperCase()})
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === "info" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Método</p>
                  <p className="font-mono text-sm">{endpoint.method}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500">URL</p>
                  <p className="font-mono text-sm break-all">{endpoint.endpoint}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Headers</p>
                <pre className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">{JSON.stringify(endpoint.headers || {}, null, 2)}</pre>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Payload</p>
                <pre className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">{endpoint.requestBody || "{}"}</pre>
              </div>
            </div>
          ) : (
            <div className="relative h-full flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <div className="flex gap-2">
                  <button onClick={() => setIsEditing(!isEditing)} className={`p-2 rounded-lg transition-colors ${isEditing ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                    {isEditing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                  </button>
                  <button onClick={() => setTextareaHeight(h => Math.min(h + 50, 600))} className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white">
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <button onClick={() => setTextareaHeight(h => Math.max(h - 50, 100))} className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white">
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <button onClick={() => setScriptContent("")} className="p-2 bg-slate-800 text-red-400 rounded-lg hover:text-red-300">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <textarea 
                value={scriptContent}
                readOnly={!isEditing}
                onChange={(e) => setScriptContent(e.target.value)}
                className="w-full bg-slate-950 p-4 rounded-xl text-emerald-400 font-mono text-xs resize-none outline-none focus:ring-1 focus:ring-emerald-500/50"
                style={{ height: `${textareaHeight}px` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
