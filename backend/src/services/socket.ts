import { Server } from "socket.io";

class SocketService {
  private _io: Server;

  constructor() {
    console.log("Initialised socket server");
    this._io = new Server();
  }

  public initListeners() {
    const io = this.io;
    console.log("Initialised socket listeners");

    io.on("connect", (socket) => {
      console.log("New socket connected", socket.id);

      socket.on("event:message", async ({ message }: { message: string }) => {
        console.log("New message received", message);
      });
    });
  }

  get io() {
    return this._io;
  }
}

export default SocketService;
