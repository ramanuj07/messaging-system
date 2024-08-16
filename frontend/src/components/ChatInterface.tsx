import React, { useState, useEffect, useRef } from "react";
import AttachmentIcon from "../assets/AttachmentIcon.png";
import SendIcon from "../assets/SendIcon.png";
import DefaultProfilePic from "../assets/DefaultProfilePic.jpg"; // Add a default profile picture

interface Message {
  id: number;
  text: string;
  sender: "user" | "other";
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() === "") return;

    const newMessage: Message = {
      id: messages.length + 1,
      text: inputMessage,
      sender: "user",
    };

    setMessages([...messages, newMessage]);
    setInputMessage("");

    // Simulating a reply from the other user
    setIsTyping(true);
    setTimeout(() => {
      const replyMessage: Message = {
        id: messages.length + 2,
        text: "This is a simulated reply.",
        sender: "other",
      };
      setMessages((prevMessages) => [...prevMessages, replyMessage]);
      setIsTyping(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* User Profile Header */}
      <div className="bg-gray-100 p-2 flex items-center border-b border-gray-200">
        <img
          src={DefaultProfilePic}
          alt="Profile"
          className="w-10 h-10 rounded-full mr-3"
        />
        <div>
          <h2 className="font-semibold text-xs">User Name</h2>
          <p className="text-xs text-gray-500">
            {isTyping ? "Typing..." : "Online"}
          </p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-grow overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 ${
              message.sender === "user" ? "text-right" : "text-left"
            }`}
          >
            <div
              className={`inline-block p-2 text-xs rounded-lg ${
                message.sender === "user"
                  ? "bg-[#EF6144] text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
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
            <button type="button" className="focus:outline-none">
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
    </div>
  );
};

export default ChatInterface;
