import LogoLeft from "../assets/LogoLeft.png";
import LogoRight from "../assets/LogoRight.png";

const Header = () => {
  return (
    <div>
      <div className="flex justify-between mx-6 my-4">
        <img src={LogoLeft} alt="logo-left" className="h-10" />
        <img src={LogoRight} alt="logo-right" className="h-10" />
      </div>
      <hr />
    </div>
  );
};

export default Header;
