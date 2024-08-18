import React from "react";
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
  const { users } = useSocket();

  return (
    <div className="h-full flex flex-col">
      <SearchBar />
      <SortingChatFilters />
      <div className="flex-1 overflow-y-auto">
        {users.map((user) => (
          <UserChat
            key={user.id}
            profilePic="https://via.placeholder.com/150"
            name={user.username}
            lastMessage="No messages yet"
            lastMessageTime=""
            onClick={() => onSelectChat(user.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default AllUsersContainer;
