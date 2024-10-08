import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import AttachmentIcon from "../assets/AttachmentIcon.png";
import SendIcon from "../assets/SendIcon.png";
import DefaultProfilePic from "../assets/DefaultProfilePic.jpg";
import { useSocket } from "../context/SocketProvider";
import SingleTick from "../assets/SingleTick.png";
import DoubleTick from "../assets/DoubleTick.png";

interface ChatMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: string;
  read: boolean;
  fileUrl?: string | null;
  fileType?: "image" | "video" | null;
}

interface ChatInterfaceProps {
  senderId: string;
  recipientId: string;
  recipientName: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = React.memo(
  ({ senderId, recipientId, recipientName }) => {
    const {
      sendMessage,
      sendFile,
      messages,
      readMessages,
      markMessageAsRead,
      fetchChatMessages,
      isUserOnline,
    } = useSocket();
    const [inputMessage, setInputMessage] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const markedMessagesRef = useRef<Set<string>>(new Set());
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [isAtBottom, setIsAtBottom] = useState(true);

    const localMessages = useMemo(
      () =>
        messages.filter(
          (message) =>
            (message.senderId === senderId &&
              message.recipientId === recipientId) ||
            (message.senderId === recipientId &&
              message.recipientId === senderId)
        ),
      [messages, senderId, recipientId]
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
      const chatContainer = chatContainerRef.current;
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, []);

    const handleScroll = useCallback(() => {
      const chatContainer = chatContainerRef.current;
      if (chatContainer) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainer;
        const bottomThreshold = 100;
        setIsAtBottom(
          scrollHeight - scrollTop - clientHeight < bottomThreshold
        );
      }
    }, []);

    useEffect(() => {
      scrollToBottom();
    }, []);

    useEffect(() => {
      if (isAtBottom) {
        scrollToBottom("smooth");
      }
    }, [localMessages, isAtBottom, scrollToBottom]);

    useEffect(() => {
      fetchChatMessages(recipientId);
    }, [fetchChatMessages, recipientId]);

    useEffect(() => {
      const unreadMessages = localMessages.filter(
        (msg) =>
          msg.senderId === recipientId &&
          !readMessages.has(msg.id) &&
          !markedMessagesRef.current.has(msg.id)
      );
      unreadMessages.forEach((msg) => {
        markMessageAsRead(msg.id, msg.senderId);
        markedMessagesRef.current.add(msg.id);
      });
    }, [localMessages, recipientId, readMessages, markMessageAsRead]);

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputMessage(e.target.value);
      },
      []
    );

    const handleSendMessage = useCallback(
      (e: React.FormEvent) => {
        e.preventDefault();
        if (inputMessage.trim() === "") return;

        const newMessage: Omit<ChatMessage, "id" | "timestamp" | "read"> = {
          senderId: senderId,
          recipientId: recipientId,
          content: inputMessage.trim(),
        };

        sendMessage(newMessage);
        setInputMessage("");
        scrollToBottom("smooth");
      },
      [inputMessage, sendMessage, senderId, recipientId, scrollToBottom]
    );

    const handleFileUpload = useCallback(() => {
      fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          const fileType = file.type.startsWith("image/") ? "image" : "video";
          sendFile(file, file.name, fileType, recipientId);
        }
      },
      [sendFile, recipientId]
    );

    const renderMessage = useCallback(
      (message: ChatMessage) => (
        <div
          key={message.id}
          className={`mb-4 ${
            message.senderId === senderId ? "text-right" : "text-left"
          }`}
        >
          <div
            className={`inline-block p-2 text-xs rounded-lg ${
              message.senderId === senderId
                ? "bg-[#EF6144] text-white"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {message.fileUrl && message.fileType ? (
              message.fileType === "image" ? (
                <img
                  src={message.fileUrl}
                  alt={message.content}
                  className="max-w-xs max-h-48 rounded"
                />
              ) : message.fileType === "video" ? (
                <video
                  src={message.fileUrl}
                  controls
                  className="max-w-xs max-h-48 rounded"
                />
              ) : (
                message.content
              )
            ) : (
              message.content
            )}
            {message.senderId === senderId && (
              <img
                src={readMessages.has(message.id) ? DoubleTick : SingleTick}
                alt="message status"
                className="inline-block ml-1 w-4 h-4"
              />
            )}
          </div>
        </div>
      ),
      [senderId, readMessages]
    );

    return (
      <div className="flex flex-col h-full bg-white">
        <div className="bg-gray-100 p-2 flex items-center border-b border-gray-200">
          <img
            src={DefaultProfilePic}
            alt="Profile"
            className="w-10 h-10 rounded-full mr-3"
          />
          <div>
            <h2 className="font-semibold text-xs">{recipientName}</h2>
            <p className="text-xs text-gray-500">
              {isUserOnline(recipientId) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        <div
          ref={chatContainerRef}
          className="flex-grow overflow-y-auto p-4"
          onScroll={handleScroll}
          style={{ maxHeight: "calc(100vh - 120px)" }} // Adjust this value as needed
        >
          {localMessages.map(renderMessage)}
        </div>

        <form
          onSubmit={handleSendMessage}
          className="bg-white p-4 border-t border-gray-200"
        >
          <div className="relative">
            <input
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              className="w-full bg-gray-100 border border-gray-300 rounded-md px-4 py-2 pr-20 focus:outline-none focus:ring-2 focus:ring-[#EF6144] placeholder-gray-400 placeholder:text-xs text-xs"
              placeholder="Type your message here"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              <button
                type="button"
                onClick={handleFileUpload}
                className="focus:outline-none"
              >
                <img
                  src={AttachmentIcon}
                  alt="attachment-icon"
                  className="w-6 h-6"
                />
              </button>
              <button type="submit" className="focus:outline-none">
                <img src={SendIcon} alt="send-icon" className="w-6 h-6" />
              </button>
            </div>
          </div>
        </form>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,video/*"
        />
      </div>
    );
  }
);

export default ChatInterface;
