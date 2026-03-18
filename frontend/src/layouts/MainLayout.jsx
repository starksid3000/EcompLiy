import { Menubar } from "primereact/menubar";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Avatar } from "primereact/avatar";
import api from "../utils/api";

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, initializeAuth, logout } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      logout();
      navigate("/login");
    }
  };

  const items = [
    {
      template: () => (
        <div
          className="flex align-items-center gap-2 cursor-pointer mr-3"
          onClick={() => navigate("/")}
        >
          <i className="pi pi-shopping-cart text-primary text-xl"></i>
          <span className="font-bold">EcompLiy</span>
        </div>
      ),
    },
    {
      label: "Home",
      icon: "pi pi-home",
      className: location.pathname === "/" ? "font-bold text-primary" : "",
      command: () => navigate("/"),
    },
    {
      label: "Products",
      icon: "pi pi-shopping-bag",
      className: location.pathname.startsWith("/products")
        ? "font-bold text-primary"
        : "",
      command: () => navigate("/products"),
    },
    {
      label: "Cart",
      icon: "pi pi-shopping-cart",
      className: location.pathname.startsWith("/cart")
        ? "font-bold text-primary"
        : "",
      command: () => navigate("/cart"),
    },
  ];

  // 🔹 Right side (FIXED responsiveness)
  const endContent = (
    <div className="flex align-items-center gap-2 md:gap-3 w-full md:w-auto flex-wrap">
      {/* Search (full width on mobile) */}
      <InputText
        placeholder="Search"
        type="text"
        className="w-8 md:w-14rem lg:w-18rem order-1 md:order-none"
      />

      {isAuthenticated ? (
        <>
          {/* Hide name on small screens */}
          <span className="hidden md:inline surface-100 px-2 py-1 border-round-full text-sm font-medium">
            👋 {user?.firstName || "User"}
          </span>

          <Avatar
            image="https://primefaces.org/cdn/primereact/images/avatar/amyelsner.png"
            shape="circle"
            size="normal"
          />

          <Button
            icon="pi pi-sign-out"
            severity="danger"
            rounded
            text
            className="p-button-sm"
            onClick={handleLogout}
          />
        </>
      ) : (
        <Button
          label="Login"
          icon="pi pi-sign-in"
          className="border-round-full font-semibold p-button-sm"
          onClick={() => navigate("/login")}
        />
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-column surface-ground">
      <header
        className="sticky top-0 z-5"
        style={{
          backdropFilter: "blur(12px)",
          background: "rgba(255,255,255,0.7)",
        }}
      >
        <Menubar
          model={items}
          end={endContent}
          className="border-none px-2 md:px-4 py-2 w-full"
        />
      </header>

      <main className="flex-1 p-3 md:p-4">
        <Outlet />
      </main>

      <footer className="text-center p-3">
        <div className="flex flex-column md:flex-row justify-content-between align-items-center gap-3">
          <div>
            <span className="font-bold text-white">EcompLiy</span>
            <span className="block text-sm mt-1">
              © 2026 All rights reserved.
            </span>
          </div>

          <div className="flex gap-3 text-xl">
            <i className="pi pi-twitter cursor-pointer hover:text-white"></i>
            <i className="pi pi-facebook cursor-pointer hover:text-white"></i>
            <i className="pi pi-instagram cursor-pointer hover:text-white"></i>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
