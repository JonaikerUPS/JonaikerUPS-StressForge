"use client";

import { useState } from "react";
import {
  Server,
  Radio,
  Database,
  Network,
  ShieldCheck,
  FileUp,
  Zap,
  Activity,
  Terminal,
  Layers,
  Cpu,
  HardDrive,
  Lock,
  AlertCircle,
  Code2,
  HelpCircle,
  Shield,
  Radar,
  ScanLine,
  Bug,
  KeyRound,
  Swords,
  FolderSearch,
  TestTube2,
  Filter,
  Droplets,
  Timer,
  Gauge,
  Bomb,
  Globe,
  X,
  CheckCircle2,
  Info,
  ExternalLink
} from "lucide-react";

export interface ToolDetail {
  id: string;
  name: string;
  category: string;
  type: 'benchmark' | 'security';
  icon: any;
  color: string;
  badgeColor: string;
  language: string;
  description: string;
  purpose: string;
  commandExample: string;
  recommendedCases: string[];
  parameters: { name: string; desc: string }[];
  pros: string[];
}

export const TOOL_DETAILS: Record<string, ToolDetail> = {
  k6: {
    id: "k6",
    name: "k6",
    category: "Carga & APIs",
    type: "benchmark",
    icon: Zap,
    color: "text-cyan-500",
    badgeColor: "bg-cyan-500/10 text-cyan-500 border-cyan-500/30",
    language: "Go / JavaScript",
    description: "Herramienta moderna de prueba de carga y rendimiento de código abierto desarrollada en Go por Grafana Labs.",
    purpose: "Mide el rendimiento y la resistencia de APIs y microservicios mediante scripts programables en JavaScript.",
    commandExample: "k6 run --vus 50 --duration 30s script.js",
    recommendedCases: [
      "Pruebas de latencia en APIs REST / GraphQL / gRPC",
      "Integración continua (CI/CD) con umbrales de alerta SLA",
      "Simulación de escenarios de tráfico sostenido o rampa de usuarios"
    ],
    parameters: [
      { name: "VUs (--vus)", desc: "Número de Usuarios Virtuales hilos ejecutándose simultáneamente" },
      { name: "Duration (--duration)", desc: "Tiempo total asignado para la ejecución de la prueba" },
      { name: "Iterations (--iterations)", desc: "Número total de iteraciones completadas por usuario" }
    ],
    pros: [
      "Bajo consumo de memoria RAM y CPU",
      "Soporte nativo para WebSockets, HTTP/2 y gRPC",
      "Scripts expresivos en JS de fácil mantenimiento"
    ]
  },
  autocannon: {
    id: "autocannon",
    name: "Autocannon",
    category: "Rendimiento HTTP",
    type: "benchmark",
    icon: Gauge,
    color: "text-amber-500",
    badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    language: "Node.js",
    description: "Generador de carga HTTP/1.1 ultra rápido inspirado en wrk y wrk2, escrito 100% en Node.js.",
    purpose: "Genera una tasa masiva de peticiones por segundo (RPS) directamente en redes de alta velocidad o localhost.",
    commandExample: "npx autocannon -c 100 -d 10 http://localhost:8080",
    recommendedCases: [
      "Benchmarking ultrarrápido en entorno localhost",
      "Pruebas de throughput máximo en servidores Node.js/Express/Fastify"
    ],
    parameters: [
      { name: "Connections (-c)", desc: "Número de conexiones concurrentes abiertas" },
      { name: "Duration (-d)", desc: "Duración en segundos del benchmark" },
      { name: "Pipelining (-p)", desc: "Número de solicitudes HTTP encoladas por conexión" }
    ],
    pros: [
      "Rendimiento masivo de solicitudes por segundo",
      "Soporta pipelining HTTP",
      "Diseño nativo dentro del ecosistema Node.js"
    ]
  },
  locust: {
    id: "locust",
    name: "Locust",
    category: "Pruebas Distribuidas",
    type: "benchmark",
    icon: Activity,
    color: "text-purple-500",
    badgeColor: "bg-purple-500/10 text-purple-500 border-purple-500/30",
    language: "Python",
    description: "Herramienta distribuida de pruebas de carga de usuarios donde el comportamiento se define mediante código Python.",
    purpose: "Permite simular millones de usuarios simultáneos distribuidos en múltiples nodos ejecutando flujos de trabajo reales.",
    commandExample: "locust -f locustfile.py --headless -u 100 -r 10 --host http://localhost:8080",
    recommendedCases: [
      "Flujos de usuario complejos (login, navegación, carrito de compras)",
      "Escenarios de carga distribuida multinodo"
    ],
    parameters: [
      { name: "Users (-u)", desc: "Número total de usuarios virtuales simultáneos" },
      { name: "Spawn Rate (-r)", desc: "Tasa de creación de usuarios por segundo (Ramp Up)" }
    ],
    pros: [
      "Pruebas programables en Python puro",
      "UI de monitoreo web interactiva",
      "Excelente escalabilidad distribuida basada en Gevent"
    ]
  },
  artillery: {
    id: "artillery",
    name: "Artillery",
    category: "Microservicios & Cloud",
    type: "benchmark",
    icon: Radio,
    color: "text-rose-500",
    badgeColor: "bg-rose-500/10 text-rose-500 border-rose-500/30",
    language: "Node.js / YAML",
    description: "Plataforma de pruebas de rendimiento nativa para la nube, microservicios y sistemas Serverless.",
    purpose: "Audita tiempo de respuesta y resiliencia de APIs, servicios Socket.io, WebSockets y AWS Lambda.",
    commandExample: "artillery run --config config.yml script.yml",
    recommendedCases: [
      "Infraestructura Serverless / AWS Lambda",
      "Pruebas de Socket.io y comunicación en tiempo real",
      "Pipelines DevOps & integración en CI/CD"
    ],
    parameters: [
      { name: "Target", desc: "URL base del servicio a evaluar" },
      { name: "Phases", desc: "Definición de etapas de rampa y carga sostenida" }
    ],
    pros: [
      "Sintaxis declarativa en YAML",
      "Soporte nativo para WebSockets y Socket.io",
      "Excelente integración con métricas cloud (Datadog, CloudWatch)"
    ]
  },
  jmeter: {
    id: "jmeter",
    name: "JMeter",
    category: "Empresarial / Multi-protocolo",
    type: "benchmark",
    icon: Cpu,
    color: "text-blue-500",
    badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    language: "Java",
    description: "La herramienta corporativa estándar de la Apache Software Foundation para pruebas de carga.",
    purpose: "Diseñada para analizar el rendimiento funcional de recursos web, bases de datos JDBC, servicios SOAP y FTP.",
    commandExample: "jmeter -n -t plan.jmx -l resultados.jtl",
    recommendedCases: [
      "Sistemas empresariales complejos y legacy",
      "Pruebas de bases de datos mediante JDBC",
      "Servicios multi-protocolo (SOAP, FTP, Mail, JMS)"
    ],
    parameters: [
      { name: "Threads (-t)", desc: "Número de hilos (usuarios virtuales) concurrentes" },
      { name: "Ramp-Up", desc: "Tiempo en segundos para activar la totalidad de los hilos" }
    ],
    pros: [
      "Soporte de protocolos imbatible",
      "Comunidad gigantesca y miles de plugins",
      "Capacidad de simular escenarios de pruebas muy complejos"
    ]
  },
  taurus: {
    id: "taurus",
    name: "Taurus (bzt)",
    category: "Orquestador Multi-motor",
    type: "benchmark",
    icon: Layers,
    color: "text-indigo-500",
    badgeColor: "bg-indigo-500/10 text-indigo-500 border-indigo-500/30",
    language: "Python / YAML",
    description: "Orquestador de pruebas de rendimiento que simplifica la ejecución de JMeter, Gatling, Locust o k6.",
    purpose: "Abstrae la complejidad de configuración definiendo ejecuciones multi-motor mediante un único archivo YAML.",
    commandExample: "bzt taurus-config.yml",
    recommendedCases: [
      "Automatización en pipelines CI/CD",
      "Ejecución simplificada de scripts JMeter sin abrir GUI"
    ],
    parameters: [
      { name: "Concurrency", desc: "Usuarios virtuales orquestados" },
      { name: "Hold-for", desc: "Tiempo de mantenimiento de la carga máxima" }
    ],
    pros: [
      "Interfaz de terminal ANSI interactiva",
      "Reportes consolidados automáticos",
      "Configuración unificada en YAML de fácil lectura"
    ]
  },
  hey: {
    id: "hey",
    name: "Hey",
    category: "Benchmarking HTTP",
    type: "benchmark",
    icon: Terminal,
    color: "text-emerald-500",
    badgeColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    language: "Go",
    description: "Generador de carga HTTP directo y ligero escrito en Go (sucesor de ab).",
    purpose: "Envia solicitudes simultáneas para calcular histogramas de latencia y throughput de forma instantánea.",
    commandExample: "hey -n 1000 -c 50 http://localhost:8080",
    recommendedCases: [
      "Pruebas rápidas de diagnóstico desde consola",
      "Verificación instantánea de latencia y percentiles P50/P95"
    ],
    parameters: [
      { name: "Requests (-n)", desc: "Número total de peticiones a procesar" },
      { name: "Concurrency (-c)", desc: "Número de trabajadores ejecutando en paralelo" }
    ],
    pros: [
      "Binario estático único en Go",
      "Genera histogramas de latencia automáticos",
      "Ejecución limpia y sin sobrecarga"
    ]
  },
  bombardier: {
    id: "bombardier",
    name: "Bombardier",
    category: "Estrés / Saturation",
    type: "benchmark",
    icon: Zap,
    color: "text-orange-500",
    badgeColor: "bg-orange-500/10 text-orange-500 border-orange-500/30",
    language: "Go (FastHTTP)",
    description: "Herramienta de pruebas de estrés HTTP de velocidad extrema basada en la librería FastHTTP.",
    purpose: "Satura conexiones HTTP/1.1 y HTTP/2 para evaluar los límites de hardware del servidor web.",
    commandExample: "bombardier -c 125 -n 1000000 http://localhost:8080",
    recommendedCases: [
      "Pruebas de estrés límite de infraestructura",
      "Benchmarking de servidores de altísimo rendimiento (Rust, Go, C++)"
    ],
    parameters: [
      { name: "Connections (-c)", desc: "Conexiones simultáneas abiertas" },
      { name: "Requests (-n)", desc: "Cantidad masiva de peticiones a transmitir" }
    ],
    pros: [
      "Velocidad de peticiones por segundo inigualable",
      "Uso insignificante de recursos en cliente",
      "Soporta HTTP/2 y latencia P99.99"
    ]
  },
  vegeta: {
    id: "vegeta",
    name: "Vegeta",
    category: "Tasa Fija (Rate Fixed)",
    type: "benchmark",
    icon: Activity,
    color: "text-teal-500",
    badgeColor: "bg-teal-500/10 text-teal-500 border-teal-500/30",
    language: "Go",
    description: "Herramienta de pruebas de carga orientada a mantener un ritmo fijo de peticiones por segundo (Rate Fixed).",
    purpose: "Audita la estabilidad del servidor ante un flujo sostenido garantizado de peticiones (ej. 100 RPS exactos).",
    commandExample: "echo 'GET http://localhost:8080' | vegeta attack -rate=100 -duration=10s | vegeta report",
    recommendedCases: [
      "Verificación estricta de SLAs de respuesta",
      "Evaluación de comportamiento ante tasa constante de tráfico",
      "Análisis de Coordinated Omission"
    ],
    parameters: [
      { name: "Rate (-rate)", desc: "Peticiones por segundo garantizadas (ej. 500/s)" },
      { name: "Duration (-duration)", desc: "Tiempo total del ataque constante" }
    ],
    pros: [
      "Evita el sesgo de omisión coordinada en latencias",
      "Integración por tuberías Unix (pipes)",
      "Reportes e histogramas en HTML"
    ]
  },
  gatling: {
    id: "gatling",
    name: "Gatling",
    category: "Enterprise Simulation",
    type: "benchmark",
    icon: Server,
    color: "text-pink-500",
    badgeColor: "bg-pink-500/10 text-pink-500 border-pink-500/30",
    language: "Scala / Java",
    description: "Framework de prueba de rendimiento avanzado basado en arquitectura asíncrona Akka.",
    purpose: "Genera simulaciones complejas de usuarios con reportes gráficos interactivos en HTML de alta precisión.",
    commandExample: "gatling.sh -s SimulaciónAvanzada",
    recommendedCases: [
      "Plataformas bancarias, comercio electrónico y Fintech",
      "Análisis visual detallado de latencias y SLAs"
    ],
    parameters: [
      { name: "Users", desc: "Número de usuarios virtuales configurados en la simulación DSL" }
    ],
    pros: [
      "Reportes HTML navegables y detallados nativos",
      "Arquitectura reactiva no-bloqueante",
      "Excelente expresividad DSL"
    ]
  },
  nmap: {
    id: "nmap",
    name: "Nmap",
    category: "Escaneo de Red",
    type: "security",
    icon: Radar,
    color: "text-emerald-500",
    badgeColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    language: "C / C++",
    description: "El escáner de red y auditor de puertos más utilizado en ciberseguridad.",
    purpose: "Descubre puertos TCP/UDP abiertos, identifica servicios escuchando, versiones de software y huella digital del SO.",
    commandExample: "nmap -sV -p 1-1000 localhost",
    recommendedCases: [
      "Reconocimiento inicial de infraestructura",
      "Auditoría de puertos expuestos",
      "Detección de servicios obsoletos"
    ],
    parameters: [
      { name: "Target", desc: "IP o dominio objetivo" },
      { name: "Ports (-p)", desc: "Rango de puertos a escanear" }
    ],
    pros: [
      "Motor de scripts NSE potente",
      "Detección precisa de versiones de servicio",
      "Estándar mundial de la industria"
    ]
  },
  masscan: {
    id: "masscan",
    name: "Masscan",
    category: "Escaneo Masivo",
    type: "security",
    icon: ScanLine,
    color: "text-teal-500",
    badgeColor: "bg-teal-500/10 text-teal-500 border-teal-500/30",
    language: "C",
    description: "Escáner de puertos masivo capaz de escanear millones de direcciones por segundo.",
    purpose: "Transmite paquetes SYN de forma asíncrona para mapear infraestructura de red a velocidades extremas.",
    commandExample: "masscan -p1-65535 127.0.0.1 --rate=1000",
    recommendedCases: [
      "Mapeo rápido de subredes corporativas grandes",
      "Reconocimiento ultra rápido de puertos TCP"
    ],
    parameters: [
      { name: "Rate (--rate)", desc: "Velocidad de paquetes transmitidos por segundo" }
    ],
    pros: [
      "Velocidad imbatible para escaneo masivo",
      "Basado en pila de red propia personalizada"
    ]
  },
  nikto: {
    id: "nikto",
    name: "Nikto",
    category: "Vulnerabilidades Web",
    type: "security",
    icon: Bug,
    color: "text-red-500",
    badgeColor: "bg-red-500/10 text-red-500 border-red-500/30",
    language: "Perl",
    description: "Escáner de vulnerabilidades en servidores web de código abierto.",
    purpose: "Evalúa servidores web buscando más de 6700 archivos peligrosos, CGIs desactualizados y malas configuraciones HTTP.",
    commandExample: "nikto -h http://localhost:8080",
    recommendedCases: [
      "Auditoría rápida de servidores web HTTP/HTTPS",
      "Detección de cabeceras de seguridad faltantes"
    ],
    parameters: [
      { name: "Host (-h)", desc: "URL o IP del servidor web objetivo" }
    ],
    pros: [
      "Base de datos extensa de vulnerabilidades web conocidas",
      "Soporte de proxies y autenticación"
    ]
  },
  hydra: {
    id: "hydra",
    name: "Hydra",
    category: "Autenticación",
    type: "security",
    icon: KeyRound,
    color: "text-amber-500",
    badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    language: "C",
    description: "Herramienta paralela de pruebas de fuerza bruta contra sistemas de autenticación.",
    purpose: "Simula ataques de diccionario contra formularios HTTP, SSH, FTP, MySQL y más de 50 protocolos.",
    commandExample: "hydra -l admin -P wordlist.txt localhost http-post-form",
    recommendedCases: [
      "Verificación de fortaleza de contraseñas",
      "Prueba de políticas de bloqueo de cuenta ante fuerza bruta"
    ],
    parameters: [
      { name: "Login (-l/-L)", desc: "Usuario o lista de usuarios a probar" },
      { name: "Password (-p/-P)", desc: "Contraseña o diccionario de contraseñas" }
    ],
    pros: [
      "Soporta más de 50 protocolos de red",
      "Ejecución multi-hilo en paralelo muy rápida"
    ]
  },
  sqlmap: {
    id: "sqlmap",
    name: "SQLMap",
    category: "Explotación SQLi",
    type: "security",
    icon: Swords,
    color: "text-purple-500",
    badgeColor: "bg-purple-500/10 text-purple-500 border-purple-500/30",
    language: "Python",
    description: "Herramienta automatizada para la detección y explotación de inyecciones SQL.",
    purpose: "Evalúa parámetros de entrada para confirmar vulnerabilidades SQLi y extraer estructuras de bases de datos.",
    commandExample: "sqlmap -u 'http://localhost:8080/user?id=1' --batch",
    recommendedCases: [
      "Auditoría de seguridad en parámetros web GET/POST",
      "Detección de inyecciones SQL ciegas, basadas en tiempo o error"
    ],
    parameters: [
      { name: "URL (-u)", desc: "Endpoint con parámetros a analizar" },
      { name: "Batch (--batch)", desc: "Modo no interactivo" }
    ],
    pros: [
      "Motor de inyección SQL más avanzado del mundo",
      "Soporta PostgreSQL, MySQL, SQLite, Oracle, MSSQL"
    ]
  },
  gobuster: {
    id: "gobuster",
    name: "Gobuster",
    category: "Enumeración Web",
    type: "security",
    icon: FolderSearch,
    color: "text-sky-500",
    badgeColor: "bg-sky-500/10 text-sky-500 border-sky-500/30",
    language: "Go",
    description: "Herramienta de fuerza bruta para descubrir directorios, archivos ocultos y subdominios.",
    purpose: "Envia peticiones con listas de palabras para hallar rutas no enlazadas o paneles administrativos.",
    commandExample: "gobuster dir -u http://localhost:8080 -w wordlist.txt",
    recommendedCases: [
      "Descubrimiento de rutas web expuestas",
      "Fuerza bruta de subdominios y carpetas ocultas"
    ],
    parameters: [
      { name: "URL (-u)", desc: "Dirección web a enumerar" },
      { name: "Wordlist (-w)", desc: "Archivo con la lista de palabras para probar" }
    ],
    pros: [
      "Escrito en Go para máximo rendimiento",
      "Soporta enumeración de directorios, DNS y vhosts"
    ]
  },
  wfuzz: {
    id: "wfuzz",
    name: "WFuzz",
    category: "Fuzzing HTTP",
    type: "security",
    icon: TestTube2,
    color: "text-cyan-500",
    badgeColor: "bg-cyan-500/10 text-cyan-500 border-cyan-500/30",
    language: "Python",
    description: "Fuzzer flexible para evaluar la seguridad de peticiones HTTP.",
    purpose: "Inyecta datos en cualquier punto de la petición HTTP (parámetros GET/POST, cookies, cabeceras) para hallar fallos.",
    commandExample: "wfuzz -c -z file,wordlist.txt --hc 404 http://localhost:8080/FUZZ",
    recommendedCases: [
      "Fuzzing de parámetros de API REST",
      "Descubrimiento de parámetros vulnerables a XSS/LFI"
    ],
    parameters: [
      { name: "Payload (-z)", desc: "Especificación de diccionario de entrada" },
      { name: "Hide Code (--hc)", desc: "Ocultar respuestas con códigos de estado específicos" }
    ],
    pros: [
      "Gran flexibilidad para inyectar en cualquier punto de la petición",
      "Filtrado avanzado de respuestas"
    ]
  },
  ffuf: {
    id: "ffuf",
    name: "FFUF",
    category: "Fast Fuzzing",
    type: "security",
    icon: Filter,
    color: "text-indigo-500",
    badgeColor: "bg-indigo-500/10 text-indigo-500 border-indigo-500/30",
    language: "Go",
    description: "Fuzzer web ultrarrápido escrito en Go para la búsqueda rápida de recursos.",
    purpose: "Envia miles de solicitudes por segundo reemplazando la palabra clave FUZZ en la URL o cuerpo.",
    commandExample: "ffuf -u http://localhost:8080/FUZZ -w wordlist.txt",
    recommendedCases: [
      "Enumeración ultrarrápida de endpoints en APIs",
      "Fuzzing masivo de rutas"
    ],
    parameters: [
      { name: "URL (-u)", desc: "URL con palabra clave FUZZ" },
      { name: "Wordlist (-w)", desc: "Ruta al diccionario" }
    ],
    pros: [
      "Velocidad extrema en Go",
      "Excelente soporte de expresiones regulares y filtrado por tamaño"
    ]
  },
  hping3: {
    id: "hping3",
    name: "Hping3",
    category: "Paquetes TCP/IP",
    type: "security",
    icon: Droplets,
    color: "text-orange-500",
    badgeColor: "bg-orange-500/10 text-orange-500 border-orange-500/30",
    language: "C",
    description: "Ensamblador y analizador de paquetes TCP/IP orientado a la auditoría de red.",
    purpose: "Permite enviar paquetes TCP/UDP/ICMP adaptados para auditar reglas de firewall y simular inundaciones SYN.",
    commandExample: "hping3 -S --flood -p 80 localhost",
    recommendedCases: [
      "Pruebas de resistencia de reglas de firewall",
      "Simulación de ataques de inundación TCP SYN"
    ],
    parameters: [
      { name: "SYN (-S)", desc: "Enviar paquetes con bandera SYN activa" },
      { name: "Flood (--flood)", desc: "Enviar paquetes lo más rápido posible sin esperar respuesta" }
    ],
    pros: [
      "Control total sobre los campos del encabezado IP/TCP",
      "Ideal para pruebas de resiliencia de red"
    ]
  },
  siege: {
    id: "siege",
    name: "Siege",
    category: "Estrés HTTP",
    type: "security",
    icon: Timer,
    color: "text-lime-500",
    badgeColor: "bg-lime-500/10 text-lime-500 border-lime-500/30",
    language: "C",
    description: "Utility de prueba de estrés HTTP/HTTPS y benchmarking multi-hilo.",
    purpose: "Evalúa cómo responde la aplicación web bajo alta concurrencia de usuarios midiendo tiempo de respuesta y errores.",
    commandExample: "siege -c 50 -t 30s http://localhost:8080",
    recommendedCases: [
      "Pruebas de resiliencia de servidores web",
      "Simulación de pico de accesos simultáneos"
    ],
    parameters: [
      { name: "Concurrent (-c)", desc: "Número de usuarios simulados" },
      { name: "Time (-t)", desc: "Duración de la prueba" }
    ],
    pros: [
      "Sencillez de uso",
      "Soporta URLs desde un archivo de lista"
    ]
  },
  ab: {
    id: "ab",
    name: "ApacheBench (ab)",
    category: "Benchmark HTTP",
    type: "security",
    icon: Gauge,
    color: "text-pink-500",
    badgeColor: "bg-pink-500/10 text-pink-500 border-pink-500/30",
    language: "C",
    description: "Herramienta estándar de benchmarking HTTP empaquetada con Apache HTTP Server.",
    purpose: "Mide la capacidad de respuesta del servidor calculando solicitudes por segundo servidas.",
    commandExample: "ab -n 1000 -c 50 http://localhost:8080/",
    recommendedCases: [
      "Benchmarking rápido de capacidad de solicitudes",
      "Comparativa básica entre servidores web"
    ],
    parameters: [
      { name: "Requests (-n)", desc: "Peticiones totales" },
      { name: "Concurrency (-c)", desc: "Peticiones concurrentes" }
    ],
    pros: [
      "Disponible universalmente",
      "Ligera y directa"
    ]
  },
  slowloris: {
    id: "slowloris",
    name: "Slowloris",
    category: "Ataque DoS Lento",
    type: "security",
    icon: Bomb,
    color: "text-red-500",
    badgeColor: "bg-red-500/10 text-red-500 border-red-500/30",
    language: "Python",
    description: "Herramienta de denegación de servicio que mantiene conexiones HTTP abiertas al servidor.",
    purpose: "Envia cabeceras parciales periódicamente para mantener los sockets ocupados y agotar la piscina de conexiones.",
    commandExample: "slowloris http://localhost:8080 -s 150",
    recommendedCases: [
      "Prueba de mitigación contra Slowloris en Apache/Nginx",
      "Verificación de timeouts de conexión HTTP"
    ],
    parameters: [
      { name: "Sockets (-s)", desc: "Número de conexiones lentas a mantener abiertas" }
    ],
    pros: [
      "No requiere gran ancho de banda",
      "Prueba la resiliencia de gestión de sockets del servidor"
    ]
  }
};

interface SectionData {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  badge?: string;
  content: (onOpenModal: (toolId: string) => void) => React.ReactNode;
}

const getSections = (): SectionData[] => [
  {
    id: "intro",
    title: "Arquitectura del Sistema",
    subtitle: "Visión general de la infraestructura y orquestación de StressForge",
    icon: Server,
    badge: "Core Architecture",
    content: () => (
      <div className="space-y-8">
        <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
          <strong>StressForge</strong> es una suite de ingeniería de rendimiento modular diseñada para ejecutar benchmarking de alta concurrencia, telemetría distribuida y auditorías de estrés en arquitecturas distribuidas modernas.
        </p>

        {/* Diagrama de Arquitectura Resumido */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-cyan-500/30 shadow-sm dark:shadow-cyan-950/10">
            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-semibold mb-2 text-md">
              <Cpu className="h-4 w-4" /> Frontend (Next.js 14)
            </div>
            <p className="text-md text-slate-500 dark:text-slate-400">
              SPA reactiva con dashboards dinámicos, renderizado de gráficos de latencia en tiempo real via WebSockets y gestión de temas.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-blue-500/30 shadow-sm dark:shadow-blue-950/10">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold mb-2 text-md">
              <Server className="h-4 w-4" /> Backend Orchestrator
            </div>
            <p className="text-md text-slate-500 dark:text-slate-400">
              API REST en Node.js/Express encargada de invocar los runner-scripts, controlar procesos Docker aislados y canalizar logs de STDOUT.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-emerald-500/30 shadow-sm dark:shadow-emerald-950/10">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold mb-2 text-md">
              <Database className="h-4 w-4" /> Persistence & Logs
            </div>
            <p className="text-md text-slate-500 dark:text-slate-400">
              Almacenamiento de historiales de métricas en MongoDB y exportación física de reportes estadísticos en PDF y CSV.
            </p>
          </div>
        </div>

        {/* Tabla de Especificaciones de Contenedores */}
        <h3 className="text-lg font-bold text-slate-900 dark:text-white pt-2">
          Aislamiento y Dockerización
        </h3>
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-md">
            <thead className="bg-slate-100 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 uppercase font-mono">
              <tr>
                <th className="p-3">Servicio</th>
                <th className="p-3">Puerto Interno</th>
                <th className="p-3">Estrategia de Red</th>
                <th className="p-3">Función Principal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950/40">
              <tr>
                <td className="p-3 font-mono text-cyan-700 dark:text-cyan-400 font-bold">stressforge-ui</td>
                <td className="p-3 font-mono">3000</td>
                <td className="p-3">Bridge / Host</td>
                <td className="p-3">Interfaz visual de monitoreo y configuración</td>
              </tr>
              <tr>
                <td className="p-3 font-mono text-blue-700 dark:text-blue-400 font-bold">stressforge-backend</td>
                <td className="p-3 font-mono">8080</td>
                <td className="p-3">Bridge</td>
                <td className="p-3">Orquestador de tests y WebSocket Server</td>
              </tr>
              <tr>
                <td className="p-3 font-mono text-emerald-700 dark:text-emerald-400 font-bold">test-runners</td>
                <td className="p-3 font-mono">Dinámico</td>
                <td className="p-3">Isolated Container</td>
                <td className="p-3">Ejecución aislada de Taurus, k6, Locust y Autocannon</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  },
  {
    id: "api",
    title: "Módulo API REST",
    subtitle: "Benchmarking extensivo para endpoints HTTP/HTTPS",
    icon: Activity,
    badge: "HTTP / REST Engine",
    content: () => (
      <div className="space-y-6">
        <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
          Permite simular carga distribuida sobre servidores Web/APIs. Mide el comportamiento del backend ante picos abruptos de solicitudes HTTP.
        </p>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Parámetros de Configuración Críticos</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
            <span className="text-md font-mono px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 font-bold">Concurrency (VUs)</span>
            <p className="text-md text-slate-600 dark:text-slate-400 mt-2">
              Representa el número de Usuarios Virtuales hilos ejecutándose en paralelo. Cada VU mantiene conexiones independientes.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
            <span className="text-md font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-bold">Ramp-Up (s)</span>
            <p className="text-md text-slate-600 dark:text-slate-400 mt-2">
              Tiempo en segundos asignado para escalar progresivamente desde 1 usuario hasta la concurrencia máxima configurada.
            </p>
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white pt-2">Métricas e Interpretación</h3>
        <div className="space-y-2 text-md">
          <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
            <div className="text-emerald-600 dark:text-emerald-400 font-bold font-mono w-16">P50</div>
            <div className="text-slate-700 dark:text-slate-300"><strong>Mediana de Latencia:</strong> El 50% de las peticiones respondieron en este tiempo o menos. Representa la experiencia promedio.</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
            <div className="text-amber-600 dark:text-amber-400 font-bold font-mono w-16">P95</div>
            <div className="text-slate-700 dark:text-slate-300"><strong>Límite Crítico:</strong> 95% de las peticiones fueron más rápidas que este valor. Identifica degradación moderada bajo carga.</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
            <div className="text-rose-600 dark:text-rose-400 font-bold font-mono w-16">P99</div>
            <div className="text-slate-700 dark:text-slate-300"><strong>Picos Extremos:</strong> El 1% peor de todas las peticiones. Muestra colas de espera en el Event Loop o bloqueos de DB.</div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "tools",
    title: "Herramientas de Benchmark",
    subtitle: "Motores de pruebas soportados por el orquestador (Haz clic en una herramienta para abrir su modal completo)",
    icon: Zap,
    badge: "Multi-Engine",
    content: (onOpenModal) => (
      <div className="space-y-6">
        <p className="text-slate-600 dark:text-slate-300 text-base">
          StressForge unifica 10 motores de benchmark en una interfaz común. Haz clic en cualquier fila para abrir el modal amplio de detalles técnicos y comandos CLI:
        </p>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-md">
            <thead className="bg-slate-100 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 uppercase font-mono">
              <tr>
                <th className="p-3.5">Motor</th>
                <th className="p-3.5">Lenguaje Base</th>
                <th className="p-3.5">Punto Fuerte</th>
                <th className="p-3.5">Uso Recomendado</th>
                <th className="p-3.5">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950/40">
              {[
                { id: "k6", name: "k6", lang: "Go / JS", strength: "Bajo consumo de memoria y scripts flexibles", use: "APIs complejas y pipelines CI/CD", color: "text-cyan-600 dark:text-cyan-400" },
                { id: "autocannon", name: "Autocannon", lang: "Node.js", strength: "Velocidad pura y tasa masiva de RPS", use: "Pruebas ultrarrápidas de throughput en localhost", color: "text-amber-600 dark:text-amber-400" },
                { id: "locust", name: "Locust", lang: "Python", strength: "Escenarios distribuidos con conducta de usuario", use: "Flujos reales de e-commerce y autenticación", color: "text-purple-600 dark:text-purple-400" },
                { id: "artillery", name: "Artillery", lang: "Node.js / YAML", strength: "Integración nativa con Serverless / AWS", use: "Pruebas integradas en desarrollo de microservicios", color: "text-rose-600 dark:text-rose-400" },
                { id: "jmeter", name: "JMeter", lang: "Java", strength: "Soporte protocolar completo (JDBC, FTP, SOAP)", use: "Sistemas legacy y empresas tradicionales", color: "text-blue-600 dark:text-blue-400" },
                { id: "taurus", name: "Taurus (bzt)", lang: "Python / YAML", strength: "Orquestación unificada en YAML simple", use: "Pruebas automatizadas multi-motor sin complejidad", color: "text-indigo-600 dark:text-indigo-400" },
                { id: "hey", name: "Hey", lang: "Go", strength: "Generador HTTP sencillo y liviano", use: "Benchmarking rápido y directo desde CLI", color: "text-emerald-600 dark:text-emerald-400" },
                { id: "bombardier", name: "Bombardier", lang: "Go (FastHTTP)", strength: "Ultra alto rendimiento y concurrencia masiva", use: "Pruebas extremas de latencia y saturación de red", color: "text-orange-600 dark:text-orange-400" },
                { id: "vegeta", name: "Vegeta", lang: "Go", strength: "Ataques HTTP a tasa constante de RPS", use: "Medición de SLAs y tolerancia ante tasas fijas de tráfico", color: "text-teal-600 dark:text-teal-400" },
                { id: "gatling", name: "Gatling", lang: "Scala / Java", strength: "Simulaciones avanzadas y reportes gráficos de alta precisión", use: "Pruebas corporativas de volumen y alta concurrencia", color: "text-pink-600 dark:text-pink-400" }
              ].map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition cursor-pointer" onClick={() => onOpenModal(row.id)}>
                  <td className={`p-3.5 font-bold font-mono text-base ${row.color}`}>{row.name}</td>
                  <td className="p-3.5 font-mono text-sm">{row.lang}</td>
                  <td className="p-3.5 text-sm">{row.strength}</td>
                  <td className="p-3.5 text-sm">{row.use}</td>
                  <td className="p-3.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); onOpenModal(row.id); }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 font-bold text-xs transition"
                    >
                      <Info className="h-4 w-4" /> Abrir Modal
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  },
  {
    id: "security",
    title: "Pruebas de Seguridad & Pentesting",
    subtitle: "Guía completa de las 12 herramientas de pentesting (Haz clic en cualquiera para abrir su Modal ampliado)",
    icon: Shield,
    badge: "Pentest Suite",
    content: (onOpenModal) => (
      <div className="space-y-8">
        <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
          El módulo de <strong>Pruebas de Seguridad</strong> integra 12 herramientas estándar de ciberseguridad. Haz clic en cualquiera de las tarjetas para abrir su modal expansivo con explicaciones, flags y ejemplos de comandos.
        </p>

        {/* PARÁMETROS DE CONFIGURACIÓN */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Parámetros de Configuración</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
              <span className="text-sm font-mono px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 font-bold">Target URL</span>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                Dirección IP o URL objetivo (ej. <code className="font-mono text-xs">http://localhost:8080</code>) donde se realizarán las pruebas de seguridad.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
              <span className="text-sm font-mono px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 font-bold">Concurrencia</span>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                Número de hilos o peticiones simultáneas ejecutadas por las herramientas durante la auditoría.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
              <span className="text-sm font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-bold">Duración (ms)</span>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                Tiempo límite en milisegundos asignado para la ejecución continuada de los motores seleccionados.
              </p>
            </div>
          </div>
        </div>

        {/* CATÁLOGO DE HERRAMIENTAS INTERACTIVO */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Catálogo de Herramientas de Seguridad</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { id: "nmap", name: "Nmap", icon: Radar, color: "text-emerald-500", bg: "bg-emerald-500/10", tag: "Escaneo", subtitle: "Escaneo de puertos y detección de servicios activos", desc: "Descubre qué puertos TCP/UDP están abiertos en el servidor y detecta versiones de software." },
              { id: "masscan", name: "Masscan", icon: ScanLine, color: "text-teal-500", bg: "bg-teal-500/10", tag: "Escaneo Masivo", subtitle: "Escaneo masivo y asíncrono de puertos TCP ultra rápido", desc: "Transmite paquetes SYN asíncronos para mapear infraestructura de red a velocidades extremas." },
              { id: "nikto", name: "Nikto", icon: Bug, color: "text-red-500", bg: "bg-red-500/10", tag: "Vulnerabilidades", subtitle: "Escáner integral de vulnerabilidades en servidores web", desc: "Inspecciona el servidor buscando más de 6700 archivos peligrosos y malas configuraciones HTTP." },
              { id: "hydra", name: "Hydra", icon: KeyRound, color: "text-amber-500", bg: "bg-amber-500/10", tag: "Autenticación", subtitle: "Pruebas de fuerza bruta de credenciales de login", desc: "Simula ataques de diccionario contra sistemas de login HTTP, SSH, FTP para probar contraseñas." },
              { id: "sqlmap", name: "SQLMap", icon: Swords, color: "text-purple-500", bg: "bg-purple-500/10", tag: "Explotación SQLi", subtitle: "Detección y verificación de inyecciones SQL", desc: "Automatiza la detección y explotación de inyecciones SQL en parámetros web." },
              { id: "gobuster", name: "Gobuster", icon: FolderSearch, color: "text-sky-500", bg: "bg-sky-500/10", tag: "Enumeración", subtitle: "Enumeración de directorios y archivos ocultos", desc: "Realiza ataques de diccionario para descubrir rutas no enlazadas o paneles administrativos." },
              { id: "wfuzz", name: "WFuzz", icon: TestTube2, color: "text-cyan-500", bg: "bg-cyan-500/10", tag: "Fuzzing HTTP", subtitle: "Fuzzing flexible de parámetros y cabeceras", desc: "Inyecta datos arbitrarios en cualquier punto de la petición HTTP para hallar fallos." },
              { id: "ffuf", name: "FFUF", icon: Filter, color: "text-indigo-500", bg: "bg-indigo-500/10", tag: "Fast Fuzzing", subtitle: "Fuzzing de alto rendimiento escrito en Go", desc: "Descubre endpoints, recursos y APIs mediante fuzzing masivo de rutas." },
              { id: "hping3", name: "Hping3", icon: Droplets, color: "text-orange-500", bg: "bg-orange-500/10", tag: "Paquetes TCP/IP", subtitle: "Generación y auditoría de paquetes de red", desc: "Emite tráficos TCP/UDP/ICMP adaptados para auditar la resistencia de cortafuegos." },
              { id: "siege", name: "Siege", icon: Timer, color: "text-lime-500", bg: "bg-lime-500/10", tag: "Estrés HTTP", subtitle: "Pruebas de estrés y benchmarking de carga", desc: "Somete la aplicación a solicitudes concurrentes intensas para medir estabilidad." },
              { id: "ab", name: "ApacheBench (ab)", icon: Gauge, color: "text-pink-500", bg: "bg-pink-500/10", tag: "Rendimiento HTTP", subtitle: "Medición de capacidad de procesamiento (RPS)", desc: "Calcula Peticiones Por Segundo (RPS) en solicitudes consecutivas o concurrentes." },
              { id: "slowloris", name: "Slowloris", icon: Bomb, color: "text-red-500", bg: "bg-red-500/10", tag: "DoS Lento", subtitle: "Prueba de agotamiento de conexiones HTTP", desc: "Mantiene conexiones HTTP abiertas enviando cabeceras incompletas para evaluar resiliencia." }
            ].map((t) => {
              const Icon = t.icon;
              return (
                <div
                  key={t.id}
                  onClick={() => onOpenModal(t.id)}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 dark:hover:border-sky-500/50 transition cursor-pointer group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${t.bg} ${t.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-sky-500 transition">{t.name}</h4>
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${t.bg} ${t.color}`}>
                      {t.tag}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 font-medium mb-1">{t.subtitle}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{t.desc}</p>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 group-hover:translate-x-1 transition-transform">
                    <Info className="h-4 w-4" /> Abrir Modal de detalles & CLI &rarr;
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MÉTRICAS Y RESULTADOS */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Métricas del Módulo</h3>
          <div className="space-y-2 text-sm">
            <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
              <div className="text-red-500 font-bold font-mono w-40 shrink-0">Hallazgos Encontrados</div>
              <div className="text-slate-700 dark:text-slate-300">Cantidad total de eventos significativos detectados por los escáneres (puertos descubiertos, vulnerabilidades confirmadas, directorios válidos o credenciales obtenidas).</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
              <div className="text-amber-500 font-bold font-mono w-40 shrink-0">Errores / Fallos</div>
              <div className="text-slate-700 dark:text-slate-300">Conexiones rechazadas, timeouts de red o peticiones bloqueadas de forma preventiva por cortafuegos/WAF.</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
              <div className="text-sky-500 font-bold font-mono w-40 shrink-0">Total Procesado</div>
              <div className="text-slate-700 dark:text-slate-300">Volumen total de sondas, peticiones HTTP o paquetes enviados acumulados a lo largo del test.</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
              <div className="text-emerald-500 font-bold font-mono w-40 shrink-0">Traducción de Logs</div>
              <div className="text-slate-700 dark:text-slate-300">Función en tiempo real que convierte las salidas en inglés técnico o formato crudo CLI a descripciones comprensibles en español.</div>
            </div>
          </div>
        </div>

      </div>
    )
  },
  {
    id: "modules",
    title: "Módulos Especializados",
    subtitle: "Catálogo completo de pruebas soportadas",
    icon: Layers,
    badge: "Suite Completa",
    content: () => (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"><Radio className="h-5 w-5" /></div>
              <h4 className="font-bold text-slate-900 dark:text-white text-md">Pruebas WebSocket</h4>
            </div>
            <p className="text-md text-slate-600 dark:text-slate-400">
              Evalúa comunicaciones bidireccionales en tiempo real. Mide throttling delays, pérdida de mensajes por segundo y estabilidad de sockets activos.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><Database className="h-5 w-5" /></div>
              <h4 className="font-bold text-slate-900 dark:text-white text-md">Pruebas de Base de Datos</h4>
            </div>
            <p className="text-md text-slate-600 dark:text-slate-400">
              Ejecuta benchmarks directos de operaciones CRUD en PostgreSQL y MongoDB. Mide tiempos de respuesta en consultas bajo alta concurrencia.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"><Zap className="h-5 w-5" /></div>
              <h4 className="font-bold text-slate-900 dark:text-white text-md">Pruebas de Caché</h4>
            </div>
            <p className="text-md text-slate-600 dark:text-slate-400">
              Valida la eficiencia de sistemas Redis y Memcached calculando la tasa de Hit Rate vs. Miss Rate e impacto en el throughput.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"><Network className="h-5 w-5" /></div>
              <h4 className="font-bold text-slate-900 dark:text-white text-md">Red Avanzada</h4>
            </div>
            <p className="text-md text-slate-600 dark:text-slate-400">
              Diagnostica métricas de capa de red como Jitter (variabilidad de latencia), pérdida de paquetes y comportamiento de rutas.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"><Lock className="h-5 w-5" /></div>
              <h4 className="font-bold text-slate-900 dark:text-white text-md">Seguridad & WAF</h4>
            </div>
            <p className="text-md text-slate-600 dark:text-slate-400">
              Simula ataques comunes y fuzzing para medir la capacidad de mitigación del Firewall de Aplicaciones Web (WAF) y rate limiters.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400"><HardDrive className="h-5 w-5" /></div>
              <h4 className="font-bold text-slate-900 dark:text-white text-md">E/S de Archivos</h4>
            </div>
            <p className="text-md text-slate-600 dark:text-slate-400">
              Evalúa las velocidades de transferencia, lectura/escritura en disco y subida masiva de archivos bajo carga.
            </p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "logs",
    title: "Logs y Diagnóstico",
    subtitle: "Interpretación de consolas y resolución de fallos de prueba",
    icon: Terminal,
    badge: "Debugging",
    content: () => (
      <div className="space-y-6">
        <p className="text-slate-600 dark:text-slate-300 text-base">
          El sistema captura en tiempo real la salida <code className="text-cyan-700 dark:text-cyan-400 bg-slate-100 dark:bg-cyan-950/40 px-1 py-0.5 rounded font-mono">STDOUT/STDERR</code> emitida por el contenedor Docker activo.
        </p>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Códigos de Error Frecuentes</h3>

        <div className="space-y-3 font-mono text-md">
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/20 text-slate-700 dark:text-slate-300">
            <span className="text-rose-600 dark:text-rose-400 font-bold">ETIMEDOUT / ECONNRESET</span>
            <p className="text-slate-500 dark:text-slate-400 mt-1">El servidor de destino colapsó o no respondió dentro del socket timeout. Indica sobrecarga completa del target.</p>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/20 text-slate-700 dark:text-slate-300">
            <span className="text-amber-600 dark:text-amber-400 font-bold">ECONNREFUSED</span>
            <p className="text-slate-500 dark:text-slate-400 mt-1">No hay ningún servicio escuchando en el puerto u host especificado. Revisa si la URL `localhost` apunta correctamente desde dentro de Docker.</p>
          </div>

          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-500/20 text-slate-700 dark:text-slate-300">
            <span className="text-blue-600 dark:text-blue-400 font-bold">Parser Execution Error</span>
            <p className="text-slate-500 dark:text-slate-400 mt-1">El motor de test generó un formato no esperado por el regex o parser JSON de StressForge. Consulta la consola de logs crudos.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "reports",
    title: "Exportación de Reportes",
    subtitle: "Generación de documentación ejecutiva y técnica",
    icon: FileUp,
    badge: "Reporting Engine",
    content: () => (
      <div className="space-y-6">
        <p className="text-slate-600 dark:text-slate-300 text-base">
          Genera reportes profesionales para compartir los hallazgos con clientes, líderes técnicos o equipos de desarrollo.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-cyan-200 dark:border-cyan-500/30">
            <h4 className="text-cyan-700 dark:text-cyan-400 font-bold text-base mb-2">Reporte Ejecutivo (PDF)</h4>
            <p className="text-md text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Diseñado para Directores Técnicos y Stakeholders. Resume el veredicto general (Éxito/Fallo), Latencia P50/P95, SLA alcanzado y gráficos de distribución sin sobrecargar de logs.
            </p>
            <div className="text-[11px] font-mono text-slate-500">Formato: PDF / Presentación limpia</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-blue-200 dark:border-blue-500/30">
            <h4 className="text-blue-700 dark:text-blue-400 font-bold text-base mb-2">Reporte Técnico & CSV</h4>
            <p className="text-md text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Exportación exhaustiva con dataset completo de cada petición. Incluye trazas de error, headers enviados, payloads y tiempos exactos por milisegundo para análisis en Excel o Python.
            </p>
            <div className="text-[11px] font-mono text-slate-500">Formato: CSV / JSON / PDF Detallado</div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "troubleshooting",
    title: "Solución de Problemas",
    subtitle: "Guía de resolución rápida para incidentes comunes",
    icon: ShieldCheck,
    badge: "Support",
    content: () => (
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-md mb-1">
              <AlertCircle className="h-4 w-4" /> La prueba no inicia o se queda "En Espera"
            </div>
            <p className="text-md text-slate-600 dark:text-slate-400 pl-6">
              Asegúrate de que el daemon de Docker esté corriendo y que el usuario tenga permisos para ejecutar <code className="text-slate-800 dark:text-slate-200 font-mono">docker exec</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-md mb-1">
              <AlertCircle className="h-4 w-4" /> Los gráficos no se actualizan en tiempo real
            </div>
            <p className="text-md text-slate-600 dark:text-slate-400 pl-6">
              Verifica la conexión del WebSocket en la barra superior. Si aparece desinterrumpido, refresca la página para forzar el re-handshake con el backend en <code className="text-slate-800 dark:text-slate-200 font-mono">ws://localhost:8080</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-semibold text-md mb-1">
              <AlertCircle className="h-4 w-4" /> "Permiso denegado" al guardar reportes
            </div>
            <p className="text-md text-slate-600 dark:text-slate-400 pl-6">
              Ejecuta <code className="text-cyan-700 dark:text-cyan-300 font-mono">chmod -R 777 backend/results</code> para asegurar que el contenedor pueda escribir los PDFs generados.
            </p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "extend",
    title: "Añadir Nuevas Herramientas",
    subtitle: "Guía para desarrolladores: Extiende StressForge",
    icon: Code2,
    badge: "Extensibility",
    content: () => (
      <div className="space-y-6">
        <p className="text-slate-600 dark:text-slate-300 text-base">
          Puedes integrar cualquier nueva herramienta CLI de benchmarks siguiendo nuestra arquitectura de tres pasos:
        </p>

        <div className="space-y-3 text-xs">
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono">
            <div className="text-cyan-700 dark:text-cyan-400 font-bold mb-1">1. Backend Parser (backend/src/metrics/mytool.parser.ts)</div>
            <p className="text-slate-600 dark:text-slate-400">Crea una función que convierta el log plano o JSON generado por tu CLI al contrato estandarizado <code className="text-amber-600 dark:text-amber-300">ToolMetrics</code>.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono">
            <div className="text-blue-700 dark:text-blue-400 font-bold mb-1">2. Docker Runner (backend/test-runner.sh)</div>
            <p className="text-slate-600 dark:text-slate-400">Añade el bloque <code className="text-emerald-600 dark:text-emerald-300">case "$TOOL" in</code> para mapear las banderas CLI (concurrencia, duración, URL).</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono">
            <div className="text-purple-700 dark:text-purple-400 font-bold mb-1">3. Frontend Schema (frontend/src/lib/tool-schemas.ts)</div>
            <p className="text-slate-600 dark:text-slate-400">Define las opciones configurables para que la interfaz renderice dinámicamente sus inputs.</p>
          </div>
        </div>
      </div>
    )
  }
];

export default function DocumentationPage() {
  const sections = getSections();
  const [activeTab, setActiveTab] = useState(sections[0].id);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);

  const activeSection = sections.find((s) => s.id === activeTab) || sections[0];
  const selectedTool = selectedToolId ? TOOL_DETAILS[selectedToolId] : null;

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-[#070A11] text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-200 relative">

      {/* SIDEBAR DE NAVEGACIÓN */}
      <aside className="w-80 border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0B0F19]/90 flex flex-col p-4 shrink-0 backdrop-blur-md">

        {/* Encabezado Sidebar */}
        <div className="px-3 py-4 border-b border-slate-200 dark:border-slate-800/60 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide text-slate-900 dark:text-white uppercase">
                Documentación
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                StressForge v2.4
              </p>
            </div>
          </div>
        </div>

        {/* Lista de Botones */}
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
            Módulos y Guías
          </div>
          {sections.map((s) => {
            const Icon = s.icon;
            const isActive = activeTab === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveTab(s.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-md font-medium transition-all duration-200 text-left ${isActive
                  ? "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30 shadow-sm dark:shadow-cyan-950/20 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40"
                  }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-cyan-600 dark:text-cyan-400" : "text-slate-400 dark:text-slate-500"}`} />
                <span className="truncate">{s.title}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer del Sidebar */}
        <div className="p-3 mt-auto rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/60 text-[11px] text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2 mb-1 text-slate-800 dark:text-slate-300 font-semibold">
            <HelpCircle className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" /> ¿Necesitas ayuda?
          </div>
          Revisa los logs del servidor Docker para más detalle de fallas.
        </div>
      </aside>

      {/* ÁREA PRINCIPAL DE CONTENIDO */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-slate-100 dark:bg-[#070A11] p-8">

        <div className="mx-auto w-full space-y-6">

          {/* HEADER DE LA SECCIÓN ACTIVA */}
          <div className="relative overflow-hidden p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl">

            {/* Luces decorativas de fondo */}
            <div className="absolute -right-10 -top-10 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start md:items-center gap-5">

                <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 shrink-0 shadow-inner">
                  {(() => {
                    const Icon = activeSection.icon;
                    return <Icon className="h-4 w-4" />;
                  })()}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-sm sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
                      {activeSection.title}
                    </h1>

                    {activeSection.badge && (
                      <span className="px-3 py-1 rounded-full text-md font-mono bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 font-bold tracking-wide">
                        {activeSection.badge}
                      </span>
                    )}
                  </div>

                  <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                    {activeSection.subtitle}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cuerpo del Contenido */}
          <div className="p-8 rounded-2xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl">
            {activeSection.content(setSelectedToolId)}
          </div>

        </div>
      </main>

      {/* MODAL AMPLIADO Y AUMENTADO DE HERRAMIENTA */}
      {selectedTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F172A] p-8 sm:p-10 shadow-2xl space-y-7 my-8 max-h-[92vh] overflow-y-auto">
            {/* Header Modal Ampliado */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/90 ${selectedTool.color} shadow-inner`}>
                  <selectedTool.icon className="h-8 w-8" />
                </div>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">{selectedTool.name}</h2>
                    <span className={`px-3.5 py-1 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider border ${selectedTool.badgeColor}`}>
                      {selectedTool.category}
                    </span>
                  </div>
                  <p className="text-sm font-mono text-slate-500 dark:text-slate-400 mt-1">
                    Lenguaje / Stack: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedTool.language}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedToolId(null)}
                className="rounded-2xl p-2.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Descripción y Propósito Aumentados */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Descripción</h4>
                <p className="text-base sm:text-lg text-slate-700 dark:text-slate-200 leading-relaxed font-medium">{selectedTool.description}</p>
              </div>
              <div className="p-5 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-950 dark:text-sky-100 text-sm sm:text-base leading-relaxed">
                <strong className="font-bold text-sky-600 dark:text-sky-400">¿Para qué sirve?:</strong> {selectedTool.purpose}
              </div>
            </div>

            {/* Ejemplo de Comando CLI Aumentado */}
            <div>
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-2">
                <Terminal className="h-4 w-4 text-sky-500" /> Ejemplo de Comando CLI
              </h4>
              <div className="rounded-2xl bg-slate-950 p-4 font-mono text-sm sm:text-base text-emerald-400 overflow-x-auto border border-slate-800 shadow-inner">
                <code>{selectedTool.commandExample}</code>
              </div>
            </div>

            {/* Casos de Uso Recomendados Aumentados */}
            <div>
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Casos de Uso Recomendados</h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedTool.recommendedCases.map((c, i) => (
                  <li key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-sm sm:text-base text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="font-medium">{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Parámetros Configurables Aumentados */}
            <div>
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Parámetros Clave</h4>
              <div className="grid grid-cols-1 gap-2.5">
                {selectedTool.parameters.map((p, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-sm sm:text-base">
                    <span className="font-mono font-bold text-sky-600 dark:text-sky-400 shrink-0">{p.name}:</span>
                    <span className="text-slate-600 dark:text-slate-300">{p.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Puntos Fuertes Aumentados */}
            <div>
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Puntos Fuertes</h4>
              <div className="flex flex-wrap gap-2.5">
                {selectedTool.pros.map((pro, i) => (
                  <span key={i} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm sm:text-base font-semibold border border-slate-200 dark:border-slate-700 shadow-sm">
                    ⚡ {pro}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer Modal Aumentado */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedToolId(null)}
                className="px-8 py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white text-sm sm:text-base font-bold shadow-md transition"
              >
                Cerrar Modal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
