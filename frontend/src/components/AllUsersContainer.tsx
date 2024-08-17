import React from "react";
import { useSocket } from "../context/SocketProvider";
import SearchBar from "./SearchBar";
import SortingChatFilters from "./SortingChatFilters";
import UserChat from "./UserChat";

const AllUsersContainer: React.FC = () => {
  const { users } = useSocket();

  return (
    <div>
      <SearchBar />
      <SortingChatFilters />
      {users.map((user) => (
        <UserChat
          key={user.id}
          profilePic="https://via.placeholder.com/150"
          name={user.username}
          lastMessage="No messages yet"
          lastMessageTime=""
        />
      ))}
    </div>
  );
};

export default AllUsersContainer;
