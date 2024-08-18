import { Server, Socket } from "socket.io";
import { db } from "../db/db";
import { messages } from "../db/schema";
import { eq, and, lt, desc } from "drizzle-orm";
import { S3 } from "aws-sdk";

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

interface FileUploadData {
  file: Buffer;
  fileName: string;
  fileType: "image" | "video";
  senderId: string;
  recipientId: string;
}

class SocketService {
  private _io: Server;
  private connectedUsers: Map<string, User> = new Map();
  private userSocketMap: Map<string, string> = new Map();
  private s3: S3;

  constructor() {
    console.log("Initialised socket server");
    this._io = new Server({
      cors: {
        allowedHeaders: ["*"],
        origin: "*",
      },
    });
    this.s3 = new S3({
      endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      region: "auto",
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_API_TOKEN!,
        secretAccessKey: process.env.CLOUDFLARE_R2_API_TOKEN!,
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
        this.userSocketMap.set(user.id, socket.id);
        this.updateOnlineUsers();
        socket.broadcast.emit("user:new", user);
        console.log(`User joined: ${user.username}`);
      });

      socket.on("disconnect", () => {
        const user = this.connectedUsers.get(socket.id);
        if (user) {
          this.userSocketMap.delete(user.id);
        }
        this.connectedUsers.delete(socket.id);
        this.updateOnlineUsers();
        console.log(`User disconnected: ${socket.id}`);
      });

      socket.on("chat:message", async (message: Message) => {
        console.log("New message received", message);
        try {
          const savedMessage = await this.saveMessage(message);
          if (savedMessage) {
            this.broadcastMessage(savedMessage);
          } else {
            socket.emit("error", "Failed to save message");
          }
        } catch (error) {
          console.error("Error in chat:message handler:", error);
          socket.emit(
            "error",
            "An error occurred while processing the message"
          );
        }
      });

      socket.on("chat:file", async (data: FileUploadData) => {
        try {
          const { file, fileName, fileType, senderId, recipientId } = data;

          // Save the file to Cloudflare R2
          const fileUrl = await this.saveFile(file, fileName, fileType);

          const message: Omit<Message, "id" | "timestamp" | "read"> = {
            senderId,
            recipientId,
            content: fileName,
            fileUrl,
            fileType,
          };

          const savedMessage = await this.saveMessage(message);
          if (savedMessage) {
            this.broadcastMessage(savedMessage);
          } else {
            socket.emit("error", "Failed to save file message");
          }
        } catch (error) {
          console.error("Error in chat:file handler:", error);
          socket.emit("error", "An error occurred while processing the file");
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

  public handleUserLogin(user: User) {
    this._io.emit("user:loggedIn", user);
    console.log(`User logged in: ${user.username}`);
  }

  public getAllConnectedUsers(): User[] {
    return Array.from(this.connectedUsers.values());
  }

  private async saveFile(
    file: Buffer,
    fileName: string,
    fileType: "image" | "video"
  ): Promise<string> {
    try {
      const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
      const fileKey = `${Date.now()}-${fileName}`;
      const contentType = fileType === "image" ? "image/jpeg" : "video/mp4";

      const params = {
        Bucket: bucketName,
        Key: fileKey,
        Body: file,
        ContentType: contentType,
      };

      const uploadResult = await this.s3.upload(params).promise();

      // Construct the public URL for the uploaded file
      const fileUrl = uploadResult.Location;

      console.log("File uploaded successfully:", fileUrl);
      return fileUrl;
    } catch (error) {
      console.error("Error uploading file to R2:", error);
      throw new Error("Failed to upload file");
    }
  }

  private updateOnlineUsers() {
    const onlineUsers = Array.from(this.connectedUsers.values());
    this._io.emit("users:online", onlineUsers);
  }

  private async saveMessage(
    message: Omit<Message, "id" | "timestamp" | "read">
  ): Promise<Message | null> {
    try {
      const [savedMessage] = await db
        .insert(messages)
        .values({
          senderId: parseInt(message.senderId),
          recipientId: parseInt(message.recipientId),
          content: message.content,
          fileUrl: message.fileUrl || null,
          fileType: message.fileType || null,
        })
        .returning();

      console.log("Message saved to database", savedMessage);

      return {
        id: savedMessage.id.toString(),
        senderId: savedMessage.senderId.toString(),
        recipientId: savedMessage.recipientId.toString(),
        content: savedMessage.content,
        timestamp: savedMessage.timestamp,
        read: savedMessage.read,
        fileUrl: savedMessage.fileUrl,
        fileType: savedMessage.fileType,
      };
    } catch (error) {
      console.error("Error saving message to database", error);
      return null;
    }
  }

  private broadcastMessage(message: Message) {
    // Send to sender
    const senderSocketId = this.userSocketMap.get(message.senderId);
    if (senderSocketId) {
      this._io.to(senderSocketId).emit("chat:message", message);
    }

    // Send to recipient
    const recipientSocketId = this.userSocketMap.get(message.recipientId);
    if (recipientSocketId) {
      this._io.to(recipientSocketId).emit("chat:message", message);
    }

    console.log(
      `Message broadcasted to sender ${message.senderId} and recipient ${message.recipientId}`
    );
  }

  private async markMessageAsRead(messageId: string) {
    try {
      const [updatedMessage] = await db
        .update(messages)
        .set({ read: true })
        .where(eq(messages.id, parseInt(messageId)))
        .returning();
      console.log("Message marked as read", updatedMessage);

      const senderSocketId = this.userSocketMap.get(
        updatedMessage.senderId.toString()
      );
      if (senderSocketId) {
        this._io
          .to(senderSocketId)
          .emit("message:read", { messageId: updatedMessage.id.toString() });
      }

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
