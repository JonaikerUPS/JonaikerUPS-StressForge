"use client";

import { useTheme } from "@/lib/theme-context";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    console.log("[ThemeToggle] Changing theme to:", newTheme);
    setTheme(newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 hover:scale-105 ${
        theme === "dark" 
          ? "border-white/10 bg-white/5 text-amber-400 hover:bg-white/10" 
          : "border-slate-200 bg-slate-100 text-purple-600 hover:bg-slate-200"
      }`}
      title={theme === "dark" ? "Modo Claro" : "Modo Oscuro"}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
