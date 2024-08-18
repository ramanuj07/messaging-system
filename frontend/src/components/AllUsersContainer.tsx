import React, { useMemo } from "react";
import { useSocket } from "../context/SocketProvider";
import SearchBar from "./SearchBar";
import SortingChatFilters from "./SortingChatFilters";
import UserChat from "./UserChat";

interface AllUsersContainerProps {
  onSelectChat: (userId: string) => void;
}

const AllUsersContainer: React.FC<AllUsersContainerProps> = ({
  onSelectChat,
}) => {
  const { users, fetchChatMessages, messages, currentUser } = useSocket();

  const lastMessagesMap = useMemo(() => {
    const map = new Map();
    messages.forEach((message) => {
      const otherUserId =
        message.senderId === currentUser?.id
          ? message.recipientId
          : message.senderId;
      if (
        !map.has(otherUserId) ||
        new Date(message.timestamp) > new Date(map.get(otherUserId).timestamp)
      ) {
        map.set(otherUserId, message);
      }
    });
    return map;
  }, [messages, currentUser]);

  const handleChatSelect = (userId: string) => {
    fetchChatMessages(userId);
    onSelectChat(userId);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const truncateMessage = (message: string, maxLength: number) => {
    if (message.length <= maxLength) return message;
    return message.substr(0, maxLength) + "...";
  };

  return (
    <div className="h-full flex flex-col">
      <SearchBar />
      <SortingChatFilters />
      <div className="flex-1 overflow-y-auto">
        {users.map((user) => {
          const lastMessage = lastMessagesMap.get(user.id);
          return (
            <UserChat
              key={user.id}
              profilePic="https://via.placeholder.com/150"
              name={user.username}
              lastMessage={
                lastMessage
                  ? truncateMessage(lastMessage.content, 30)
                  : "No messages yet"
              }
              lastMessageTime={
                lastMessage ? formatTimestamp(lastMessage.timestamp) : ""
              }
              onClick={() => handleChatSelect(user.id)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default AllUsersContainer;
