"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ToolIndicator } from "@/components/tool-indicator";
import { ConsoleModal } from "@/components/ConsoleModal";
import { SocketProvider } from "@/lib/socket-context";
import { TestResultsProvider, useTestResults } from "@/lib/test-results-context";
import { getBackendUrl } from "@/lib/api-url";
import { UnifiedTestProvider, useUnifiedTest } from "@/lib/unified-test-context";
import { useTheme } from "@/lib/theme-context";
import { ThemeToggle } from "@/components/ThemeToggle";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoadingLink } from "@/components/ui/LoadingLink";
import {
  LayoutDashboard, PanelLeft, PanelLeftClose, Menu, Terminal, LogOut,
  Wrench, Server, Radio, Database, Network, ShieldCheck, File, FileText,
  UserCircle, Zap, ChevronDown, Activity, Layers,
  FileUp, Cpu, MemoryStick,
} from "lucide-react";

const queryClient = new QueryClient();

// ── Lista de herramientas cargando desde tu carpeta /public/tools ─────
const TOOLS_CONFIG = [
  { id: "simulacion", name: "Simulación", desc: "Motor nativo interno", image: "/logos/simulacion-svg.png" },
  { id: "k6", name: "k6", desc: "Grafana / Go engine", image: "/logos/K6-svg.png" },
  { id: "artillery", name: "Artillery", desc: "Pruebas YAML & Node.js", image: "/logos/artillery-svg.png" },
  { id: "autocannon", name: "Autocannon", desc: "Benchmarking HTTP rápido", image: "/logos/autocannon-svg.png" },
  { id: "jmeter", name: "JMeter", desc: "Apache JMeter Java Suite", image: "/logos/jmeter-svg.png" },
  { id: "locust", name: "Locust", desc: "Pruebas distribuidas Python", image: "/logos/locust-svg.png" },
  { id: "taurus", name: "Taurus", desc: "Automation framework", image: "/logos/taurus-svg.png" },
  { id: "hey", name: "Hey", desc: "Carga HTTP en Go", image: "/logos/hey-svg.png" },
  { id: "bombardier", name: "Bombardier", desc: "Benchmark HTTP en Go", image: "/logos/bombardier-svg.png" },
  { id: "vegeta", name: "Vegeta", desc: "HTTP load testing tool", image: "/logos/vegeta-svg.png" },
  { id: "gatling", name: "Gatling", desc: "Pruebas Scala / Java", image: "/logos/gatling-svg.png" },
];

// ── Nav structure: groups with items ──────────────────────────────────
const navGroups = [
  {
    label: "General",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Documentación", href: "/dashboard/documentation", icon: FileText },
    ],
  },
  {
    label: "Pruebas",
    items: [
      { label: "API REST", href: "/dashboard/tests/api", icon: Server },
      { label: "WebSocket", href: "/dashboard/tests/websocket", icon: Radio },
      { label: "Database", href: "/dashboard/tests/database", icon: Database },
      { label: "Caché", href: "/dashboard/tests/cache", icon: Layers },
      { label: "Red", href: "/dashboard/tests/network", icon: Network },
      { label: "Seguridad", href: "/dashboard/tests/security", icon: ShieldCheck },
      { label: "Archivos", href: "/dashboard/tests/files", icon: FileUp },
    ],
  },
];

// ── System Metrics chip ──────────────────────────────────────────────
function SystemMetricsIndicator() {
  const [metrics, setMetrics] = useState({ cpu: 0, ramUsed: "0.00", ramTotal: "0.00" });

  useEffect(() => {
    const fetchMetrics = async () => {
      const baseUrl = getBackendUrl();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // Timeout rápido

        const res = await fetch(`${baseUrl}/api/system/resources`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setMetrics({
          cpu: data.cpuCount || 0,
          ramUsed: data.ram?.usedGB || "0.00",
          ramTotal: data.ram?.totalGB || "0.00",
        });
      } catch (err) {
        console.debug("Error fetching metrics, retrying...", err);
      }
    };
    fetchMetrics();
    const id = setInterval(fetchMetrics, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hidden md:flex items-center gap-3 rounded-full border border-slate-200/80 bg-slate-100/60 px-3.5 py-1 text-xs font-medium text-slate-600 backdrop-blur-md shadow-2xs dark:border-slate-800/80 dark:bg-slate-900/60 dark:text-slate-300">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
        </span>
        <Cpu className="h-3.5 w-3.5 text-emerald-500" />
        <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-200">{metrics.cpu} cores</span>
      </div>
      <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-800" />
      <div className="flex items-center gap-1.5">
        <MemoryStick className="h-3.5 w-3.5 text-amber-500" />
        <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-200">{metrics.ramUsed} / {metrics.ramTotal} GB</span>
      </div>
    </div>
  );
}

// ── Header Controls (tool card selector + theme + user) ────────────────
function HeaderControls() {
  const { selectedTool, setSelectedTool } = useUnifiedTest();
  const { clearResults } = useTestResults();
  const { logout } = useAuth();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const t = (dark: string, light: string) => isDarkMode ? dark : light;

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showToolMenu, setShowToolMenu] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const toolMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (toolMenuRef.current && !toolMenuRef.current.contains(e.target as Node)) {
        setShowToolMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentTool = TOOLS_CONFIG.find((t) => t.id === selectedTool) || TOOLS_CONFIG[0];

  return (
    <div className="flex items-center gap-2">
      {/* Tool Selector Card Popover */}
      <div className="relative" ref={toolMenuRef}>
        <button
          onClick={() => setShowToolMenu(!showToolMenu)}
          className={`group flex items-center gap-2.5 rounded-xl border px-3 py-1.5 shadow-2xs transition-all duration-200 hover:border-sky-500/40 hover:shadow-sky-500/5 ${t(
            'border-slate-800/80 bg-slate-900/80 hover:bg-slate-900 text-slate-200',
            'border-slate-200/90 bg-white hover:bg-slate-50/90 text-slate-700'
          )}`}
        >
          <div className="relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md">
            <img
              src={currentTool.image}
              alt={currentTool.name}
              className="h-full w-full object-contain"
            />
          </div>
          <span className="text-xs font-semibold">{currentTool.name}</span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showToolMenu ? 'rotate-180' : ''} ${t('text-slate-400', 'text-slate-500')}`} />
        </button>
        {/* Modal / Popover con tarjetas */}
        {showToolMenu && (
          <div className={`absolute right-0 sm:right-[-95px] top-11 z-[110] w-[340px] sm:w-[450px] overflow-hidden rounded-2xl border p-3 shadow-2xl backdrop-blur-xl transition-all ${t(
            'border-slate-800/80 bg-slate-900/95 shadow-black/60 ring-1 ring-white/5',
            'border-slate-200/80 bg-white/95 shadow-slate-300/50 ring-1 ring-black/5'
          )}`}>
            <div className="mb-2.5 px-1 flex items-center justify-between">
              <span className={`text-[12px] font-bold uppercase tracking-wider ${t('text-slate-400', 'text-slate-500')}`}>
                Motor de Pruebas
              </span>
              <span className="text-[12px] font-mono font-semibold text-sky-500">
                {TOOLS_CONFIG.length} Herramientas
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1">
              {TOOLS_CONFIG.map((tool) => {
                const isSelected = selectedTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setSelectedTool(tool.id as any);
                      setShowToolMenu(false);
                    }}
                    className={`group relative flex items-center gap-2.5 rounded-xl border p-2 text-left transition-all duration-150 ${isSelected
                        ? t('border-sky-500/60 bg-sky-500/10 shadow-2xs shadow-sky-500/10', 'border-sky-500/80 bg-sky-50 shadow-2xs')
                        : t('border-slate-800/60 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-800/50', 'border-slate-100 bg-slate-50/60 hover:border-slate-200 hover:bg-slate-100/80')
                      }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border p-1 transition-transform group-hover:scale-105 ${isSelected
                        ? t('border-sky-500/40 bg-sky-500/20', 'border-sky-300 bg-sky-100')
                        : t('border-slate-800 bg-slate-900', 'border-slate-200 bg-white')
                      }`}>
                      <img
                        src={tool.image}
                        alt={tool.name}
                        className="h-full w-full object-contain"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[12px] font-bold truncate ${isSelected ? t('text-sky-400', 'text-sky-700') : t('text-slate-200', 'text-slate-800')}`}>
                          {tool.name}
                        </span>
                      </div>
                      <p className={`text-[13px] truncate ${t('text-slate-400', 'text-slate-500')}`}>
                        {tool.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>
      <ThemeToggle />

      {/* User menu */}
      <div className="relative" ref={userMenuRef}>
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className={`flex h-9 w-9 items-center justify-center rounded-xl border shadow-2xs transition-all duration-200 hover:scale-[1.03] active:scale-95 ${t('border-slate-800/80 bg-slate-900/80 text-slate-400 hover:border-slate-700 hover:text-slate-100', 'border-slate-200/90 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-900')}`}
        >
          <UserCircle className="h-8 w-8" />
        </button>
        {showUserMenu && (
          <div className={`absolute right-0 top-11 z-[100] w-48 overflow-hidden rounded-2xl border p-1.5 shadow-2xl backdrop-blur-xl transition-all ${t('border-slate-800/80 bg-slate-900/95 shadow-black/50 ring-1 ring-white/5', 'border-slate-200/80 bg-white/95 shadow-slate-300/40 ring-1 ring-black/5')}`}>
            <button
              onClick={() => {
                clearResults();
                logout();
              }}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${t('text-rose-400 hover:bg-rose-500/10', 'text-rose-600 hover:bg-rose-50')}`}
            >
              <LogOut className="h-3.5 w-3.5" />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sidebar Nav Link ──────────────────────────────────────────────────
function NavLink({
  href, label, icon: Icon, active, collapsed,
}: {
  href: string; label: string; icon: React.ElementType; active: boolean; collapsed: boolean;
}) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const t = (dark: string, light: string) => isDarkMode ? dark : light;

  return (
    <LoadingLink
      href={href}
      title={collapsed ? label : undefined}
      className={`relative flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200 group ${active
          ? t("bg-sky-500/10 text-sky-400 font-semibold shadow-2xs border border-sky-500/20", "bg-sky-50 text-sky-700 font-semibold shadow-2xs border border-sky-200/60")
          : t("text-slate-400 border border-transparent hover:bg-slate-800/50 hover:text-slate-100", "text-slate-600 border border-transparent hover:bg-slate-100/80 hover:text-slate-900")
        }`}
    >
      {active && (
        <span className={`absolute left-0 top-1/2 h-4 w-1 -translate-y-1/2 rounded-r-full transition-all ${t('bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]', 'bg-sky-600')}`} />
      )}
      <Icon className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${active ? t('text-sky-400', 'text-sky-600') : t('text-slate-400 group-hover:text-slate-300', 'text-slate-400 group-hover:text-slate-600')}`} />
      {!collapsed && <span className="truncate tracking-tight">{label}</span>}
    </LoadingLink>
  );
}

// ── Dashboard Shell ──────────────────────────────────────────────────
function DashboardShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, initialized } = useAuth();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const t = (dark: string, light: string) => isDarkMode ? dark : light;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const { activeLogs } = useTestResults();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Auth check logic
  }, [initialized, isAuthenticated, router]);

  if (!initialized || !isAuthenticated) {
    return null;
  }

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${t('bg-slate-950 text-slate-100', 'bg-slate-50/80 text-slate-900')}`}>

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className={`
    fixed inset-y-0 left-0 z-50 flex flex-col h-full
    border-r backdrop-blur-2xl transition-all duration-300 ease-in-out
    lg:static lg:z-auto
    ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
    ${sidebarOpen ? "w-60" : "w-18"}
    ${t('border-slate-800/50 bg-slate-950/60 shadow-2xl shadow-black/40', 'border-slate-200/60 bg-white/70 shadow-xl shadow-slate-200/50')}
  `}>
        {/* Logo Header */}
        <div className={`flex h-16 shrink-0 items-center border-b px-4 ${sidebarOpen ? "justify-between" : "justify-center"} ${t('border-slate-800/50', 'border-slate-200/60')}`}>
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-cyan-400 text-white shadow-lg shadow-sky-500/25 ring-1 ring-white/20">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <span className={`text-lg font-black tracking-tight ${t('text-white', 'text-slate-900')}`}>StressForge</span>
                <p className={`text-[13px] font-mono font-bold tracking-widest uppercase -mt-0.5 ${t('text-slate-500', 'text-slate-400')}`}>Performance Lab</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`rounded-xl p-1.5 transition-all duration-200 ${t('text-slate-400 hover:bg-slate-800/60 hover:text-white', 'text-slate-500 hover:bg-slate-100 hover:text-slate-900')}`}
          >
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-6 w-6" />}
          </button>
        </div>

        {/* Grupos de Navegación */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-6 ">
          {navGroups.map((group) => (
            <div key={group.label}>
              {sidebarOpen && (
                <p className={`mb-2 px-3 text-[15px] font-mono font-bold uppercase tracking-widest ${t('text-slate-500', 'text-slate-400')}`}>
                  {group.label}
                </p>
              )}
              {!sidebarOpen && <div className={`h-px mx-2 mb-3 ${t('bg-slate-800/50', 'bg-slate-200/60')}`} />}
              <div className="space-y-1 ">
                {group.items.map((item) => (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    active={pathname === item.href}
                    collapsed={!sidebarOpen}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Sidebar */}
        {sidebarOpen && (
          <div className={`border-t p-3.5 shrink-0 ${t('border-slate-800/50', 'border-slate-200/60')}`}>
            <p className={`text-center text-[14px] font-mono font-medium ${t('text-slate-500', 'text-slate-400')}`}>
              © 2026 StressForge
            </p>
          </div>
        )}
      </aside>

      {/* Overlay para Móvil */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-md lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Main Area ───────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">

        {/* Top Bar (Header Flotante Moderno) */}
        <header className={`sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b px-4 lg:px-6 backdrop-blur-2xl transition-all duration-300 ${t('border-slate-800/50 bg-slate-950/60', 'border-slate-200/60 bg-white/70')}`}>

          {/* Sección Izquierda: Menú Móvil + Selector + Botón Modo Oscuro */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className={`rounded-xl p-2 transition-colors lg:hidden ${t('text-slate-400 hover:bg-slate-800/60', 'text-slate-500 hover:bg-slate-100')}`}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Indicador de Herramienta */}
                <ToolIndicator />
          </div>

          {/* Sección Derecha: Métricas + Consola + Controles */}
          <div className="flex items-center gap-3">
            <SystemMetricsIndicator />



            <button
              onClick={() => setIsConsoleOpen(!isConsoleOpen)}
              className={`group flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-mono font-semibold transition-all duration-300 ${isConsoleOpen
                  ? "border-sky-500/40 bg-sky-500/10 text-sky-400 shadow-lg shadow-sky-500/10"
                  : t(
                    "border-slate-800/80 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80 hover:text-white",
                    "border-slate-200/80 bg-white/80 text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
                  )
                }`}
            >
              <Terminal className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" />
              <span className="hidden sm:inline tracking-wide">CONSOLA</span>
            </button>
            <HeaderControls />

          </div>
        </header>

        {/* ÁREA PRINCIPAL DE CONTENIDO */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>

        <ConsoleModal
          isOpen={isConsoleOpen}
          onClose={() => setIsConsoleOpen(false)}
          logs={Object.values(activeLogs).join('\n')}
        />

      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SocketProvider>
      <UnifiedTestProvider>
        <TestResultsProvider>
          <QueryClientProvider client={queryClient}>
            <DashboardShell>{children}</DashboardShell>
          </QueryClientProvider>
        </TestResultsProvider>
      </UnifiedTestProvider>
    </SocketProvider>
  );
}