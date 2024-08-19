import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { debounce } from "lodash";
import axios from "axios";
const BACKEND_API_BASE_URL = import.meta.env.BACKEND_API_BASE_URL;

interface User {
  id: string;
  username: string;
  token: string;
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
  sendFile: (
    file: File,
    fileName: string,
    fileType: "image" | "video",
    recipientId: string
  ) => void;
  messages: Message[];
  users: User[];
  currentUser: User | null;
  login: (user: User) => void;
  readMessages: Set<string>;
  markMessageAsRead: (messageId: string, recipientId: string) => void;
  emitTyping: (recipientId: string) => void;
  emitStopTyping: (recipientId: string) => void;
  isUserOnline: (userId: string) => boolean;
  isUserTyping: (userId: string) => boolean;
  fetchChatMessages: (otherUserId: string) => Promise<void>;
}

const SocketContext = React.createContext<ISocketContext | null>(null);

export const useSocket = () => {
  const state = useContext(SocketContext);
  if (!state) throw new Error(`Socket context is undefined`);
  return state;
};

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [socket, setSocket] = useState<Socket>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [readMessages, setReadMessages] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, boolean>>(
    new Map()
  );

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setCurrentUser(parsedUser);
    }
  }, []);

  const isUserOnline = useCallback(
    (userId: string) => onlineUsers.has(userId),
    [onlineUsers]
  );

  const sendMessage = useCallback(
    (msg: Omit<Message, "id" | "timestamp" | "read">) => {
      socket?.emit("chat:message", msg);
    },
    [socket]
  );

  const sendFile = useCallback(
    (
      file: File,
      fileName: string,
      fileType: "image" | "video",
      recipientId: string
    ) => {
      if (socket && currentUser) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const buffer = event.target?.result as ArrayBuffer;
          socket.emit("chat:file", {
            file: buffer,
            fileName,
            fileType,
            senderId: currentUser.id,
            recipientId,
          });
        };
        reader.readAsArrayBuffer(file);
      }
    },
    [socket, currentUser]
  );

  const isUserTyping = useCallback(
    (userId: string) => typingUsers.has(userId),
    [typingUsers]
  );

  const debouncedEmitTyping = useMemo(
    () =>
      debounce((recipientId: string) => {
        if (socket && currentUser) {
          socket.emit("chat:typing", { senderId: currentUser.id, recipientId });
        }
      }, 300),
    [socket, currentUser]
  );

  const emitTyping = useCallback(
    (recipientId: string) => {
      debouncedEmitTyping(recipientId);
    },
    [debouncedEmitTyping]
  );

  const emitStopTyping = useCallback(
    (recipientId: string) => {
      if (socket && currentUser) {
        socket.emit("chat:stopTyping", {
          senderId: currentUser.id,
          recipientId,
        });
      }
    },
    [socket, currentUser]
  );

  const onTypingStarted = useCallback(({ senderId }: { senderId: string }) => {
    setTypingUsers((prev) => new Map(prev).set(senderId, true));
  }, []);

  const onTypingStopped = useCallback(({ senderId }: { senderId: string }) => {
    setTypingUsers((prev) => {
      const newMap = new Map(prev);
      newMap.delete(senderId);
      return newMap;
    });
  }, []);

  const onMessageReceived = useCallback((msg: Message) => {
    setMessages((prev) => {
      if (!prev.some((m) => m.id === msg.id)) {
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
      socket?.emit("message:read", { messageId, recipientId });
    },
    [socket]
  );

  const fetchChatMessages = useCallback(
    async (otherUserId: string) => {
      if (currentUser) {
        try {
          const response = await axios.get(
            `http://localhost:8000/messages/${currentUser.id}/${otherUserId}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          setMessages((prevMessages) => [...prevMessages, ...response.data]);
        } catch (error) {
          console.error("Failed to fetch chat messages:", error);
        }
      }
    },
    [currentUser]
  );

  const login = useCallback(
    (user: User) => {
      setCurrentUser(user);
      socket?.emit("user:join", user);
      localStorage.setItem("currentUser", JSON.stringify(user));
      localStorage.setItem("token", user.token);
    },
    [socket]
  );

  const validateToken = useCallback(async () => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("currentUser");

    if (token && storedUser) {
      try {
        const response = await axios.get(
          `${BACKEND_API_BASE_URL}/auth/validate-token`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.data.valid) {
          const parsedUser = JSON.parse(storedUser);
          setCurrentUser(parsedUser);
          socket?.emit("user:join", parsedUser);
        } else {
          // Token is invalid, clear localStorage
          localStorage.removeItem("token");
          localStorage.removeItem("currentUser");
        }
      } catch (error) {
        console.error("Token validation failed:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("currentUser");
      }
    }
  }, [socket]);

  const onUserLoggedIn = useCallback((newUser: User) => {
    setUsers((prev) =>
      prev.some((user) => user.id === newUser.id) ? prev : [...prev, newUser]
    );
  }, []);

  const onNewUser = useCallback((newUser: User) => {
    setUsers((prev) =>
      prev.some((user) => user.id === newUser.id) ? prev : [...prev, newUser]
    );
  }, []);

  useEffect(() => {
    validateToken();
  }, [validateToken]);

  useEffect(() => {
    const _socket = io("http://localhost:8000");
    _socket.on("user:online", (userId: string) => {
      setOnlineUsers((prev) => new Set(prev).add(userId));
    });

    _socket.on("user:offline", (userId: string) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    _socket.on("users:online", (onlineUserIds: string[]) => {
      setOnlineUsers(new Set(onlineUserIds));
    });
    _socket.on("chat:message", onMessageReceived);
    _socket.on("user:loggedIn", onUserLoggedIn);
    _socket.on("user:new", onNewUser);
    _socket.on("message:read", onMessageRead);
    _socket.on("chat:typing", onTypingStarted);
    _socket.on("chat:stopTyping", onTypingStopped);

    setSocket(_socket);

    return () => {
      _socket.off("user:online");
      _socket.off("user:offline");
      _socket.off("chat:message", onMessageReceived);
      _socket.off("user:loggedIn", onUserLoggedIn);
      _socket.off("user:new", onNewUser);
      _socket.off("message:read", onMessageRead);
      _socket.off("chat:typing", onTypingStarted);
      _socket.off("chat:stopTyping", onTypingStopped);
      _socket.disconnect();
    };
  }, [
    onMessageReceived,
    onUserLoggedIn,
    onNewUser,
    onMessageRead,
    onTypingStarted,
    onTypingStopped,
  ]);

  const contextValue = useMemo(
    () => ({
      sendMessage,
      sendFile,
      messages,
      users,
      currentUser,
      login,
      readMessages,
      markMessageAsRead,
      emitTyping,
      emitStopTyping,
      isUserTyping,
      fetchChatMessages,
      isUserOnline,
    }),
    [
      sendMessage,
      sendFile,
      messages,
      users,
      currentUser,
      login,
      readMessages,
      markMessageAsRead,
      emitTyping,
      emitStopTyping,
      isUserTyping,
      fetchChatMessages,
      isUserOnline,
    ]
  );

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
