import { useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";

const MobileTopBar = () => {
  const navigate = useNavigate();

  return (
    <div
      className="flex md:hidden flex-column w-full bg-white shadow-1 sticky top-0 z-5"
    >
      {/* Brand Header */}
      <div className="flex align-items-center justify-content-center py-2 px-3 border-bottom-1 surface-border">
        <div
          className="flex align-items-center gap-2 cursor-pointer transition-transform transition-duration-200 active:scale-95"
          onClick={() => navigate("/")}
        >
          <i className="pi pi-cart-plus text-primary text-2xl" />
          <span className="font-bold text-xl tracking-tight text-900">EcompLiy</span>
        </div>
      </div>

      {/* Sticky Search Row */}
      <div className="w-full px-3 py-2 bg-white">
        <SearchBar />
      </div>
    </div>
  );
};

export default MobileTopBar;
