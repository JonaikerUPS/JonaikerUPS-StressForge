"use client";

import { useState, useEffect, useRef } from "react";
import { Terminal, X, Minimize2, Maximize2, ZoomIn, ZoomOut, Maximize, Minimize, Type } from "lucide-react";
import { useSocket } from "@/lib/socket-context";
import { useTheme } from "@/lib/theme-context";

export function ConsoleModal({ isOpen, onClose, logs }: { isOpen: boolean; onClose: () => void; logs: string }) {
  const [minimized, setMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState(12);
  const [liveLogs, setLiveLogs] = useState(logs);
  const [height, setHeight] = useState(384);
  const [isResizing, setIsResizing] = useState(false);
  const socket = useSocket();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const t = (dark: string, light: string) => isDarkMode ? dark : light;

  useEffect(() => {
    setLiveLogs(logs);
  }, [logs]);

  useEffect(() => {
    if (!socket) return;
    socket.on("test-log", (msg: string) => {
        if (msg.trim() === "+") return;
        setLiveLogs(prev => prev + "\n" + msg);
    });
    return () => { socket.off("test-log"); };
  }, [socket]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newHeight = window.innerHeight - e.clientY;
      setHeight(Math.max(150, Math.min(newHeight, window.innerHeight - 50)));
    };
    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed z-50 flex flex-col border-t shadow-2xl transition-all ${t('border-slate-700 bg-slate-900', 'border-slate-300 bg-white')} ${
        isFullscreen ? "inset-0 h-full w-full" : minimized ? "bottom-0 left-0 h-12 w-full" : "bottom-0 left-0 w-full"
      }`}
      style={!isFullscreen && !minimized ? { height: `${height}px` } : {}}
    >
      {!isFullscreen && !minimized && (
        <div 
          className="h-2 cursor-ns-resize bg-transparent hover:bg-slate-700 w-full" 
          onMouseDown={() => setIsResizing(true)} 
        />
      )}
      
      <div className={`flex items-center justify-between border-b p-2 ${t('border-slate-700 bg-slate-800', 'border-slate-300 bg-slate-100')}`}>
        <div className={`flex items-center gap-2 ${t('text-slate-300', 'text-slate-700')}`}>
            <Terminal className="h-5 w-5" />
            <span className="text-sm font-mono">Consola</span>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Zoom control group */}
          <div className={`flex items-center rounded-md border ${t('border-slate-700 bg-slate-900', 'border-slate-300 bg-slate-200')} overflow-hidden`}>
            <button
              onClick={() => setFontSize(prev => Math.max(prev - 2, 8))}
              disabled={fontSize <= 8}
              title="Reducir tamaño de letra"
              className={`px-2 py-1 text-xs transition-colors disabled:opacity-30 ${t('text-slate-400 hover:text-white hover:bg-slate-700', 'text-slate-500 hover:text-slate-900 hover:bg-slate-300')}`}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className={`px-2 text-[11px] font-mono font-bold select-none min-w-[36px] text-center ${t('text-sky-400', 'text-sky-600')}`}>
              {fontSize}px
            </span>
            <button
              onClick={() => setFontSize(prev => Math.min(prev + 2, 32))}
              disabled={fontSize >= 32}
              title="Aumentar tamaño de letra"
              className={`px-2 py-1 text-xs transition-colors disabled:opacity-30 ${t('text-slate-400 hover:text-white hover:bg-slate-700', 'text-slate-500 hover:text-slate-900 hover:bg-slate-300')}`}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className={`w-px h-4 mx-1 ${t('bg-slate-700', 'bg-slate-300')}`} />

          <button onClick={() => setIsFullscreen(!isFullscreen)} title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'} className={`p-1.5 rounded transition-colors ${t('text-slate-400 hover:text-white hover:bg-slate-700', 'text-slate-500 hover:text-slate-900 hover:bg-slate-200')}`}>
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
          <button onClick={() => setMinimized(!minimized)} title={minimized ? 'Restaurar' : 'Minimizar'} className={`p-1.5 rounded transition-colors ${t('text-slate-400 hover:text-white hover:bg-slate-700', 'text-slate-500 hover:text-slate-900 hover:bg-slate-200')}`}>
            {minimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </button>
          <button onClick={onClose} title="Cerrar consola" className={`p-1.5 rounded transition-colors ${t('text-slate-400 hover:text-red-400 hover:bg-slate-700', 'text-slate-500 hover:text-red-600 hover:bg-slate-200')}`}>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {!minimized && (
        <pre className="h-full w-full overflow-y-auto bg-slate-950 p-4 font-mono whitespace-pre text-emerald-400 shadow-inner" style={{ fontSize: `${fontSize}px` }}>
          {liveLogs || "[SISTEMA] Consola lista. Esperando eventos de ejecución..."}
        </pre>
      )}
    </div>
  );
}
