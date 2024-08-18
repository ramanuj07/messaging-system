import React from "react";
import { useSocket } from "../context/SocketProvider";
import ChatInterface from "./ChatInterface";

interface PersonalChatContainerProps {
  selectedChat: string | null;
}

const PersonalChatContainer: React.FC<PersonalChatContainerProps> = ({
  selectedChat,
}) => {
  const { users, currentUser } = useSocket();

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        Please log in
      </div>
    );
  }

  return (
    <div className="h-full">
      {selectedChat ? (
        <ChatInterface
          senderId={currentUser.id}
          recipientId={selectedChat}
          recipientName={
            users.find((u) => u.id === selectedChat)?.username || "Unknown User"
          }
        />
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          Select a chat to start messaging
        </div>
      )}
    </div>
  );
};

export default PersonalChatContainer;
