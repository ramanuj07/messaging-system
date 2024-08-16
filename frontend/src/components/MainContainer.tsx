import AllUsersContainer from "./AllUsersContainer";
import Header from "./Header";
import PersonalChatContainer from "./PersonalChatContainer";

const MainContainer = () => {
  return (
    <div>
      <Header />
      <div className="grid grid-cols-12">
        <div className="col-span-4">
          <AllUsersContainer />
        </div>

        <div className="col-span-8">
          <PersonalChatContainer />
        </div>
      </div>
    </div>
  );
};

export default MainContainer;
