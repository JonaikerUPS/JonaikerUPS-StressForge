"use client";

import { useState, useEffect, useRef } from "react";
import { Terminal, X, Minimize2, Maximize2, ZoomIn, ZoomOut, Maximize, Minimize } from "lucide-react";
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
        
        <div className="flex items-center gap-2">
          <button onClick={() => setFontSize(prev => Math.min(prev + 2, 24))} className={t('text-slate-400 hover:text-white', 'text-slate-500 hover:text-slate-900')}>
            <ZoomIn className="h-4 w-4" />
          </button>
          <button onClick={() => setFontSize(prev => Math.max(prev - 2, 8))} className={t('text-slate-400 hover:text-white', 'text-slate-500 hover:text-slate-900')}>
            <ZoomOut className="h-4 w-4" />
          </button>
          <button onClick={() => setIsFullscreen(!isFullscreen)} className={t('text-slate-400 hover:text-white', 'text-slate-500 hover:text-slate-900')}>
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
          <button onClick={() => setMinimized(!minimized)} className={t('text-slate-400 hover:text-white', 'text-slate-500 hover:text-slate-900')}>
            {minimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </button>
          <button onClick={onClose} className={t('text-slate-400 hover:text-white', 'text-slate-500 hover:text-slate-900')}>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {!minimized && (
        <pre className="h-full w-full overflow-y-auto bg-slate-950 p-4 font-mono whitespace-pre" style={{ fontSize: `${fontSize}px` }}>
          {liveLogs}
        </pre>
      )}
    </div>
  );
}
