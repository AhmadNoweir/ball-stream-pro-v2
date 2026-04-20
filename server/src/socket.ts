import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { allowedOrigins } from "./config";

// Track online users: userId -> socketId
export const onlineUsers = new Map<string, string>();

export function setupSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  // Authenticate socket connections via JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("No token"));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    onlineUsers.set(userId, socket.id);

    // Tell everyone this user came online
    io.emit("user:online", { userId, online: true });

    // Real-time message forwarding
    socket.on("message:send", (data: { receiverId: string; message: any }) => {
      const receiverSocketId = onlineUsers.get(data.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("message:receive", data.message);
      }
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      io.emit("user:online", { userId, online: false });
    });
  });

  return io;
}
