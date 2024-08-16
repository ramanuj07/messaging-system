import React from "react";

interface ChatProps {
  profilePic: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
}

const UserChat: React.FC<ChatProps> = ({
  profilePic,
  name,
  lastMessage,
  lastMessageTime,
}) => {
  return (
    <div>
      <div className="flex items-center p-4 hover:bg-gray-100 cursor-pointer mt-2">
        <img
          src={profilePic}
          alt={`${name} profile`}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="ml-4 flex-1 items-center">
          <div className="flex items-center">
            <h4 className="text-gray-900 font-semibold text-sm mr-2">{name}</h4>
            <h4 className="text-gray-500 mr-2">•</h4>
            <h4 className="text-gray-500 text-xs">{lastMessageTime}</h4>
          </div>
          <p className="text-gray-600 text-sm">{lastMessage}</p>
        </div>
      </div>
      <hr />
    </div>
  );
};

export default UserChat;
