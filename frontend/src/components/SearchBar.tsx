import SearchIcon from "../assets/SearchIcon.png";

const SearchBar = () => {
  return (
    <div className="w-[350px] h-[35px] border border-gray-400 m-4 bg-gray-100 px-2 items-center flex rounded-lg">
      <div>
        <img src={SearchIcon} alt="search-icon" />
      </div>
      <input
        type="text"
        placeholder="Search"
        className="bg-transparent outline-none flex-grow px-2 text-sm placeholder-gray-500"
      />
    </div>
  );
};

export default SearchBar;
