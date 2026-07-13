import "dotenv/config";
import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { connectRedis } from "./config/redis.js";
import { initializeSocket } from "./config/socket.js";
import { initializeFirebase } from "./config/firebase.js";
import { configureCloudinary } from "./config/cloudinary.js";
import { seedDefaultSettings } from "./services/admin.service.js";
import { startScheduledJobs } from "./jobs/index.js";

const PORT = Number(process.env.PORT) || 5000;

async function bootstrap(): Promise<void> {
  await connectDB();
  await connectRedis();

  configureCloudinary();
  initializeFirebase();
  await seedDefaultSettings();

  const httpServer = http.createServer(app);
  initializeSocket(httpServer);
  startScheduledJobs();

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    httpServer.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
