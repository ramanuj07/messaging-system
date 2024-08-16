interface ButtonProps {
  buttonName: string;
}

const Button = ({ buttonName }: ButtonProps) => {
  return (
    <div>
      <button className="p-2 mr-2 items-center flex rounded-full bg-[#EF6144] text-white text-xs w-auto h-6">
        {buttonName}
      </button>
    </div>
  );
};

export default Button;
