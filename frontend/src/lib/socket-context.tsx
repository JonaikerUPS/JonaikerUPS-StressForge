"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { getBackendUrl } from "./api-url";
import { useAuth } from "./auth-context";

const BACKEND_URL = getBackendUrl();

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user, initialized } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!initialized || !user?.token) {
      setSocket(null);
      return;
    }

    const backendUrl = getBackendUrl();
    
    const s = io(backendUrl, { 
        transports: ["websocket", "polling"], 
      auth: { token: user.token },
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
    });
    
    const handleConnect = () => setSocket(s);
    const handleDisconnect = () => setSocket(null);
    const handleConnectError = (err: Error) => {
        setSocket(null);
        console.warn("Socket connection attempt failed (retrying):", err.message);
    };

    s.on("connect", handleConnect);
    s.on("disconnect", handleDisconnect);
    s.on("connect_error", handleConnectError);

    return () => {
      s.off("connect", handleConnect);
      s.off("disconnect", handleDisconnect);
      s.off("connect_error", handleConnectError);
      s.disconnect();
    };
  }, [initialized, user?.token]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
