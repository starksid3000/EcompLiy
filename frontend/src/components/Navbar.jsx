import { useNavigate, useLocation } from "react-router-dom";
import { Tooltip } from "primereact/tooltip";
import { Badge } from "primereact/badge";
import { Button } from "primereact/button";
import { Skeleton } from "primereact/skeleton";
import { Menu } from "primereact/menu";
import { useRef } from "react";
import SearchBar from "./SearchBar";
import UserMenu from "./UserMenu";
import useAuthStore from "../store/authStore";
import useCartStore from "../store/cartStore";
import api from "../utils/api";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout, isLoading } = useAuthStore();
  const { totalItems, resetCart } = useCartStore();
  const adminMenuRef = useRef(null);

  const isAdmin = user?.role === "ADMIN";

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignored for UX
    } finally {
      logout();
      resetCart();
      navigate("/login");
    }
  };

  const adminItems = [
    { label: "Dashboard", icon: "pi pi-th-large", command: () => navigate("/admin/dashboard") },
    { label: "Manage Products", icon: "pi pi-box", command: () => navigate("/admin/products") },
    { label: "Manage Orders", icon: "pi pi-list", command: () => navigate("/admin/orders") },
    { label: "Manage Categories", icon: "pi pi-tags", command: () => navigate("/admin/categories") },
    { label: "Manage Users", icon: "pi pi-users", command: () => navigate("/admin/users") },
  ];

  return (
    <div className="hidden md:flex align-items-center justify-content-between px-3 lg:px-4 py-2 w-full bg-white shadow-1 sticky top-0 z-5" style={{ minHeight: "70px" }}>
      {/* Tooltip Initializer */}
      <Tooltip target=".nav-tooltip" position="bottom" mouseTrack mouseTrackTop={15} />

      {/* Left & Center*/}
      <div className="flex align-items-center gap-2 lg:gap-4 flex-grow-1">
        {/* Branding */}
        <div
          className="flex align-items-center gap-2 cursor-pointer transition-transform transition-duration-200 active:scale-95 flex-shrink-0"
          onClick={() => navigate("/")}
        >
          <i className="pi pi-cart-plus text-primary text-2xl lg:text-3xl" />
          <span className="font-bold text-xl lg:text-2xl tracking-tight text-900 hidden lg:inline-block">EcompLiy</span>
        </div>

        {/* Links */}
        <nav className="flex align-items-center gap-1 lg:gap-3 flex-shrink-0">
          <Button 
            label="Home" 
            icon="pi pi-home" 
            text 
            className={`p-button-sm lg:p-button font-semibold transition-transform transition-duration-150 active:scale-95 px-2 lg:px-3 ${location.pathname === '/' ? 'text-primary' : 'text-700 hover:text-900'}`}
            onClick={() => navigate("/")}
          />
          <Button 
            label="Products" 
            icon="pi pi-shopping-bag" 
            text 
            className={`p-button-sm lg:p-button font-semibold transition-transform transition-duration-150 active:scale-95 px-2 lg:px-3 ${location.pathname.startsWith('/products') ? 'text-primary' : 'text-700 hover:text-900'}`}
            onClick={() => navigate("/products")}
          />
        </nav>

        {/* Search */}
        <div className="w-full ml-1 lg:ml-4" style={{ maxWidth: '400px' }}>
          <SearchBar />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex align-items-center gap-1 lg:gap-3 flex-shrink-0">
        {isLoading ? (
          <Skeleton shape="circle" size="2.5rem" />
        ) : isAuthenticated ? (
          <>
            {/* Cart Icon */}
            <div
              className={`nav-tooltip p-2 border-circle cursor-pointer flex align-items-center justify-content-center transition-all transition-duration-200 hover:surface-hover active:scale-90 ${location.pathname.startsWith("/cart") ? "text-primary bg-primary-reverse" : "text-700"}`}
              onClick={() => navigate("/cart")}
              data-pr-tooltip="View Cart"
              style={{ width: "42px", height: "42px" }}
            >
              <i className="pi pi-shopping-cart text-xl lg:text-2xl p-overlay-badge">
                {totalItems > 0 && <Badge value={totalItems} severity="danger" size="normal" />}
              </i>
            </div>

            {/* Admin Menu */}
            {isAdmin && (
              <>
                <Menu model={adminItems} popup ref={adminMenuRef} id="desktop_admin_menu" />
                <div 
                  className="nav-tooltip p-2 border-circle cursor-pointer flex align-items-center justify-content-center transition-all transition-duration-200 hover:surface-hover active:scale-90 text-purple-600 bg-purple-50"
                  onClick={(e) => adminMenuRef.current?.toggle(e)}
                  data-pr-tooltip="Admin Controls"
                  aria-controls="desktop_admin_menu" 
                  aria-haspopup
                  style={{ width: "42px", height: "42px" }}
                >
                  <i className="pi pi-cog text-xl lg:text-2xl" />
                </div>
              </>
            )}

            {/* User Profile Hook */}
            <div className="ml-1 lg:ml-2">
              <UserMenu user={user} onLogout={handleLogout} />
            </div>
          </>
        ) : (
          <Button
            label="Login"
            icon="pi pi-sign-in"
            className="border-round-xl font-semibold px-3 lg:px-4 p-button-sm lg:p-button transition-transform transition-duration-150 active:scale-95"
            onClick={() => navigate("/login")}
          />
        )}
      </div>
    </div>
  );
};

export default Navbar;
