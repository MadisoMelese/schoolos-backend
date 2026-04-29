import { createServer } from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import env from "./config/env.js";
import { initializeSocketIO } from "./config/socket.js";

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    const httpServer = createServer(app);
    
    // Initialize Socket.IO
    initializeSocketIO(httpServer);

    httpServer.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
      console.log(`Socket.IO server initialized`);
    });
  } catch (error) {
    console.error(
      "❌ Server failed to start:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
};

startServer();