import ChatInterface from "./ChatInterface";
const PersonalChatContainer = () => {
  return (
    <div className="flex flex-col h-screen">
      <div className="flex-grow overflow-hidden">
        <ChatInterface />
      </div>
    </div>
  );
};

export default PersonalChatContainer;
