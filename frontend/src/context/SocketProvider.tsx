import React, { useCallback, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketProviderProps {
  children?: React.ReactNode;
}

interface ServerMessage {
  id: number;
  senderId: number;
  recipientId: number;
  content: string;
  timestamp: string;
  read: boolean;
  fileUrl?: string | null;
  fileType?: "image" | "video" | null;
}

interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  text: string;
  timestamp: Date;
  read: boolean;
  fileUrl?: string | null;
  fileType?: "image" | "video" | null;
}

interface ISocketContext {
  sendMessage: (msg: Omit<Message, "id" | "timestamp" | "read">) => void;
  messages: Message[];
}

const SocketContext = React.createContext<ISocketContext | null>(null);

export const useSocket = () => {
  const state = useContext(SocketContext);
  if (!state) throw new Error(`state is undefined`);
  return state;
};

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket>();
  const [messages, setMessages] = useState<Message[]>([]);

  const sendMessage: ISocketContext["sendMessage"] = useCallback(
    (msg) => {
      if (socket) {
        const newMessage: Message = {
          id: Date.now().toString(),
          timestamp: new Date(),
          read: false,
          ...msg,
        };
        const messageToSend: ServerMessage = {
          id: parseInt(newMessage.id),
          senderId: parseInt(newMessage.senderId),
          recipientId: parseInt(newMessage.recipientId),
          content: newMessage.text, // Convert 'text' to 'content' for the server
          timestamp: newMessage.timestamp.toISOString(),
          read: newMessage.read,
          fileUrl: newMessage.fileUrl,
          fileType: newMessage.fileType,
        };
        socket.emit("chat:message", messageToSend);
        setMessages((prev) => [...prev, newMessage]);
      }
    },
    [socket]
  );

  const onMessageReceived = useCallback((msg: ServerMessage) => {
    const receivedMessage: Message = {
      id: msg.id.toString(),
      senderId: msg.senderId.toString(),
      recipientId: msg.recipientId.toString(),
      text: msg.content,
      timestamp: new Date(msg.timestamp),
      read: msg.read,
      fileUrl: msg.fileUrl,
      fileType: msg.fileType,
    };
    setMessages((prev) => [...prev, receivedMessage]);
  }, []);

  useEffect(() => {
    const _socket = io("http://localhost:8000");
    _socket.on("chat:message", onMessageReceived);

    setSocket(_socket);

    return () => {
      _socket.off("chat:message", onMessageReceived);
      _socket.disconnect();
      setSocket(undefined);
    };
  }, [onMessageReceived]);

  return (
    <SocketContext.Provider value={{ sendMessage, messages }}>
      {children}
    </SocketContext.Provider>
  );
};
