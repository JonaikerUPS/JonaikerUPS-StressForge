"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/lib/theme-context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getBackendUrl } from "@/lib/api-url";
import { useLoading } from "@/lib/loading-context";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import {
  Zap,
  User,
  ArrowRight,
  Activity,
  Sun,
  Moon,
  Database,
  Shield,
  AlertTriangle,
  X,
  CheckCircle2,
  Mail,
  Lock,
  ChevronLeft,
  Terminal,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

const LoginSphere3D = dynamic(() => import("@/components/LoginSphere3D"), {
  ssr: false,
});

const CAPABILITIES_INFO: Record<
  string,
  {
    title: string;
    description: string;
    details: string[];
    icon: LucideIcon;
    color: "emerald" | "cyan" | "purple" | "rose";
    badge: string;
  }
> = {
  "Simulaciones de Carga": {
    title: "MOTOR DE SIMULACIÓN Y ESTRÉS K6/ARTILLERY",
    description:
      "Orquestación de pruebas de rendimiento a gran escala. Simula miles de usuarios concurrentes inundando los endpoints con peticiones HTTP/WS para medir latencia, tasa de éxito y límites de colapso de la infraestructura.",
    details: [
      "Simulación de picos masivos (Spike Testing) y carga sostenida.",
      "Integración de motores distribuidos: k6, Artillery y Autocannon.",
      "Análisis de percentiles de latencia en tiempo real (p95, p99).",
      "Medición dinámica de rendimiento en peticiones por segundo (RPS).",
    ],
    icon: Zap,
    color: "emerald",
    badge: "STRESS_ENGINE",
  },
  "Monitoreo de Telemetría": {
    title: "PERFILADOR DE RECURSOS DEL SISTEMA",
    description:
      "Captura en tiempo real del estado de hardware del servidor backend durante las ráfagas de tráfico. Permite correlacionar el volumen de peticiones concurrentes con la degradación del procesador y memoria del host.",
    details: [
      "Lectura dinámica de núcleos de CPU y consumo de memoria RAM.",
      "Detección de fugas de memoria (Memory Leaks) en hilos de ejecución.",
      "Correlación de telemetría de red con tiempos de respuesta.",
      "Mapeo de cuellos de botella mediante APIs de telemetría interna.",
    ],
    icon: Database,
    color: "cyan",
    badge: "METRICS_PROFILER",
  },
  "Pruebas de Red y Conectividad": {
    title: "AUDITORÍA DE PROTOCOLOS BAJA LATENCIA",
    description:
      "Evaluación del comportamiento de sockets TCP y canales multiplexados gRPC/WebSockets ante transmisiones de alta frecuencia. Analiza la resiliencia en la persistencia de conexiones bidireccionales.",
    details: [
      "Pruebas de saturación en túneles WebSocket de flujo continuo.",
      "Medición de latencia de red mediante conexiones concurrentes gRPC.",
      "Detección de pérdidas de paquetes y desconexiones imprevistas.",
      "Simulación de congestión de red (Network Jitter) y latencia artificial.",
    ],
    icon: Activity,
    color: "purple",
    badge: "NETWORK_STRESS",
  },
  "Auditoría de Seguridad y Resiliencia": {
    title: "MOTOR DE FUZZING Y RESILIENCIA DE DATOS",
    description:
      "Módulo de análisis de vulnerabilidades lógicas y persistencia bajo estrés. Evalúa la respuesta de los gestores de base de datos y memoria caché ante payloads de inyección SQL y desbordamientos.",
    details: [
      "Fuzzing de parámetros de entrada con cargas maliciosas bajo carga.",
      "Pruebas de resiliencia en bases de datos PostgreSQL y Redis caché.",
      "Validación de políticas de Rate Limiting y bypass de WAF.",
      "Auditoría de integridad del almacenamiento ante transacciones fallidas.",
    ],
    icon: Shield,
    color: "rose",
    badge: "SECURITY_COMPLIANCE",
  },
};

const COLOR_SCHEMES = {
  emerald: {
    border: "border-emerald-500/30",
    glow: "bg-emerald-500/10",
    glowBorder: "shadow-[0_0_30px_rgba(16,185,129,0.25)]",
    textAccent: "text-emerald-400",
    textLight: "text-emerald-700 dark:text-emerald-400",
    badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    accentBg: "bg-emerald-500",
    hoverBg: "hover:bg-emerald-400",
    bullet: "bg-emerald-500 dark:bg-emerald-400",
    buttonAccent:
      "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 hover:shadow-emerald-400/30",
    corners: "border-emerald-500/80",
  },
  cyan: {
    border: "border-cyan-500/30",
    glow: "bg-cyan-500/10",
    glowBorder: "shadow-[0_0_30px_rgba(6,182,212,0.25)]",
    textAccent: "text-cyan-400",
    textLight: "text-cyan-700 dark:text-cyan-400",
    badgeBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    accentBg: "bg-cyan-500",
    hoverBg: "hover:bg-cyan-400",
    bullet: "bg-cyan-500 dark:bg-cyan-400",
    buttonAccent:
      "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20 hover:shadow-cyan-400/30",
    corners: "border-cyan-500/80",
  },
  purple: {
    border: "border-purple-500/30",
    glow: "bg-purple-500/10",
    glowBorder: "shadow-[0_0_30px_rgba(168,85,247,0.25)]",
    textAccent: "text-purple-400",
    textLight: "text-purple-700 dark:text-purple-400",
    badgeBg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    accentBg: "bg-purple-500",
    hoverBg: "hover:bg-purple-400",
    bullet: "bg-purple-500 dark:bg-purple-400",
    buttonAccent:
      "bg-purple-500 hover:bg-purple-400 text-slate-950 shadow-purple-500/20 hover:shadow-purple-400/30",
    corners: "border-purple-500/80",
  },
  rose: {
    border: "border-rose-500/30",
    glow: "bg-rose-500/10",
    glowBorder: "shadow-[0_0_30px_rgba(244,63,94,0.3)]",
    textAccent: "text-rose-400",
    textLight: "text-rose-700 dark:text-rose-400",
    badgeBg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    accentBg: "bg-rose-500",
    hoverBg: "hover:bg-rose-400",
    bullet: "bg-rose-500 dark:bg-rose-400",
    buttonAccent:
      "bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-rose-500/20 hover:shadow-rose-400/30",
    corners: "border-rose-500/80",
  },
};

function LoginForm() {
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === "dark";
  const [username, setUsername] = useState("");
  const [isRegister, setIsRegister] = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("mode") === "register";
    }
    return false;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loginInput, setLoginInput] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedCapability, setSelectedCapability] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${getBackendUrl()}/api/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: tokenResponse.access_token }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Error al autenticar con Google.");
        }
        const data = await res.json();
        login({ username: data.username, userId: data.userId, token: data.token });
        startLoading();
        router.push("/dashboard");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Fallo de conexión con Google.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => setError("Error al iniciar sesión con Google."),
    flow: "implicit",
  });

  const handleGoogleAuth = () => googleLogin();

  const router = useRouter();
  const { login } = useAuth();
  const { startLoading } = useLoading();

  // Dynamic backend health status monitoring
  const [isBackendUp, setIsBackendUp] = useState<boolean | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const backendUrl = getBackendUrl();
        const res = await fetch(`${backendUrl}/api/system/resources`);
        setIsBackendUp(res.ok);
      } catch {
        setIsBackendUp(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (isRegister) {
      if (!username.trim()) newErrors.username = "El nombre de usuario es obligatorio";
      if (!email.trim()) newErrors.email = "El correo es obligatorio";
      else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Correo inválido";
      if (!password) newErrors.password = "La contraseña es obligatoria";
      if (password !== confirmPassword) newErrors.confirmPassword = "Las contraseñas no coinciden";
    } else {
      if (!loginInput.trim()) newErrors.loginInput = "El usuario o correo es obligatorio";
      if (!password) newErrors.password = "La contraseña es obligatoria";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setError(null);
    setErrors({});

    try {
      const endpoint = `/api/auth/${isRegister ? "register" : "login"}`;
      const body = isRegister
        ? { username: username.trim(), email: email.trim(), password }
        : { identifier: loginInput.trim(), password };

      const res = await fetch(`${getBackendUrl()}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Error al ${isRegister ? "registrarse" : "iniciar sesión"}.`);
      }

      const data = await res.json();

      if (isRegister) {
        setError("¡Cuenta creada con éxito! Ahora inicia sesión con tus credenciales.");
        setIsRegister(false);
        setLoginInput(data.username || username.trim());
        setPassword("");
        setConfirmPassword("");
        setEmail("");
        setUsername("");
      } else {
        login({ username: data.username, userId: data.userId, token: data.token });
        startLoading();
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Fallo de conexión con el motor de autenticación.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const activeCap = selectedCapability ? CAPABILITIES_INFO[selectedCapability] : null;
  const colorScheme = activeCap ? COLOR_SCHEMES[activeCap.color] : COLOR_SCHEMES.emerald;

  return (
    <div
      className={`relative min-h-screen overflow-x-hidden transition-colors duration-500 selection:bg-emerald-400 selection:text-slate-950 font-sans ${
        isDarkMode ? "bg-[#030908] text-white" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* 3D WebGL Three.js Cinematic Reactor Background */}
      <LoginSphere3D isDark={isDarkMode} />

      {/* Cyber Grid & Ambient Radial Glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className={`absolute inset-0 ${
            isDarkMode
              ? "bg-[radial-gradient(circle_at_20%_30%,rgba(16,185,129,0.15),transparent_45%),radial-gradient(circle_at_75%_50%,rgba(6,182,212,0.15),transparent_45%)]"
              : "bg-[radial-gradient(circle_at_20%_30%,rgba(16,185,129,0.10),transparent_45%),radial-gradient(circle_at_75%_50%,rgba(6,182,212,0.10),transparent_45%)]"
          }`}
        />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,#34d399_1px,transparent_1px),linear-gradient(to_bottom,#34d399_1px,transparent_1px)] [background-size:56px_56px]" />
      </div>

      {/* ========================================================================= */}
      {/* HEADER PRINCIPAL CON BOTÓN A LA PÁGINA PRINCIPAL (/home)                 */}
      {/* ========================================================================= */}
      <header
        className={`sticky top-0 z-40 flex h-20 w-full items-center justify-between border-b px-6 lg:px-20 backdrop-blur-2xl transition-colors duration-300 ${
          isDarkMode
            ? "border-white/10 bg-slate-950/60 text-white"
            : "border-slate-200/80 bg-white/70 text-slate-900"
        }`}
      >
        {/* Logo & Volver al Home */}
        <div className="flex items-center gap-4">
          <Link
            href="/home"
            className="group flex items-center gap-3 transition-transform hover:scale-105"
            title="Ir a la página principal"
          >
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-950 shadow-[0_0_25px_rgba(52,211,153,0.5)]">
              <Zap className="h-6 w-6" fill="currentColor" />
            </div>
            <div>
              <strong className="block text-base tracking-[0.25em] font-black uppercase">
                STRESSFORGE
              </strong>
              <small className="block font-mono text-[9px] uppercase tracking-[0.25em] text-emerald-400 font-bold">
                Enterprise 3D Suite
              </small>
            </div>
          </Link>

          <span className="hidden h-6 w-px bg-white/15 md:block" />

          {/* Botón directo a la página principal */}
          <Link
            href="/home"
            className={`hidden md:inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5 font-mono text-xs font-semibold transition-all duration-200 hover:border-emerald-400 hover:text-emerald-300 ${
              isDarkMode
                ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Página Principal</span>
          </Link>
        </div>

        {/* Acciones derecha: Estado Backend + Toggle Tema */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 font-mono text-[11px] backdrop-blur-md">
            <span
              className={`h-2 w-2 rounded-full ${
                isBackendUp === true
                  ? "bg-emerald-400 animate-pulse"
                  : isBackendUp === false
                  ? "bg-rose-500"
                  : "bg-amber-400 animate-ping"
              }`}
            />
            <span className={isDarkMode ? "text-slate-300" : "text-slate-600"}>
              {isBackendUp === true
                ? "SYS_ONLINE // CLUSTER OK"
                : isBackendUp === false
                ? "SYS_OFFLINE (OFFLINE)"
                : "CONNECTING..."}
            </span>
          </div>

          <button
            onClick={() => setTheme(isDarkMode ? "light" : "dark")}
            className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 hover:scale-105 ${
              isDarkMode
                ? "border-white/15 bg-white/5 text-amber-400 hover:bg-white/10"
                : "border-slate-200 bg-white text-emerald-700 hover:bg-slate-100 shadow-sm"
            }`}
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Enlace móvil a Home */}
          <Link
            href="/home"
            className="md:hidden flex h-10 items-center gap-1.5 rounded-xl border border-white/15 px-3 font-mono text-xs text-emerald-400 hover:bg-white/5"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Home</span>
          </Link>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* CUERPO PRINCIPAL DIVIDIDO: FORMULARIO GLASS 3D + TELEMETRÍA CINEMÁTICA    */}
      {/* ========================================================================= */}
      <main className="relative z-20 mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[120rem] items-center px-6 py-12 lg:px-20">
        <div className="grid w-full gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
          {/* Columna Izquierda: Tarjeta de Acceso Futurista */}
          <div className="w-full max-w-xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-1 font-mono text-[11px] uppercase tracking-wider text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                SECURITY GATE // AUTH_v2.5
              </div>
              <span className="font-mono text-xs text-slate-500">AES-256 GCM</span>
            </div>

            {/* Glassmorphic Form Card */}
            <div
              className={`relative overflow-hidden rounded-3xl border p-8 sm:p-10 shadow-2xl backdrop-blur-2xl transition-all duration-300 ${
                isDarkMode
                  ? "border-emerald-500/20 bg-slate-950/75 shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
                  : "border-slate-200/90 bg-white/90 shadow-2xl shadow-slate-200"
              }`}
            >
              {/* Accent top gradient bar */}
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-emerald-400 via-cyan-400 to-fuchsia-500 shadow-[0_0_20px_rgba(52,211,153,0.8)]" />

              {/* Title & Mode */}
              <div className="mb-6">
                <h1 className="text-3xl font-black tracking-tight font-sans">
                  {isRegister ? "Registrar Operador" : "Iniciar Sesión"}
                </h1>
                <p
                  className={`mt-1.5 text-xs font-mono ${
                    isDarkMode ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  {isRegister
                    ? "Crea tu cuenta de pruebas y despliega auditorías concurrentes."
                    : "Ingresa a tu consola de ingeniería de estrés y métricas 3D."}
                </p>
              </div>

              {/* Selector Tabs Login / Register */}
              <div
                className={`mb-6 flex rounded-2xl p-1 border font-mono text-xs ${
                  isDarkMode ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-slate-100"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setErrors({});
                    setError(null);
                  }}
                  className={`flex-1 rounded-xl py-2.5 transition-all duration-300 font-bold uppercase tracking-wider ${
                    !isRegister
                      ? "bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 shadow-md shadow-emerald-500/20"
                      : isDarkMode
                      ? "text-slate-400 hover:text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  LOGIN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(true);
                    setErrors({});
                    setError(null);
                  }}
                  className={`flex-1 rounded-xl py-2.5 transition-all duration-300 font-bold uppercase tracking-wider ${
                    isRegister
                      ? "bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 shadow-md shadow-emerald-500/20"
                      : isDarkMode
                      ? "text-slate-400 hover:text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  REGISTRO
                </button>
              </div>

              {/* Error / Success Feedback Banner */}
              {error && (
                <div
                  className={`mb-6 flex items-center gap-3 rounded-2xl border p-4 text-xs font-mono ${
                    error.includes("éxito") || error.includes("creada")
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                      : "border-rose-500/40 bg-rose-500/10 text-rose-400"
                  }`}
                >
                  {error.includes("éxito") || error.includes("creada") ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
                  )}
                  <span>{error}</span>
                </div>
              )}

              {/* Botón de Google OAuth */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className={`mb-5 flex w-full items-center justify-center gap-3 rounded-2xl border py-3.5 text-xs font-mono font-bold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${
                  isDarkMode
                    ? "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:border-emerald-400/40"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm"
                }`}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>
                  {isRegister ? "Registrarse con Google" : "Continuar con Google"}
                </span>
              </button>

              {/* Separador */}
              <div className="relative mb-5 flex items-center justify-center">
                <div className={`h-px w-full ${isDarkMode ? "bg-white/10" : "bg-slate-200"}`} />
                <span
                  className={`absolute px-3 font-mono text-[10px] uppercase tracking-wider ${
                    isDarkMode ? "bg-[#030908] text-slate-500" : "bg-white text-slate-400"
                  }`}
                >
                  O MEDIANTE CREDENCIALES
                </span>
              </div>

              {/* Formulario de Entrada */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isRegister ? (
                  /* LOGIN */
                  <div className="space-y-1.5">
                    <label
                      htmlFor="loginInput"
                      className={`block text-xs font-mono font-semibold uppercase tracking-wider ${
                        isDarkMode ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      Usuario o Correo
                    </label>
                    <div
                      className={`relative flex items-center rounded-2xl border transition-all duration-200 ${
                        isFocused
                          ? isDarkMode
                            ? "border-emerald-400 bg-emerald-500/10 ring-1 ring-emerald-400/40"
                            : "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600/30"
                          : isDarkMode
                          ? "border-white/10 bg-white/[0.03]"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <div className="pointer-events-none flex h-full items-center pl-4">
                        <User
                          className={`h-4 w-4 ${
                            isFocused ? "text-emerald-400" : "text-slate-400"
                          }`}
                        />
                      </div>
                      <input
                        id="loginInput"
                        type="text"
                        value={loginInput}
                        onChange={(e) => setLoginInput(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder="operador@stressforge.io"
                        className={`w-full bg-transparent py-3.5 pl-3 pr-4 text-sm font-mono outline-none ${
                          isDarkMode
                            ? "text-white placeholder-slate-600"
                            : "text-slate-900 placeholder-slate-400"
                        }`}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.loginInput && (
                      <p className="text-[11px] font-mono text-rose-500 mt-1">
                        {errors.loginInput}
                      </p>
                    )}
                  </div>
                ) : (
                  /* REGISTRO */
                  <>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="username"
                        className={`block text-xs font-mono font-semibold uppercase tracking-wider ${
                          isDarkMode ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        Nombre de Usuario
                      </label>
                      <div
                        className={`relative flex items-center rounded-2xl border transition-all duration-200 ${
                          isDarkMode ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <div className="pointer-events-none flex h-full items-center pl-4">
                          <User className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          id="username"
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Ej: stress_master"
                          className={`w-full bg-transparent py-3.5 pl-3 pr-4 text-sm font-mono outline-none ${
                            isDarkMode
                              ? "text-white placeholder-slate-600"
                              : "text-slate-900 placeholder-slate-400"
                          }`}
                          disabled={isLoading}
                        />
                      </div>
                      {errors.username && (
                        <p className="text-[11px] font-mono text-rose-500 mt-1">
                          {errors.username}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="email"
                        className={`block text-xs font-mono font-semibold uppercase tracking-wider ${
                          isDarkMode ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        Correo Corporativo
                      </label>
                      <div
                        className={`relative flex items-center rounded-2xl border transition-all duration-200 ${
                          isDarkMode ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <div className="pointer-events-none flex h-full items-center pl-4">
                          <Mail className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="operador@empresa.com"
                          className={`w-full bg-transparent py-3.5 pl-3 pr-4 text-sm font-mono outline-none ${
                            isDarkMode
                              ? "text-white placeholder-slate-600"
                              : "text-slate-900 placeholder-slate-400"
                          }`}
                          disabled={isLoading}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-[11px] font-mono text-rose-500 mt-1">
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* Password */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className={`block text-xs font-mono font-semibold uppercase tracking-wider ${
                      isDarkMode ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    Contraseña
                  </label>
                  <div
                    className={`relative flex items-center rounded-2xl border transition-all duration-200 ${
                      isDarkMode ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="pointer-events-none flex h-full items-center pl-4">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className={`w-full bg-transparent py-3.5 pl-3 pr-4 text-sm font-mono outline-none ${
                        isDarkMode
                          ? "text-white placeholder-slate-600"
                          : "text-slate-900 placeholder-slate-400"
                      }`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-[11px] font-mono text-rose-500 mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password (solo Registro) */}
                {isRegister && (
                  <div className="space-y-1.5">
                    <label
                      htmlFor="confirmPassword"
                      className={`block text-xs font-mono font-semibold uppercase tracking-wider ${
                        isDarkMode ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      Repetir Contraseña
                    </label>
                    <div
                      className={`relative flex items-center rounded-2xl border transition-all duration-200 ${
                        isDarkMode ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <div className="pointer-events-none flex h-full items-center pl-4">
                        <Lock className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className={`w-full bg-transparent py-3.5 pl-3 pr-4 text-sm font-mono outline-none ${
                          isDarkMode
                            ? "text-white placeholder-slate-600"
                            : "text-slate-900 placeholder-slate-400"
                        }`}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-[11px] font-mono text-rose-500 mt-1">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                )}

                {/* Botón Principal de Envío */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`group relative mt-2 flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl py-4 text-sm font-bold transition-all duration-300 ${
                    isLoading
                      ? "opacity-75 cursor-not-allowed"
                      : "hover:scale-[1.02] active:scale-[0.99]"
                  } bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-[length:200%_auto] text-slate-950 shadow-[0_0_30px_rgba(52,211,153,0.4)] hover:bg-right`}
                >
                  <span className="font-mono uppercase tracking-wider font-black">
                    {isLoading
                      ? "VERIFICANDO CREDENCIALES..."
                      : isRegister
                      ? "CREAR CUENTA / ACCEDER"
                      : "ABRIR CONSOLA // ENTRAR"}
                  </span>
                  <ArrowRight
                    className={`h-4 w-4 transition-transform duration-200 ${
                      isLoading ? "animate-spin" : "group-hover:translate-x-1"
                    }`}
                  />
                </button>
              </form>

              {/* Capacidades Interactivas */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <span
                  className={`block text-[11px] font-mono uppercase tracking-wider mb-3 ${
                    isDarkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Capacidades del Sistema
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(CAPABILITIES_INFO).map((capKey) => {
                    const cap = CAPABILITIES_INFO[capKey];
                    const Icon = cap.icon;
                    return (
                      <button
                        key={capKey}
                        type="button"
                        onClick={() => setSelectedCapability(capKey)}
                        className={`flex items-center gap-2 rounded-xl p-2.5 text-left text-xs font-mono transition-all duration-200 border ${
                          isDarkMode
                            ? "border-white/5 bg-white/[0.02] hover:bg-white/10 text-slate-300 hover:border-emerald-400/30"
                            : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        <span className="truncate text-[11px]">{capKey}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta Cinemática de Información 3D */}
          <div className="hidden lg:flex flex-col justify-center">
            <div className="rounded-3xl border border-emerald-400/30 bg-slate-950/60 p-8 shadow-2xl backdrop-blur-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6 font-mono text-xs text-emerald-400">
                <span className="flex items-center gap-2 font-bold">
                  <Terminal className="h-4 w-4" /> QUANTUM_CORE // HUD
                </span>
                <span className="flex items-center gap-1.5 text-cyan-300">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                  REALTIME 3D ACTIVE
                </span>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">
                    ARQUITECTURA DISTRIBUIDA
                  </span>
                  <strong className="text-emerald-300 text-sm">
                    Taurus, K6, Locust, Artillery & JMeter
                  </strong>
                  <p className="text-slate-400 text-xs mt-1.5 leading-relaxed font-sans">
                    Pruebas de estrés concurrentes con hasta 100,000 VUs emulados en
                    paralelo con telemetría forense milisegundo a milisegundo.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block">
                      LATENCIA MEDIA
                    </span>
                    <strong className="text-cyan-300 text-xl font-bold mt-1 block">
                      &lt; 0.8 ms
                    </strong>
                    <span className="text-[10px] text-emerald-400">Zero jitter</span>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block">
                      ENCRIPTACIÓN
                    </span>
                    <strong className="text-fuchsia-300 text-xl font-bold mt-1 block">
                      SHA-256
                    </strong>
                    <span className="text-[10px] text-slate-400">Per-user vault</span>
                  </div>
                </div>

                <div className="pt-2 text-slate-500 text-[11px] flex items-center justify-between">
                  <span>StressForge Enterprise v2.5</span>
                  <Link href="/home" className="text-emerald-400 hover:underline">
                    Ver presentación 3D &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal interactivo de información de Capacidades */}
      <AnimatePresence>
        {selectedCapability && activeCap && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`relative w-full max-w-lg overflow-hidden rounded-3xl border ${colorScheme.border} ${
                isDarkMode ? "bg-slate-950 text-white" : "bg-white text-slate-900"
              } p-6 shadow-2xl ${colorScheme.glowBorder}`}
            >
              <div className="flex items-start justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border ${colorScheme.badgeBg}`}
                  >
                    <activeCap.icon className={`h-5 w-5 ${colorScheme.textAccent}`} />
                  </div>
                  <div>
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-mono font-bold border ${colorScheme.badgeBg}`}
                    >
                      {activeCap.badge}
                    </span>
                    <h3 className="text-base font-bold font-mono tracking-tight mt-1">
                      {activeCap.title}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCapability(null)}
                  className={`rounded-lg p-1.5 transition-colors ${
                    isDarkMode ? "hover:bg-white/10 text-slate-400" : "hover:bg-slate-100 text-slate-500"
                  }`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="py-4 space-y-4">
                <p
                  className={`text-xs leading-relaxed ${
                    isDarkMode ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {activeCap.description}
                </p>

                <div className="space-y-2">
                  <span
                    className={`text-[11px] font-mono font-semibold uppercase tracking-wider block ${
                      isDarkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Especificaciones Técnicas:
                  </span>
                  <ul className="space-y-2">
                    {activeCap.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs">
                        <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${colorScheme.textAccent}`} />
                        <span className={isDarkMode ? "text-slate-300" : "text-slate-700"}>
                          {detail}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedCapability(null)}
                  className={`px-4 py-2 text-xs font-mono font-semibold rounded-xl transition-all ${colorScheme.buttonAccent}`}
                >
                  Entendido / Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LoginPage() {
  return (
    <GoogleOAuthProvider clientId="915931850576-074o3qln7h7q7cdhq7bea27d8pmuiiq2.apps.googleusercontent.com">
      <LoginForm />
    </GoogleOAuthProvider>
  );
}