import React, { useCallback, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface User {
  id: string;
  username: string;
}

interface SocketProviderProps {
  children?: React.ReactNode;
}

interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: string;
  read: boolean;
  fileUrl?: string | null;
  fileType?: "image" | "video" | null;
}

interface ISocketContext {
  sendMessage: (msg: Omit<Message, "id" | "timestamp" | "read">) => void;
  messages: Message[];
  users: User[];
  currentUser: User | null;
  login: (user: User) => void;
  readMessages: Set<string>;
  markMessageAsRead: (messageId: string, recipientId: string) => void;
}

const SocketContext = React.createContext<ISocketContext | null>(null);

export const useSocket = () => {
  const state = useContext(SocketContext);
  if (!state) throw new Error(`Socket context is undefined`);
  return state;
};

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [readMessages, setReadMessages] = useState<Set<string>>(new Set());

  const sendMessage: ISocketContext["sendMessage"] = useCallback(
    (msg) => {
      if (socket) {
        socket.emit("chat:message", msg);
      }
    },
    [socket]
  );

  const onMessageReceived = useCallback((msg: Message) => {
    setMessages((prev) => {
      // Check if the message already exists
      const exists = prev.some((m) => m.id === msg.id);
      if (!exists) {
        return [...prev, msg];
      }
      return prev;
    });
  }, []);

  const onMessageRead = useCallback((data: { messageId: string }) => {
    setReadMessages((prev) => new Set(prev).add(data.messageId));
  }, []);

  const markMessageAsRead = useCallback(
    (messageId: string, recipientId: string) => {
      if (socket) {
        socket.emit("message:read", { messageId, recipientId });
      }
    },
    [socket]
  );

  const login = useCallback(
    (user: User) => {
      setCurrentUser(user);
      if (socket) {
        socket.emit("user:join", user);
      }
    },
    [socket]
  );

  const onUserLoggedIn = useCallback((newUser: User) => {
    setUsers((prevUsers) => {
      if (!prevUsers.some((user) => user.id === newUser.id)) {
        return [...prevUsers, newUser];
      }
      return prevUsers;
    });
  }, []);

  const onNewUser = useCallback((newUser: User) => {
    setUsers((prevUsers) => {
      if (!prevUsers.some((user) => user.id === newUser.id)) {
        return [...prevUsers, newUser];
      }
      return prevUsers;
    });
  }, []);

  useEffect(() => {
    const _socket = io("http://localhost:8000");
    _socket.on("chat:message", onMessageReceived);
    _socket.on("user:loggedIn", onUserLoggedIn);
    _socket.on("user:new", onNewUser);
    _socket.on("message:read", onMessageRead);

    setSocket(_socket);

    return () => {
      _socket.off("chat:message", onMessageReceived);
      _socket.off("user:loggedIn", onUserLoggedIn);
      _socket.off("user:new", onNewUser);
      _socket.off("message:read", onMessageRead);
      _socket.disconnect();
    };
  }, [onMessageReceived, onUserLoggedIn, onNewUser, onMessageRead]);

  return (
    <SocketContext.Provider
      value={{
        sendMessage,
        messages,
        users,
        currentUser,
        login,
        readMessages,
        markMessageAsRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
