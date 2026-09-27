"use client";

import Link from "next/link";
import { useTheme } from "@/lib/theme-context";
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import {
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  BarChart3,
  Database,
  Gauge,
  Menu,
  Network,
  Radio,
  Server,
  ShieldCheck,
  Sun,
  Terminal,
  X,
  Zap,
  Play,
  Cpu,
  Layers,
  Sparkles,
  CheckCircle2,
  Lock,
  ChevronRight,
  Flame,
  Globe,
} from "lucide-react";

// Cargar dinámicamente el componente 3D con Three.js del lado del cliente
const StressCore3D = dynamic(() => import("@/components/StressCore3D"), {
  ssr: false,
});

const navItems = [
  { label: "Experiencia 3D", href: "#experience" },
  { label: "Motores & Stress", href: "#engines" },
  { label: "Arquitectura", href: "#architecture" },
  { label: "Capacidades", href: "#capabilities" },
  { label: "Casos de Uso", href: "#use-cases" },
];

const capabilities = [
  {
    icon: Gauge,
    index: "01",
    title: "Benchmarking de Alta Concurrencia",
    text: "Configura miles de usuarios virtuales (VUs), ramp-up y duración por endpoint con precisión quirúrgica en tiempo real.",
  },
  {
    icon: Radio,
    index: "02",
    title: "Telemetría Distribuida en Vivo",
    text: "Métricas milisegundo a milisegundo: latencia P95/P99, throughput (TPS), CPU, memoria y paquetes perdidos sin desfasaje.",
  },
  {
    icon: Network,
    index: "03",
    title: "Auditoría Multi-Protocolo",
    text: "Soporte nativo de microservicios, HTTP/REST, WebSockets, gRPC, bases de datos y seguridad perimetral.",
  },
  {
    icon: ShieldCheck,
    index: "04",
    title: "Aislamiento y Evidencia Forense",
    text: "Resultados aislados criptográficamente por sesión con exportación de reportes ejecutivos en PDF y JSON auditables.",
  },
];

export default function HomePage() {
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === "dark";
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Live HUD Simulator state
  const [isRunning, setIsRunning] = useState(true);
  const [vUs, setVUs] = useState(1480);
  const [tps, setTps] = useState(5820);
  const [latency, setLatency] = useState(9.8);
  const [cpuUsage, setCpuUsage] = useState(44);

  // Scroll tracking for cinematic 3D transformations
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Simulator live dynamic telemetry ticker
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setVUs((prev) => Math.floor(1400 + Math.sin(Date.now() / 700) * 220));
      setTps((prev) => Math.floor(5600 + Math.cos(Date.now() / 500) * 450));
      setLatency((prev) => Number((8.5 + Math.random() * 2.8).toFixed(1)));
      setCpuUsage((prev) => Math.floor(40 + Math.random() * 18));
    }, 700);
    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <main
      className={`relative min-h-screen overflow-x-hidden selection:bg-emerald-400 selection:text-slate-950 font-sans transition-colors duration-500 ${
        isDarkMode ? "bg-[#030908] text-white" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* 3D WEBGL CINEMATIC BACKGROUND SCENE (ESTILO SHAWRAMA / ABHAY TIWARI 3D SCROLL) */}
      <StressCore3D scrollProgress={scrollProgress} isDark={isDarkMode} />

      {/* Dynamic Cyber Grid & Radial Glow Overlay */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className={`absolute inset-0 ${
            isDarkMode
              ? "bg-[radial-gradient(circle_at_50%_40%,rgba(16,185,129,0.14),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(6,182,212,0.12),transparent_40%),radial-gradient(circle_at_15%_70%,rgba(232,121,249,0.08),transparent_40%)]"
              : "bg-[radial-gradient(circle_at_50%_40%,rgba(16,185,129,0.12),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(6,182,212,0.08),transparent_40%)]"
          }`}
        />
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,#34d399_1px,transparent_1px),linear-gradient(to_bottom,#34d399_1px,transparent_1px)] [background-size:64px_64px]" />
      </div>

      {/* Scroll Progress Bar at the Top */}
      <div
        style={{ transform: `scaleX(${scrollProgress})` }}
        className="fixed left-0 right-0 top-0 z-50 h-[3px] origin-left bg-gradient-to-r from-emerald-400 via-cyan-400 to-fuchsia-500 shadow-[0_0_25px_rgba(52,211,153,0.9)]"
      />

      {/* Floating Scroll Stage HUD Indicator (Cinematic Style) */}
      <div className="fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex">
        {[0, 1, 2, 3, 4].map((stageIdx) => {
          const isActive =
            scrollProgress >= stageIdx * 0.2 && scrollProgress < (stageIdx + 1) * 0.2;
          return (
            <div
              key={stageIdx}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                isActive
                  ? "w-8 bg-gradient-to-r from-emerald-400 to-cyan-400 shadow-[0_0_12px_#34d399]"
                  : "w-2.5 bg-white/20 hover:bg-white/40"
              }`}
            />
          );
        })}
      </div>

      {/* Floating Quick Action Telemetry Pill */}
      <div className="fixed bottom-6 left-6 z-40 hidden rounded-full border border-emerald-500/30 bg-slate-950/80 px-4 py-2 font-mono text-xs text-slate-300 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:flex items-center gap-3">
        <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
        <span className="text-emerald-400 font-bold">3D CORE // ACTIVE</span>
        <span className="text-slate-500">|</span>
        <span>TPS: <b className="text-cyan-300">{tps}</b></span>
        <span className="text-slate-500">|</span>
        <span>P95: <b className="text-fuchsia-300">{latency}ms</b></span>
      </div>

      {/* Navigation Header */}
      <header
        className={`relative z-40 mx-auto flex w-full max-w-[120rem] items-center justify-between px-6 py-6 lg:px-20 ${
          isDarkMode ? "text-white" : "text-slate-900"
        }`}
      >
        <Link href="/home" className="flex items-center gap-3 group">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-950 shadow-[0_0_30px_rgba(52,211,153,0.5)] transition duration-300 group-hover:scale-105">
            <Zap className="h-6 w-6" fill="currentColor" />
            <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <strong className="text-lg tracking-[0.25em] font-black uppercase">
                STRESSFORGE
              </strong>
              <span className="rounded-md bg-emerald-400/10 border border-emerald-400/30 px-1.5 py-0.5 text-[9px] font-mono font-bold text-emerald-400">
                3D SUITE
              </span>
            </div>
            <small className="block font-mono text-[10px] uppercase tracking-[0.3em] text-emerald-400/80 font-semibold">
              Enterprise Resilience Engine
            </small>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 text-sm font-medium lg:flex">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`transition-colors font-semibold ${
                isDarkMode ? "text-slate-300 hover:text-emerald-400" : "text-slate-700 hover:text-emerald-600"
              }`}
            >
              {item.label}
            </a>
          ))}
          <Link
            href="/login"
            className={`rounded-xl border px-5 py-2.5 font-semibold transition ${
              isDarkMode
                ? "border-white/20 text-white hover:border-emerald-400 hover:text-emerald-300 hover:shadow-[0_0_20px_rgba(52,211,153,0.25)]"
                : "border-slate-300 bg-white text-slate-800 hover:border-emerald-600 hover:text-emerald-600 hover:shadow-sm"
            }`}
          >
            Ingresar
          </Link>
          <Link
            href="/login?mode=register"
            className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-[length:200%_auto] px-6 py-2.5 font-bold text-slate-950 shadow-[0_0_30px_rgba(52,211,153,0.4)] transition duration-300 hover:scale-105 hover:bg-right"
          >
            Comenzar Gratis
          </Link>
          <button
            type="button"
            aria-label="Cambiar tema"
            onClick={() => setTheme(isDarkMode ? "light" : "dark")}
            className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-mono uppercase tracking-wider transition ${
              isDarkMode
                ? "border-white/20 text-emerald-300 hover:bg-white/10"
                : "border-slate-300 text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
            {isDarkMode ? "Claro" : "Oscuro"}
          </button>
        </nav>

        {/* Mobile menu button */}
        <div className="flex items-center gap-3 lg:hidden">
          <button
            type="button"
            aria-label="Cambiar tema"
            onClick={() => setTheme(isDarkMode ? "light" : "dark")}
            className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
              isDarkMode ? "border-white/20 text-emerald-300" : "border-slate-300 text-emerald-700"
            }`}
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
          </button>
          <button
            type="button"
            aria-label="Menú"
            onClick={() => setMenuOpen(!menuOpen)}
            className={`rounded-xl border p-2.5 ${
              isDarkMode ? "border-white/20 text-white" : "border-slate-300 text-slate-900"
            }`}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      {menuOpen && (
        <nav
          className={`relative z-50 mx-6 mb-6 grid gap-4 rounded-3xl border p-6 text-lg lg:hidden ${
            isDarkMode
              ? "border-white/15 bg-slate-950/95 text-slate-200 shadow-2xl backdrop-blur-2xl"
              : "border-slate-200 bg-white/95 text-slate-800 shadow-2xl backdrop-blur-2xl"
          }`}
        >
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="py-1 hover:text-emerald-400"
            >
              {item.label}
            </a>
          ))}
          <div className="flex flex-col gap-3 pt-3 border-t border-white/10">
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl border border-white/20 py-2.5 text-center font-medium"
            >
              Ingresar
            </Link>
            <Link
              href="/login?mode=register"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 py-2.5 text-center font-bold text-slate-950"
            >
              Comenzar Gratis
            </Link>
          </div>
        </nav>
      )}

      {/* ========================================================================= */}
      {/* STAGE 1: CINEMATIC HERO (3D CORE IN CENTER / RIGHT)                       */}
      {/* ========================================================================= */}
      <section
        id="experience"
        className="relative z-20 min-h-[92vh] flex flex-col justify-center px-6 lg:px-20"
      >
        <div className="mx-auto w-full max-w-[120rem] grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center py-12">
          {/* Hero Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-1.5 font-mono text-xs uppercase tracking-[0.25em] text-emerald-300 shadow-[0_0_25px_rgba(52,211,153,0.3)] mb-6 backdrop-blur-md">
              <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />
              <span>3D INTERACTIVE ENGINE // READY</span>
            </div>

            <h1 className="text-[clamp(2.6rem,5.5vw,5.6rem)] font-black leading-[1.03] tracking-tight">
              La presión revela{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
                lo que la calma oculta.
              </span>
            </h1>

            <p
              className={`mt-6 text-[clamp(1.1rem,1.5vw,1.35rem)] leading-relaxed ${
                isDarkMode ? "text-slate-300" : "text-slate-700 font-medium"
              }`}
            >
              StressForge orquesta pruebas de carga masivas en 3D interactivo. Conecta
              Taurus, K6, Locust, Artillery y JMeter para evaluar la resistencia límite de tus
              servicios bajo fuego real.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/login"
                className="group relative inline-flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500 bg-[length:200%_auto] px-8 py-4 font-bold text-slate-950 shadow-[0_0_35px_rgba(52,211,153,0.45)] transition duration-300 hover:scale-105 hover:bg-right"
              >
                <span>Abrir Consola</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#engines"
                className={`inline-flex items-center gap-3 rounded-2xl border px-8 py-4 font-semibold transition duration-300 hover:border-emerald-500 hover:text-emerald-700 ${
                  isDarkMode
                    ? "border-white/20 bg-slate-950/40 text-slate-200 backdrop-blur-md hover:bg-white/10"
                    : "border-slate-300 bg-white/90 text-slate-800 shadow-sm hover:bg-slate-50"
                }`}
              >
                <span>Explorar Scroll 3D</span>
                <ArrowDown className="h-5 w-5 animate-bounce text-emerald-600 dark:text-emerald-400" />
              </a>
            </div>

            {/* Micro Specs */}
            <div className={`mt-12 grid grid-cols-3 gap-6 border-t pt-8 font-mono text-xs ${isDarkMode ? "border-white/10" : "border-slate-200"}`}>
              <div>
                <span className={`block uppercase tracking-widest text-[10px] ${isDarkMode ? "text-slate-400" : "text-slate-600 font-bold"}`}>
                  MAX CONCURRENCIA
                </span>
                <strong className={`mt-1 block text-lg font-black ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                  100,000+ VUs
                </strong>
              </div>
              <div>
                <span className={`block uppercase tracking-widest text-[10px] ${isDarkMode ? "text-slate-400" : "text-slate-600 font-bold"}`}>
                  LATENCIA DE RECOLECCIÓN
                </span>
                <strong className={`mt-1 block text-lg font-black ${isDarkMode ? "text-cyan-300" : "text-sky-600"}`}>
                  &lt; 1.2 ms
                </strong>
              </div>
              <div>
                <span className={`block uppercase tracking-widest text-[10px] ${isDarkMode ? "text-slate-400" : "text-slate-600 font-bold"}`}>
                  MOTORES ACTIVOS
                </span>
                <strong className={`mt-1 block text-lg font-black ${isDarkMode ? "text-fuchsia-400" : "text-purple-600"}`}>
                  6 Motores
                </strong>
              </div>
            </div>
          </motion.div>

          {/* Hero Right: Holographic Telemetry HUD floating on top of 3D Scene */}
          <div className="relative flex justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.2 }}
              className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl backdrop-blur-2xl ${
                isDarkMode
                  ? "border-emerald-400/30 bg-slate-950/70 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
                  : "border-slate-200/90 bg-white/95 shadow-xl shadow-slate-200/80"
              }`}
            >
              {/* HUD Header */}
              <div className={`flex items-center justify-between border-b pb-4 ${isDarkMode ? "border-white/10" : "border-slate-200"}`}>
                <div className="flex items-center gap-2.5">
                  <span
                    className={`h-3 w-3 rounded-full ${
                      isRunning ? (isDarkMode ? "bg-emerald-400 animate-ping" : "bg-emerald-500 animate-ping") : "bg-amber-400"
                    }`}
                  />
                  <span className={`font-mono text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-emerald-300" : "text-emerald-700"}`}>
                    {isRunning ? "REACTOR LIVE // HIGH PRESSURE" : "STANDBY"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRunning(!isRunning)}
                  className={`rounded-xl border p-2 transition ${
                    isDarkMode
                      ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                      : "border-emerald-600/30 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                  title="Pausar / Iniciar simulación"
                >
                  <Play className={`h-4 w-4 ${isRunning ? "animate-pulse" : ""}`} fill="currentColor" />
                </button>
              </div>

              {/* HUD Live Counters */}
              <div className="grid grid-cols-2 gap-4 my-6">
                <div className={`rounded-2xl border p-4 ${isDarkMode ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-slate-50/80"}`}>
                  <span className={`font-mono text-[10px] uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-600 font-bold"}`}>
                    Virtual Users (VUs)
                  </span>
                  <div className={`mt-1 text-2xl font-black font-mono ${isDarkMode ? "text-cyan-300" : "text-sky-600"}`}>{vUs}</div>
                  <div className={`mt-2 h-1.5 w-full rounded-full overflow-hidden ${isDarkMode ? "bg-white/10" : "bg-slate-200"}`}>
                    <div
                      className="h-full bg-cyan-500 transition-all duration-300"
                      style={{ width: `${(vUs / 2000) * 100}%` }}
                    />
                  </div>
                </div>

                <div className={`rounded-2xl border p-4 ${isDarkMode ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-slate-50/80"}`}>
                  <span className={`font-mono text-[10px] uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-600 font-bold"}`}>
                    Throughput (TPS)
                  </span>
                  <div className={`mt-1 text-2xl font-black font-mono ${isDarkMode ? "text-emerald-300" : "text-emerald-600"}`}>
                    {tps} <span className="text-xs font-normal text-slate-500">req/s</span>
                  </div>
                  <div className={`mt-2 h-1.5 w-full rounded-full overflow-hidden ${isDarkMode ? "bg-white/10" : "bg-slate-200"}`}>
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${(tps / 7000) * 100}%` }}
                    />
                  </div>
                </div>

                <div className={`rounded-2xl border p-4 ${isDarkMode ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-slate-50/80"}`}>
                  <span className={`font-mono text-[10px] uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-600 font-bold"}`}>
                    Latencia P95
                  </span>
                  <div className={`mt-1 text-2xl font-black font-mono ${isDarkMode ? "text-fuchsia-300" : "text-purple-600"}`}>
                    {latency} <span className="text-xs font-normal text-slate-500">ms</span>
                  </div>
                  <span className={`mt-1 block text-[10px] ${isDarkMode ? "text-emerald-400" : "text-emerald-700 font-semibold"}`}>P99: 14.2ms nominal</span>
                </div>

                <div className={`rounded-2xl border p-4 ${isDarkMode ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-slate-50/80"}`}>
                  <span className={`font-mono text-[10px] uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-600 font-bold"}`}>
                    CPU Load Engine
                  </span>
                  <div className={`mt-1 text-2xl font-black font-mono ${isDarkMode ? "text-amber-300" : "text-amber-600"}`}>
                    {cpuUsage}%
                  </div>
                  <span className={`mt-1 block text-[10px] ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>Multi-core cluster</span>
                </div>
              </div>

              {/* Terminal Snippet */}
              <div className={`rounded-xl border p-3 font-mono text-[11px] ${isDarkMode ? "border-white/10 bg-black/60 text-slate-400" : "border-slate-200 bg-slate-900 text-slate-300 shadow-sm"}`}>
                <span className="text-emerald-400 font-bold">$</span> stressforge run --suite benchmark.yml
                <div className="text-slate-400 mt-1">&gt; 3D gyroscopic core synchronized with telemetry stream.</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* STAGE 2: MULTI-ENGINE RESILIENCE (SCROLL TILT & TRANSLATE 3D)              */}
      {/* ========================================================================= */}
      <section
        id="engines"
        className={`relative z-20 min-h-screen flex items-center border-t px-6 py-28 lg:px-20 ${
          isDarkMode ? "border-white/10" : "border-slate-200 bg-white/70"
        }`}
      >
        <div className="mx-auto w-full max-w-[120rem] grid gap-16 lg:grid-cols-2 items-center">
          {/* Interactive Console Card on Left */}
          <div
            className={`rounded-3xl border p-8 shadow-2xl backdrop-blur-2xl ${
              isDarkMode
                ? "border-emerald-400/30 bg-[#020b09]/80 shadow-[0_0_80px_rgba(16,185,129,0.2)]"
                : "border-slate-300 bg-slate-950 text-slate-100 shadow-xl"
            }`}
          >
            <div className={`flex items-center justify-between border-b pb-4 mb-6 font-mono text-xs ${isDarkMode ? "border-white/10" : "border-slate-800"}`}>
              <span className="text-emerald-400 font-bold">TERMINAL // ENGINE_ORCHESTRATOR</span>
              <span className="flex items-center gap-1.5 text-cyan-300">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                6 ENGINES LOADED
              </span>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                <span className="text-emerald-400 font-bold">[01] TAURUS & K6 HYBRID</span>
                <p className="text-slate-300 mt-1">Generación masiva de tráfico HTTP/2 y microservicios con curvas de saturación en rampa exponencial.</p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                <span className="text-cyan-300 font-bold">[02] LOCUST & ARTILLERY</span>
                <p className="text-slate-300 mt-1">Simulación basada en código Python y TypeScript para emular flujos complejos de usuarios y autenticación OAuth2.</p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                <span className="text-fuchsia-400 font-bold">[03] JMETER & AUTOCANNON</span>
                <p className="text-slate-300 mt-1">Benchmarking ultra veloz de pipelines de bases de datos, WebSockets bidireccionales y endpoints GraphQL.</p>
              </div>
            </div>

            <div className={`mt-6 flex items-center justify-between pt-4 border-t text-xs font-mono ${isDarkMode ? "border-white/10" : "border-slate-800"}`}>
              <span className="text-slate-400">ESTADO DEL CLUSTER:</span>
              <span className="text-emerald-400 font-bold">100% OPERATIVO // LATENCIA CERO</span>
            </div>
          </div>

          {/* Engine Highlights on Right */}
          <div>
            <div className={`inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] mb-3 ${isDarkMode ? "text-emerald-400" : "text-emerald-700 font-bold"}`}>
              <Cpu className="h-4 w-4" /> ETAPA 2 // ORQUESTACIÓN CINEMÁTICA
            </div>
            <h2 className={`text-[clamp(2.2rem,4vw,4.2rem)] font-black tracking-tight leading-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              Control simultáneo sobre cada hilo, paquete y microservicio.
            </h2>
            <p
              className={`mt-6 text-[clamp(1.05rem,1.3vw,1.3rem)] leading-relaxed ${
                isDarkMode ? "text-slate-300" : "text-slate-700 font-medium"
              }`}
            >
              A medida que navegas en la página, el núcleo 3D transmuta su ángulo y posición en
              tiempo real para enfocar la telemetría del test. No requieres herramientas dispersas:
              StressForge consolida todo el ciclo forense de rendimiento en una suite visual de última
              generación.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 font-mono text-sm">
              {[
                "Detección predictiva de cuellos de botella",
                "Exportación directa de reportes PDF auditables",
                "Métricas instantáneas P90, P95 y P99",
                "Cluster distribuido con zero packet loss",
              ].map((feat) => (
                <div
                  key={feat}
                  className={`flex items-center gap-3 rounded-2xl border p-4 backdrop-blur-md font-semibold ${
                    isDarkMode
                      ? "border-white/10 bg-white/[0.03] text-slate-200"
                      : "border-slate-200 bg-white shadow-sm text-slate-800"
                  }`}
                >
                  <CheckCircle2 className={`h-5 w-5 flex-shrink-0 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`} />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* STAGE 3: MODULAR ARCHITECTURE (3D ROTATION & EXPANSION)                   */}
      {/* ========================================================================= */}
      <section
        id="architecture"
        className={`relative z-20 min-h-screen flex items-center border-t px-6 py-28 lg:px-20 ${
          isDarkMode ? "border-white/10" : "border-slate-200 bg-slate-100/50"
        }`}
      >
        <div className="mx-auto w-full max-w-[120rem]">
          <div className="mb-16 max-w-3xl">
            <p className={`font-mono text-xs uppercase tracking-[0.3em] ${isDarkMode ? "text-emerald-400" : "text-emerald-700 font-bold"}`}>
              / ARQUITECTURA MODULAR
            </p>
            <h2 className={`mt-4 text-[clamp(2.2rem,4vw,4.2rem)] font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              Diseñado para absorber el estrés sin fisuras.
            </h2>
            <p
              className={`mt-4 text-[clamp(1.1rem,1.4vw,1.35rem)] ${
                isDarkMode ? "text-slate-300" : "text-slate-700 font-medium"
              }`}
            >
              Cada submódulo opera en canales de memoria aislados conectados por un bus de eventos de
              baja latencia, asegurando que la telemetría nunca contamine tus resultados reales.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Layers,
                title: "Capa de Orquestación",
                desc: "Despliega contenedores efímeros bajo demanda y equilibra la inyección de tráfico entre nodos independientes.",
                color: "emerald",
              },
              {
                icon: Cpu,
                title: "Motor Analítico en Vivo",
                desc: "Procesa millones de muestras por segundo y calcula estadísticas percentiles sin saturar el frontend.",
                color: "cyan",
              },
              {
                icon: ShieldCheck,
                title: "Blindaje Criptográfico",
                desc: "Protección rigurosa de tokens de autenticación, llaves de API y aislamiento estricto por usuario.",
                color: "fuchsia",
              },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className={`group relative rounded-3xl border p-8 shadow-xl backdrop-blur-xl transition duration-500 hover:-translate-y-2 ${
                  isDarkMode
                    ? "border-white/10 bg-slate-950/60 hover:border-emerald-400/60"
                    : "border-slate-200 bg-white hover:border-emerald-500 hover:shadow-2xl text-slate-800"
                }`}
              >
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${
                    color === "emerald"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                      : color === "cyan"
                      ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-500"
                      : "border-purple-500/30 bg-purple-500/10 text-purple-500"
                  } group-hover:scale-110 transition duration-300`}
                >
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className={`mt-6 text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>{title}</h3>
                <p className={`mt-4 leading-relaxed text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>{desc}</p>
                <div className={`mt-8 flex items-center gap-2 font-mono text-xs font-semibold group-hover:translate-x-2 transition duration-300 ${isDarkMode ? "text-emerald-400" : "text-emerald-700"}`}>
                  <span>ANALIZAR ESPECIFICACIÓN</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* STAGE 4: CAPACIDADES TÉCNICAS (ESTUDIO DE CAPACIDADES)                    */}
      {/* ========================================================================= */}
      <section
        id="capabilities"
        className={`relative z-20 min-h-screen flex items-center border-t px-6 py-28 lg:px-20 ${
          isDarkMode ? "border-white/10" : "border-slate-200 bg-white/70"
        }`}
      >
        <div className="mx-auto w-full max-w-[120rem]">
          <div className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <p className={`font-mono text-xs uppercase tracking-[0.3em] ${isDarkMode ? "text-emerald-400" : "text-emerald-700 font-bold"}`}>
                / CAPACIDADES INDUSTRIALES
              </p>
              <h2 className={`mt-4 text-[clamp(2.2rem,4vw,4.2rem)] font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                Potencia pura para entornos de misión crítica.
              </h2>
            </div>
            <Database className={`h-16 w-16 hidden md:block ${isDarkMode ? "text-emerald-400/30" : "text-emerald-600/30"}`} />
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {capabilities.map(({ icon: Icon, index, title, text }) => (
              <article
                key={index}
                className={`group flex flex-col justify-between rounded-3xl border p-8 shadow-xl backdrop-blur-xl transition duration-500 hover:-translate-y-2 ${
                  isDarkMode
                    ? "border-white/10 bg-slate-950/60 hover:border-emerald-400/60 hover:bg-emerald-400/[0.04]"
                    : "border-slate-200 bg-white hover:border-emerald-500 hover:shadow-2xl"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className={`font-mono text-2xl font-black ${isDarkMode ? "text-slate-600" : "text-slate-400"}`}>{index}</span>
                  </div>
                  <h3 className={`mt-8 text-xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>{title}</h3>
                  <p className={`mt-4 text-sm leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>{text}</p>
                </div>
                <div className={`mt-8 h-1.5 w-full rounded-full overflow-hidden ${isDarkMode ? "bg-white/10" : "bg-slate-100"}`}>
                  <div className="h-full w-1/4 bg-gradient-to-r from-emerald-500 to-cyan-500 group-hover:w-full transition-all duration-700" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* STAGE 5: CASOS DE USO REALES (RESISTENCIA COMPROBADA)                     */}
      {/* ========================================================================= */}
      <section
        id="use-cases"
        className={`relative z-20 min-h-screen flex items-center border-t px-6 py-28 lg:px-20 ${
          isDarkMode ? "border-white/10" : "border-slate-200 bg-slate-100/50"
        }`}
      >
        <div className="mx-auto w-full max-w-[120rem]">
          <div className="mb-16 text-center max-w-3xl mx-auto">
            <p className={`font-mono text-xs uppercase tracking-[0.3em] mb-3 ${isDarkMode ? "text-emerald-400" : "text-emerald-700 font-bold"}`}>
              / CASOS DE USO EN PRODUCCIÓN
            </p>
            <h2 className={`text-[clamp(2.2rem,4vw,4.2rem)] font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              Blindaje para sistemas que no pueden permitirse fallar.
            </h2>
            <p className={`mt-4 text-lg ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
              Pruebas masivas ejecutadas con éxito antes de cada lanzamiento global.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                tag: "FINTECH & TRANSACCIONES",
                title: "Picos de Pagos Instantáneos",
                desc: "Emulación de miles de transacciones concurrentes por segundo para auditar consistencia ACID y latencias inferiores a 15ms.",
                metrics: "99.999% SLA Uptime",
                icon: Globe,
              },
              {
                tag: "E-COMMERCE & BLACK FRIDAY",
                title: "Tráfico Masivo de Catálogos",
                desc: "Simula avalanchas impredecibles sobre carritos de compras y pasarelas con ramp-up agresivo y detección de cuellos de botella en Redis.",
                metrics: "0% transacciones caídas",
                icon: Flame,
              },
              {
                tag: "DEVOPS & DEVSECOPS",
                title: "Auditoría Continua en CI/CD",
                desc: "Automatiza pruebas de estrés junto a escaneos Nmap y SQLMap para bloquear regresiones de rendimiento antes de desplegar en Kubernetes.",
                metrics: "Pipeline integrado",
                icon: Lock,
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`rounded-3xl border p-8 shadow-xl backdrop-blur-xl flex flex-col justify-between transition duration-300 ${
                  isDarkMode
                    ? "border-white/10 bg-slate-950/70 hover:border-emerald-400/60"
                    : "border-slate-200 bg-white hover:border-emerald-500 hover:shadow-2xl"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-block px-3 py-1 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider ${
                      isDarkMode
                        ? "bg-emerald-500/10 border border-emerald-400/30 text-emerald-300"
                        : "bg-emerald-50 border border-emerald-600/30 text-emerald-700"
                    }`}>
                      {item.tag}
                    </span>
                    <item.icon className={`h-5 w-5 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`} />
                  </div>
                  <h3 className={`text-2xl font-bold tracking-tight mb-3 ${isDarkMode ? "text-white" : "text-slate-900"}`}>{item.title}</h3>
                  <p className={`leading-relaxed text-sm mb-6 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>{item.desc}</p>
                </div>
                <div className={`pt-4 border-t font-mono text-xs font-bold flex items-center justify-between ${isDarkMode ? "border-white/10 text-cyan-300" : "border-slate-200 text-sky-700"}`}>
                  <span>MÉTRICA VERIFICADA:</span>
                  <span className={isDarkMode ? "text-emerald-400" : "text-emerald-600"}>{item.metrics}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FINAL MONUMENTAL CTA: 3D CORE ZOOMED AT BOTTOM                            */}
      {/* ========================================================================= */}
      <section className={`relative z-20 border-t px-6 py-36 text-center ${isDarkMode ? "border-white/10" : "border-slate-200 bg-white/80"}`}>
        <div className="mx-auto max-w-4xl">
          <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-xs uppercase tracking-[0.25em] mb-6 backdrop-blur-md ${
            isDarkMode ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300" : "border-emerald-600/30 bg-emerald-50 text-emerald-700"
          }`}>
            <Zap className="h-3.5 w-3.5" />
            <span>ACCESO INMEDIATO // RESILIENCIA TOTAL</span>
          </div>

          <h2 className={`text-[clamp(2.5rem,5.5vw,5.5rem)] font-black tracking-tight leading-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            Eleva la resiliencia de tu infraestructura hoy mismo.
          </h2>

          <p className={`mt-6 text-xl max-w-2xl mx-auto leading-relaxed ${isDarkMode ? "text-slate-300" : "text-slate-700 font-medium"}`}>
            Inicia tu primera prueba de estrés concurrente en menos de 2 minutos. Telemetría
            cinemática, aislamiento por usuario y exportación ejecutiva forense.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-5">
            <Link
              href="/login?mode=register"
              className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500 bg-[length:200%_auto] px-10 py-5 font-bold text-slate-950 shadow-[0_0_50px_rgba(52,211,153,0.5)] transition duration-300 hover:scale-105 text-lg"
            >
              <span>Crear Cuenta Gratis</span>
              <ArrowRight className="h-6 w-6" />
            </Link>
            <Link
              href="/login"
              className={`inline-flex items-center gap-3 rounded-2xl border px-8 py-5 font-bold backdrop-blur-md transition ${
                isDarkMode
                  ? "border-white/20 bg-slate-950/60 text-white hover:border-emerald-400 hover:text-emerald-300"
                  : "border-slate-300 bg-white text-slate-800 hover:border-emerald-600 hover:text-emerald-700 shadow-sm"
              }`}
            >
              <span>Iniciar Sesión</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`relative z-20 mx-auto flex w-full max-w-[120rem] flex-col justify-between gap-8 px-6 py-14 border-t sm:flex-row sm:items-center lg:px-20 backdrop-blur-md ${
        isDarkMode ? "border-white/10 text-slate-500 bg-black/40" : "border-slate-200 text-slate-600 bg-white/90"
      }`}>
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20">
            <Zap className="h-6 w-6" fill="currentColor" />
          </div>
          <div>
            <span className={`font-mono text-sm tracking-[0.25em] font-black block ${isDarkMode ? "text-slate-200" : "text-slate-900"}`}>
              STRESSFORGE // SECSUITE
            </span>
            <small className={`font-mono text-[10px] ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
              High Performance 3D Stress Engineering
            </small>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-8 text-sm font-semibold">
          <Link href="/login" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
            Ingresar
          </Link>
          <Link href="/login?mode=register" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
            Registrarse
          </Link>
          <a href="#experience" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
            Experiencia 3D
          </a>
          <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            SYSTEM_STATUS: 100% OPERATIONAL
          </span>
        </div>
      </footer>
    </main>
  );
}
