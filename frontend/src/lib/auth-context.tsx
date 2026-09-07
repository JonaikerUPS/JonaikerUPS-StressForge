"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";

interface AuthContextType {
  isAuthenticated: boolean;
  user: { username: string; userId: string; token: string } | null;
  login: (data: { username: string; userId: string; token: string }) => void;
  logout: () => void;
  initialized: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("admin-auth");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem("admin-auth");
      }
    }
    setInitialized(true);
  }, []);

  const login = useCallback((data: AuthContextType['user']) => {
    localStorage.setItem("admin-auth", JSON.stringify(data));
    setUser(data);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("admin-auth");
    setUser(null);
    setIsAuthenticated(false);
    router.push("/login");
  }, [router]);

  useEffect(() => {
    // 1. Listen for API-triggered unauthorized
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);

    // 2. Proactive expiration check
    const checkToken = () => {
      const stored = localStorage.getItem("admin-auth");
      if (stored) {
        try {
          const { token } = JSON.parse(stored);
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            console.log("[DEBUG] Token expired, logging out...");
            logout();
          }
        } catch (e) {
          console.error("[DEBUG] Error checking token expiration:", e);
        }
      }
    };
    
    // Check initially and then every 30 seconds
    checkToken();
    const interval = setInterval(checkToken, 30000);

    return () => {
        window.removeEventListener("auth:unauthorized", handleUnauthorized);
        clearInterval(interval);
    };
  }, [logout]);

  if (!initialized) return null;

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, initialized }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
