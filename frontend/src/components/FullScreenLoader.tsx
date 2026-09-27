"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Sparkles } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import dynamic from 'next/dynamic';

const LoaderCore3D = dynamic(() => import('@/components/LoaderCore3D'), {
  ssr: false,
});

const loadingSteps = [
  "Cargando núcleo del sistema...",
  "Sincronizando electrones de red...",
  "Estableciendo enlaces cuánticos...",
  "Optimización de rendimiento...",
  "¡Sistema listo para despegar!"
];

const FullScreenLoader = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const ink = isDark ? 'text-white' : 'text-slate-900';
  const muted = isDark ? 'text-slate-400' : 'text-slate-500';

  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % loadingSteps.length);
    }, 600);

    return () => {
      clearInterval(stepInterval);
    };
  }, []);

  return (
    <motion.div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden backdrop-blur-2xl ${
        isDark ? 'bg-[#020617]/95' : 'bg-[#f8fafc]/95'
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background ambient glowing spheres */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-cyan-500/20 blur-[140px] animate-pulse" />
      <div
        className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-[140px] animate-pulse"
        style={{ animationDelay: '1s' }}
      />
      <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,#38bdf8_1px,transparent_1px),linear-gradient(to_bottom,#38bdf8_1px,transparent_1px)] [background-size:48px_48px]" />

      {/* 3D Atomic Interactive Container */}
      <div className="relative flex items-center justify-center w-80 h-80 sm:w-96 sm:h-96">
        {/* 3D WebGL Three.js Gyroscope & Particle Cloud */}
        <div className="absolute inset-0 flex items-center justify-center">
          <LoaderCore3D isDark={isDark} />
        </div>

        {/* Central Nucleus with System Logo & Name floating in 3D center */}
        <motion.div
          className={`relative z-20 flex flex-col items-center justify-center w-36 h-36 sm:w-44 sm:h-44 rounded-full border border-cyan-400/40 bg-gradient-to-br ${
            isDark
              ? 'from-slate-950/85 via-[#030914]/90 to-sky-950/80 text-white shadow-[0_0_60px_rgba(14,165,233,0.5)]'
              : 'from-white/90 via-slate-100/90 to-sky-50/95 text-slate-900 shadow-[0_0_40px_rgba(14,165,233,0.3)]'
          } backdrop-blur-xl p-4 text-center`}
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
        >
          <div className="flex items-center justify-center w-9 h-9 mb-1.5 rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-500 text-slate-950 shadow-[0_0_20px_rgba(14,165,233,0.7)]">
            <Zap className="h-5 w-5" fill="currentColor" />
          </div>
          <span className="text-xs sm:text-sm font-black tracking-[0.25em] uppercase bg-gradient-to-r from-sky-400 via-fuchsia-400 to-emerald-400 bg-clip-text text-transparent">
            STRESSFORGE
          </span>
          <span className={`text-[9px] font-bold tracking-widest ${muted} mt-1 font-mono`}>
            CORE ENGINE // 3D
          </span>
        </motion.div>
      </div>

      {/* Dynamic Loading Message below 3D reactor */}
      <div className="mt-10 flex flex-col items-center z-10">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-cyan-400 animate-spin" />
          <AnimatePresence mode="wait">
            <motion.p
              key={stepIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className={`text-sm font-bold tracking-wider font-mono ${ink}`}
            >
              {loadingSteps[stepIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="w-56 h-1.5 rounded-full overflow-hidden bg-slate-900/60 border border-white/10 shadow-[0_0_15px_rgba(14,165,233,0.3)]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-emerald-400 shadow-[0_0_12px_rgba(14,165,233,0.9)]"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default FullScreenLoader;