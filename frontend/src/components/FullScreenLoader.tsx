import React from 'react';
import { motion } from 'framer-motion';

const FullScreenLoader = () => {
  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Abstract Background Grid */}
      <div className="absolute inset-0 z-0 opacity-10" 
        style={{
          backgroundImage: "linear-gradient(rgba(14,165,233,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.1) 1px, transparent 1px)",
          backgroundSize: "50px 50px"
        }}
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* Central Geometric Spinner */}
        <div className="relative w-40 h-40 flex items-center justify-center">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute border-2 border-sky-500/30"
              style={{
                width: `${40 + i * 40}px`,
                height: `${40 + i * 40}px`,
                borderRadius: "12px",
              }}
              animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
              transition={{ repeat: Infinity, duration: 6 + i * 2, ease: "linear" }}
            />
          ))}
          
          {/* Core Glow */}
          <motion.div
            className="w-12 h-12 bg-sky-500 rounded-full blur-xl"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          />
        </div>

        {/* Text with futuristic tracking */}
        <motion.div
          className="mt-16 text-sky-100 font-bold text-3xl tracking-[0.6em] uppercase"
          animate={{ letterSpacing: ["0.6em", "0.7em", "0.6em"] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        >
          StressForge
        </motion.div>

        {/* Minimalist loading bar */}
        <motion.div className="mt-8 w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.8)]"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default FullScreenLoader;
