import type { Metadata } from "next";
import { LoadingProvider } from "@/lib/loading-context";
import { ErrorProvider } from "@/lib/error-context";
import { AuthProviderWrapper } from "./auth-provider";
import { ThemeProvider } from "@/lib/theme-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "StressForge — Panel de Pruebas de Estrés",
  description: "Panel profesional de pruebas de estrés con múltiples tecnologías: k6, Artillery, JMeter, Locust y más.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className="h-full antialiased"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        {/* Script bloqueante para evitar parpadeo y aplicar tema manual inmediatamente */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  // Forzar modo manual: si no hay preferencia, usar 'dark'
                  if (!theme) theme = 'dark';
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })()
            `,
          }}
        />
      </head>
      <body
        className="min-h-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthProviderWrapper>
            <LoadingProvider>
              <ErrorProvider>
                {children}
              </ErrorProvider>
            </LoadingProvider>
          </AuthProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
