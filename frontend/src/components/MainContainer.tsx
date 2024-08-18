import { useState } from "react";
import AllUsersContainer from "./AllUsersContainer";
import Header from "./Header";
import PersonalChatContainer from "./PersonalChatContainer";

const MainContainer = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

  return (
    <div className="h-screen">
      <div className="flex-shrink-0">
        <Header />
      </div>

      <div className="grid grid-cols-12 h-full">
        <div className="col-span-4 border-r border-gray-300">
          <AllUsersContainer onSelectChat={setSelectedChat} />
        </div>

        <div className="col-span-8">
          <PersonalChatContainer selectedChat={selectedChat} />
        </div>
      </div>
    </div>
  );
};

export default MainContainer;
