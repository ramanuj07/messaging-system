import { useState } from "react";
import Button from "./ui/Button";

const SortingChatFilters = () => {
  const [selectedFilter, setSelectedFilter] = useState("All");

  const filters = ["All", "Unread", "Archived", "Blocked"];

  const handleFilterClick = (filter: string) => {
    setSelectedFilter(filter);
  };

  return (
    <div className="my-2">
      <div className="flex ml-4 space-x-2">
        {filters.map((filter) => (
          <Button
            key={filter}
            buttonName={filter}
            isSelected={selectedFilter === filter}
            onClick={() => handleFilterClick(filter)}
          />
        ))}
      </div>
      <hr className="mt-2" />
    </div>
  );
};

export default SortingChatFilters;
