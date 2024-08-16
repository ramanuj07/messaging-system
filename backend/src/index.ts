import express from "express";
import http from "http";
import SocketService from "./services/socket";

async function init() {
  const app = express();
  const httpServer = http.createServer(app);

  const socketService = new SocketService();

  const PORT = process.env.port || 8000;

  socketService.io.attach(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`Backend is listening on port ${PORT}`);
  });

  socketService.initListeners();
}

init();
