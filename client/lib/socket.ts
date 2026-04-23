import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocketUrl(): string {
  const envUrl =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_SOCKET_URL
      : undefined;
  if (envUrl) return envUrl;
  if (typeof window !== "undefined") {
    // 로컬 개발 기본값
    return `http://${window.location.hostname}:4000`;
  }
  return "http://localhost:4000";
}

export function getSocket(): Socket {
  if (socket && socket.connected) return socket;
  if (socket) {
    socket.connect();
    return socket;
  }
  socket = io(getSocketUrl(), {
    transports: ["websocket", "polling"],
    autoConnect: true,
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
