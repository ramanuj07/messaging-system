import Button from "./ui/Button";

const SortingChatFilters = () => {
  return (
    <div className="my-2">
      <div className="flex ml-4">
        <Button buttonName={"All"} />
        <Button buttonName={"Unread"} />
        <Button buttonName={"Archived"} />
        <Button buttonName={"Blocked"} />
      </div>
      <hr className="mt-2" />
    </div>
  );
};

export default SortingChatFilters;
