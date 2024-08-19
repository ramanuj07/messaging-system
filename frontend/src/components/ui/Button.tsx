import React from "react";

interface ButtonProps {
  buttonName: string;
  isSelected?: boolean;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  buttonName,
  isSelected = false,
  onClick,
}) => {
  const baseClasses =
    "p-2 mr-2 items-center flex rounded-full text-xs w-auto h-6 transition-colors duration-200";
  const selectedClasses = "bg-[#EF6144] text-white";
  const unselectedClasses = "bg-white text-[#EF6144] border border-[#EF6144]";

  return (
    <button
      className={`${baseClasses} ${
        isSelected ? selectedClasses : unselectedClasses
      }`}
      onClick={onClick}
    >
      {buttonName}
    </button>
  );
};

export default Button;
