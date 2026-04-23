import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

type ServerToClientEvents = {
  message: (msg: string) => void;
};

type ClientToServerEvents = {
  send: (msg: string) => void;
};

export function useSocket(
  url: string
): {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  sendMessage: (msg: string) => void;
} {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  useEffect(() => {
    const socket = io(url);
    socketRef.current = socket;

    // ⭐ CORRECT CLEANUP — return ONLY a function that disconnects
    return () => {
      socket.disconnect();
    };
  }, [url]);

  const sendMessage = useCallback((msg: string) => {
    socketRef.current?.emit("send", msg);
  }, []);

  return {
    socket: socketRef.current,
    sendMessage,
  };
}