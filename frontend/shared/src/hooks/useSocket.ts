import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket(url: string) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(url, { transports: ["websocket"] });
    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [url]);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler);
  }, []);

  const emit = useCallback((event: string, payload?: any) => {
    socketRef.current?.emit(event, payload);
  }, []);

  return { socket: socketRef.current, on, emit };
}