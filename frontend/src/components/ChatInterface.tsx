import React, { useState, useEffect, useRef, useCallback } from "react";
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
}

interface ChatInterfaceProps {
  senderId: string;
  recipientId: string;
  recipientName: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  senderId,
  recipientId,
  recipientName,
}) => {
  const { sendMessage, messages, readMessages, markMessageAsRead } =
    useSocket();
  const [inputMessage, setInputMessage] = useState("");
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [localMessages, scrollToBottom]);

  useEffect(() => {
    const filteredMessages = messages.filter(
      (message) =>
        (message.senderId === senderId &&
          message.recipientId === recipientId) ||
        (message.senderId === recipientId && message.recipientId === senderId)
    );
    setLocalMessages(filteredMessages);
  }, [messages, senderId, recipientId]);

  useEffect(() => {
    const unreadMessages = localMessages.filter(
      (msg) => msg.senderId === recipientId && !readMessages.has(msg.id)
    );
    unreadMessages.forEach((msg) => {
      markMessageAsRead(msg.id, msg.senderId);
    });
  }, [localMessages, recipientId, readMessages, markMessageAsRead]);

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (inputMessage.trim() === "") return;

      const newMessage: Omit<ChatMessage, "id" | "timestamp"> = {
        senderId: senderId,
        recipientId: recipientId,
        content: inputMessage.trim(),
      };

      sendMessage(newMessage);
      setInputMessage("");
    },
    [inputMessage, sendMessage, senderId, recipientId]
  );

  const handleFileUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        // Handle file upload logic here
        console.log("File selected:", file.name);
      }
    },
    []
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
          {message.content}
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
          <p className="text-xs text-gray-500">Online</p>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-4">
        {localMessages.map(renderMessage)}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSendMessage}
        className="bg-white p-4 border-t border-gray-200"
      >
        <div className="relative">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
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
};

export default ChatInterface;
