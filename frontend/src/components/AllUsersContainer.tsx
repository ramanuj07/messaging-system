import SearchBar from "./SearchBar";
import SortingChatFilters from "./SortingChatFilters";
import UserChat from "./UserChat";

const AllUsersContainer = () => {
  return (
    <div>
      <SearchBar />
      <SortingChatFilters />
      <UserChat
        profilePic="https://via.placeholder.com/150"
        name="John Doe"
        lastMessage="Hey! How are you doing?"
        lastMessageTime="12:45 PM"
      />

      <UserChat
        profilePic="https://via.placeholder.com/150"
        name="John Doe"
        lastMessage="Hey! How are you doing?"
        lastMessageTime="12:45 PM"
      />

      <UserChat
        profilePic="https://via.placeholder.com/150"
        name="John Doe"
        lastMessage="Hey! How are you doing?"
        lastMessageTime="12:45 PM"
      />
    </div>
  );
};

export default AllUsersContainer;
