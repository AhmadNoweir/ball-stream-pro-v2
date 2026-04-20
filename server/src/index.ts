import express from "express";
import cors from "cors";
import { createServer } from "http";
import { setupSocket } from "./socket";
import { corsOptions, port } from "./config";
import authRoutes from "./auth";
import matchRoutes from "./matches";
import chatRoutes from "./chat";
import aiRoutes from "./ai";
import favouriteRoutes from "./favourites";

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/favourites", favouriteRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Socket.IO
setupSocket(httpServer);

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});
