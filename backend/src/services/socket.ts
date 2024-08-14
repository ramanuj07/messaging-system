import { Server, Socket } from "socket.io";
import { db } from "../db/db";
import { messages, users } from "../db/schema";
import { eq, and, lt, desc } from "drizzle-orm";

interface User {
  id: string;
  username: string;
}

interface Message {
  id: string | number;
  senderId: string | number;
  recipientId: string | number;
  content: string;
  timestamp: Date;
  read: boolean;
  fileUrl?: string;
  fileType?: "image" | "video";
}

class SocketService {
  private _io: Server;
  private connectedUsers: Map<string, User> = new Map();

  constructor() {
    console.log("Initialised socket server");
    this._io = new Server({
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });
  }

  public initListeners() {
    const io = this._io;
    console.log("Initialised socket listeners");

    io.on("connection", (socket: Socket) => {
      console.log("New socket connected", socket.id);

      socket.on("user:join", (user: User) => {
        this.connectedUsers.set(socket.id, user);
        this.updateOnlineUsers();
        console.log(`User joined: ${user.username}`);
      });

      socket.on("disconnect", () => {
        this.connectedUsers.delete(socket.id);
        this.updateOnlineUsers();
        console.log(`User disconnected: ${socket.id}`);
      });

      socket.on("chat:message", async (message: Message) => {
        console.log("New message received", message);
        const savedMessage = await this.saveMessage(message);
        if (savedMessage) {
          this.sendMessage(savedMessage);
        }
      });

      socket.on("chat:typing", ({ senderId, recipientId }) => {
        socket.to(recipientId).emit("chat:typing", { senderId });
      });

      socket.on("chat:stopTyping", ({ senderId, recipientId }) => {
        socket.to(recipientId).emit("chat:stopTyping", { senderId });
      });

      socket.on("message:read", async ({ messageId, recipientId }) => {
        const updatedMessage = await this.markMessageAsRead(messageId);
        if (updatedMessage) {
          io.to(recipientId).emit("message:read", { messageId });
        }
      });

      socket.on(
        "messages:get",
        async ({ userId, recipientId, lastMessageId }) => {
          const olderMessages = await this.getOlderMessages(
            userId,
            recipientId,
            lastMessageId
          );
          socket.emit("messages:older", olderMessages);
        }
      );
    });
  }

  private updateOnlineUsers() {
    const onlineUsers = Array.from(this.connectedUsers.values());
    this._io.emit("users:online", onlineUsers);
  }

  private async saveMessage(message: Message) {
    try {
      const [savedMessage] = await db
        .insert(messages)
        .values({
          senderId:
            typeof message.senderId === "string"
              ? parseInt(message.senderId)
              : message.senderId,
          recipientId:
            typeof message.recipientId === "string"
              ? parseInt(message.recipientId)
              : message.recipientId,
          content: message.content,
          timestamp: message.timestamp,
          read: message.read,
          fileUrl: message.fileUrl,
          fileType: message.fileType,
        })
        .returning();
      console.log("Message saved to database", savedMessage);
      return {
        ...savedMessage,
        id: savedMessage.id.toString(),
        senderId: savedMessage.senderId.toString(),
        recipientId: savedMessage.recipientId.toString(),
      };
    } catch (error) {
      console.error("Error saving message to database", error);
      return null;
    }
  }

  private sendMessage(message: Message) {
    const recipientId =
      typeof message.recipientId === "number"
        ? message.recipientId.toString()
        : message.recipientId;
    this._io.to(recipientId).emit("chat:message", message);
  }

  private async markMessageAsRead(messageId: string | number) {
    try {
      const [updatedMessage] = await db
        .update(messages)
        .set({ read: true })
        .where(
          eq(
            messages.id,
            typeof messageId === "string" ? parseInt(messageId) : messageId
          )
        )
        .returning();
      console.log("Message marked as read", updatedMessage);

      return {
        ...updatedMessage,
        id: updatedMessage.id.toString(),
        senderId: updatedMessage.senderId.toString(),
        recipientId: updatedMessage.recipientId.toString(),
      };
    } catch (error) {
      console.error("Error marking message as read", error);
      return null;
    }
  }

  private async getOlderMessages(
    userId: string | number,
    recipientId: string | number,
    lastMessageId: string | number | null,
    limit: number = 20
  ) {
    try {
      const baseQuery = {
        senderId: typeof userId === "string" ? parseInt(userId) : userId,
        recipientId:
          typeof recipientId === "string" ? parseInt(recipientId) : recipientId,
      };

      let query = db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.senderId, baseQuery.senderId),
            eq(messages.recipientId, baseQuery.recipientId)
          )
        )
        .orderBy(desc(messages.timestamp))
        .limit(limit);

      if (lastMessageId) {
        const lastId =
          typeof lastMessageId === "string"
            ? parseInt(lastMessageId)
            : lastMessageId;
        query = query.where(lt(messages.id, lastId));
      }

      const olderMessages = await query;

      return olderMessages.map((msg) => ({
        ...msg,
        id: msg.id.toString(),
        senderId: msg.senderId.toString(),
        recipientId: msg.recipientId.toString(),
      }));
    } catch (error) {
      console.error("Error fetching older messages", error);
      return [];
    }
  }

  get io() {
    return this._io;
  }
}

export default SocketService;
