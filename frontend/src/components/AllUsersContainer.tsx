import SearchBar from "./SearchBar";
import SortingChatFilters from "./SortingChatFilters";
import UserChat from "./UserChat";

const AllUsersContainer = () => {
  return (
    <div>
      <SearchBar />
      <SortingChatFilters />
      <UserChat />
    </div>
  );
};

export default AllUsersContainer;
