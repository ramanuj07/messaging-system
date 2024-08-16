import { Server, Socket } from "socket.io";
import { db } from "../db/db";
import { messages } from "../db/schema";
import { eq, and, lt, desc } from "drizzle-orm";

interface User {
  id: string;
  username: string;
}

interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: Date;
  read: boolean;
  fileUrl?: string | null;
  fileType?: "image" | "video" | null;
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

      socket.on(
        "message:read",
        async ({
          messageId,
          recipientId,
        }: {
          messageId: string;
          recipientId: string;
        }) => {
          const updatedMessage = await this.markMessageAsRead(messageId);
          if (updatedMessage) {
            io.to(recipientId).emit("message:read", { messageId });
          }
        }
      );

      socket.on(
        "messages:get",
        async ({
          userId,
          recipientId,
          lastMessageId,
        }: {
          userId: string;
          recipientId: string;
          lastMessageId: string | null;
        }) => {
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
          senderId: parseInt(message.senderId),
          recipientId: parseInt(message.recipientId),
          content: message.content,
          timestamp: message.timestamp,
          read: message.read,
          fileUrl: message.fileUrl || null,
          fileType: message.fileType || null,
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
    this._io.to(message.recipientId).emit("chat:message", message);
  }

  private async markMessageAsRead(messageId: string) {
    try {
      const [updatedMessage] = await db
        .update(messages)
        .set({ read: true })
        .where(eq(messages.id, parseInt(messageId)))
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
    userId: string,
    recipientId: string,
    lastMessageId: string | null,
    limit: number = 20
  ) {
    try {
      const baseQuery = {
        senderId: parseInt(userId),
        recipientId: parseInt(recipientId),
      };

      let conditions = and(
        eq(messages.senderId, baseQuery.senderId),
        eq(messages.recipientId, baseQuery.recipientId)
      );

      if (lastMessageId) {
        conditions = and(conditions, lt(messages.id, parseInt(lastMessageId)));
      }

      const query = db
        .select()
        .from(messages)
        .where(conditions)
        .orderBy(desc(messages.timestamp))
        .limit(limit);

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
