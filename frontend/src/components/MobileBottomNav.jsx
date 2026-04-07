import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Badge } from "primereact/badge";
import { Sidebar } from "primereact/sidebar";
import { Button } from "primereact/button";
import useCartStore from "../store/cartStore";
import useAuthStore from "../store/authStore";
import api from "../utils/api";

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems, resetCart } = useCartStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [adminSheetVisible, setAdminSheetVisible] = useState(false);
  const [profileSheetVisible, setProfileSheetVisible] = useState(false);

  const isAdmin = user?.role === "ADMIN";

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignored for UX
    } finally {
      logout();
      resetCart();
      setProfileSheetVisible(false);
      navigate("/login");
    }
  };

  // Helper to determine route match
  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const NavButton = ({ icon, label, path, badge, onClick }) => {
    const active = isActive(path) && !onClick; // Don't highlight if it's an action button
    return (
      <div
        className={`flex flex-column align-items-center justify-content-center cursor-pointer transition-transform transition-duration-150 active:scale-90 flex-1 py-2 ${
          active ? "text-primary" : "text-600 hover:text-800"
        }`}
        onClick={() => {
          if (onClick) onClick();
          else navigate(path);
        }}
      >
        <i className={`pi ${icon} text-xl mb-1 p-overlay-badge`}>
          {badge > 0 && <Badge value={badge} severity="danger" size="small" />}
        </i>
        <span className="text-xs font-semibold">{label}</span>
        {/* Active Indicator Bar */}
        <div 
          className={`h-2rem w-4rem border-round-top transition-all transition-duration-300 absolute bottom-0 ${active ? 'bg-primary opacity-100' : 'bg-transparent opacity-0'}`} 
          style={{ height: '4px' }}
        />
      </div>
    );
  };

  return (
    <>
      <div 
        className="flex md:hidden w-full bg-white fixed bottom-0 left-0 z-5 shadow-8 border-top-1 surface-border"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex w-full justify-content-between relative">
          <NavButton icon={isActive("/") ? "pi-home" : "pi-home"} label="Home" path="/" />
          <NavButton icon={isActive("/products") ? "pi-shopping-bag" : "pi-shopping-bag"} label="Shop" path="/products" />
          
          {isAuthenticated && (
            <NavButton 
              icon="pi-shopping-cart" 
              label="Cart" 
              path="/cart" 
              badge={totalItems} 
            />
          )}

          {isAdmin && (
            <NavButton 
              icon="pi-shield" 
              label="Admin" 
              path="#" 
              onClick={() => setAdminSheetVisible(true)} 
            />
          )}

          {isAuthenticated ? (
            <NavButton icon="pi-user" label="Profile" path="#" onClick={() => setProfileSheetVisible(true)} />
          ) : (
            <NavButton icon="pi-sign-in" label="Login" path="/login" />
          )}
        </div>
      </div>

      {/* Admin Action Sheet */}
      <Sidebar 
        visible={adminSheetVisible} 
        position="bottom" 
        onHide={() => setAdminSheetVisible(false)}
        className="h-auto border-round-top-2xl"
        showCloseIcon={false}
      >
        <div className="flex flex-column align-items-center pb-4">
          <div className="w-3rem h-1rem surface-300 border-round-xl mb-4" />
          <h3 className="m-0 mb-3 text-700">Admin Controls</h3>
          <div className="flex flex-column w-full gap-2">
            <Button label="Dashboard" icon="pi pi-th-large" className="p-button-outlined border-round-xl" onClick={() => { setAdminSheetVisible(false); navigate("/admin/dashboard"); }} />
            <Button label="Manage Products" icon="pi pi-box" className="p-button-outlined border-round-xl" onClick={() => { setAdminSheetVisible(false); navigate("/admin/products"); }} />
            <Button label="Manage Orders" icon="pi pi-list" className="p-button-outlined border-round-xl" onClick={() => { setAdminSheetVisible(false); navigate("/admin/orders"); }} />
            <Button label="Manage Configs" icon="pi pi-tags" className="p-button-outlined border-round-xl" onClick={() => { setAdminSheetVisible(false); navigate("/admin/categories"); }} />
            <Button label="Manage Users" icon="pi pi-users" className="p-button-outlined border-round-xl" onClick={() => { setAdminSheetVisible(false); navigate("/admin/users"); }} />
          </div>
        </div>
      </Sidebar>

      {/* Profile & Logout Action Sheet */}
      <Sidebar 
        visible={profileSheetVisible} 
        position="bottom" 
        onHide={() => setProfileSheetVisible(false)}
        className="h-auto border-round-top-2xl"
        showCloseIcon={false}
      >
        <div className="flex flex-column align-items-center pb-4">
          <div className="w-3rem h-1rem surface-300 border-round-xl mb-4" />
          <h3 className="m-0 mb-1 text-700">Hi, {user?.firstName || "User"}!</h3>
          <p className="text-sm text-500 m-0 mb-4">{user?.email}</p>
          <div className="flex flex-column w-full gap-2">
            <Button label="My Profile" icon="pi pi-user" className="p-button-text p-button-plain justify-content-start border-round-xl py-3" onClick={() => { setProfileSheetVisible(false); navigate("/profile"); }} />
            <Button label="My Orders" icon="pi pi-box" className="p-button-text p-button-plain justify-content-start border-round-xl py-3" onClick={() => { setProfileSheetVisible(false); navigate("/orders"); }} />
            <hr className="w-full border-none border-top-1 surface-border my-2" />
            <Button label="Logout safely" icon="pi pi-sign-out" severity="danger" className="border-round-xl py-3" onClick={handleLogout} />
          </div>
        </div>
      </Sidebar>
    </>
  );
};

export default MobileBottomNav;
