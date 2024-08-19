import express from "express";
import http from "http";
import SocketService from "./services/socket";
import authRoutes from "./routes/auth";
import cors from "cors";

const BASE_FRONTEND_URL = process.env.BASE_FRONTEND_URL as string;

async function init() {
  const app = express();
  const httpServer = http.createServer(app);

  const socketService = new SocketService();

  const PORT = process.env.port || 8000;

  app.use(
    cors({
      origin: `${BASE_FRONTEND_URL}`,
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
