"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { getBackendUrl } from "./api-url";

const BACKEND_URL = getBackendUrl();

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const backendUrl = getBackendUrl();
    
    const s = io(backendUrl, { 
        transports: ["websocket", "polling"], 
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
    });
    
    s.on("connect_error", (err) => {
        console.warn("Socket connection attempt failed (retrying):", err.message);
    });

    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
