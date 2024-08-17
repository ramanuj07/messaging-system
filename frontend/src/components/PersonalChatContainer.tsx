import React, { useState } from "react";
import { useSocket } from "../context/SocketProvider";
import ChatInterface from "./ChatInterface";

const PersonalChatContainer: React.FC = () => {
  const { users, currentUser } = useSocket();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

  if (!currentUser) {
    return <div>Please log in</div>;
  }

  return (
    <div className="flex">
      <div className="w-1/3 border-r">
        {users.map((user) => (
          <div
            key={user.id}
            onClick={() => setSelectedChat(user.id)}
            className="p-4 hover:bg-gray-100 cursor-pointer"
          >
            {user.username}
          </div>
        ))}
      </div>
      <div className="w-2/3">
        {selectedChat ? (
          <ChatInterface
            senderId={currentUser.id}
            recipientId={selectedChat}
            recipientName={
              users.find((u) => u.id === selectedChat)?.username || ""
            }
          />
        ) : (
          <div className="p-4">Select a chat to start messaging</div>
        )}
      </div>
    </div>
  );
};

export default PersonalChatContainer;
