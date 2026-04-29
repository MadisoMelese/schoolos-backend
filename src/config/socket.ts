import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import env from "./env.js";

interface UserSocket extends Socket {
  userId?: string;
  userRole?: string;
}

let io: SocketIOServer;

export const initializeSocketIO = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const allowedOrigins = env.clientUrl
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean);
        const isVercelPreview = /^https:\/\/[a-z0-9-]+-[a-z0-9]+-[a-z0-9]+\.vercel\.app$/.test(origin);
        if (allowedOrigins.includes(origin) || isVercelPreview) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Authentication middleware
  io.use((socket: UserSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      const decoded = jwt.verify(token, env.jwtAccessSecret, {
        issuer: "authforge",
        audience: "authforge-users",
      }) as { sub: string; role: string };
      socket.userId = decoded.sub;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket: UserSocket) => {
    console.log(`✅ User connected: ${socket.userId} (${socket.userRole})`);

    // Join user to their personal room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
      socket.join(`role:${socket.userRole}`);
    }

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.userId}`);
    });

    // Handle typing indicators
    socket.on("typing:start", (data: { receiverId: string }) => {
      socket.to(`user:${data.receiverId}`).emit("typing:start", {
        senderId: socket.userId,
      });
    });

    socket.on("typing:stop", (data: { receiverId: string }) => {
      socket.to(`user:${data.receiverId}`).emit("typing:stop", {
        senderId: socket.userId,
      });
    });

    // Handle mark as read
    socket.on("message:read", (data: { messageId: string }) => {
      // Emit to sender that message was read
      socket.broadcast.emit("message:read", {
        messageId: data.messageId,
        readBy: socket.userId,
        readAt: new Date(),
      });
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
};

// Emit new message notification
export const emitNewMessage = (receiverId: string, message: any) => {
  if (io) {
    io.to(`user:${receiverId}`).emit("message:new", message);
    io.to(`user:${receiverId}`).emit("notification:new", {
      type: "message",
      title: "New Message",
      message: `You have a new message from ${message.senderId?.firstname || "Unknown"}`,
      data: message,
      createdAt: new Date(),
    });
  }
};

// Emit notification
export const emitNotification = (userId: string, notification: any) => {
  if (io) {
    io.to(`user:${userId}`).emit("notification:new", notification);
  }
};

// Emit to all users with specific role
export const emitToRole = (role: string, event: string, data: any) => {
  if (io) {
    io.to(`role:${role}`).emit(event, data);
  }
};

// Emit unread count update
export const emitUnreadCountUpdate = (userId: string, count: number) => {
  if (io) {
    io.to(`user:${userId}`).emit("message:unread-count", { count });
  }
};

export default io!;
