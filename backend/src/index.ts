import express from "express";
import http from "http";
import SocketService from "./services/socket";

const app = express();

const httpServer = http.createServer(app);

async function init() {
  const socketService = new SocketService();

  const PORT = process.env.port ? process.env.port : 8000;

  socketService.io.attach(httpServer);

  httpServer.listen(PORT, () => console.log("Backend is listening"));

  socketService.initListeners();
}

init();
