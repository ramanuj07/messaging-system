import express from "express";
import http from "http";
import SocketService from "./services/socket";
import authRoutes from "./routes/auth";
import cors from "cors";

async function init() {
  const app = express();
  const httpServer = http.createServer(app);

  const socketService = new SocketService();

  const PORT = process.env.port || 8000;

  app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    })
  );
  app.use(express.json());
  app.options("*", cors());
  app.use("/auth", authRoutes);

  socketService.io.attach(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`Backend is listening on port ${PORT}`);
  });

  socketService.initListeners();
}

init();
