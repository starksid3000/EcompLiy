import { Menubar } from "primereact/menubar";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { useEffect, useMemo, useRef } from "react";
import SearchBar from "../components/SearchBar";
import { Button } from "primereact/button";
import { Badge } from "primereact/badge";
import { Skeleton } from "primereact/skeleton";
import UserMenu from "../components/UserMenu";
import api from "../utils/api";
import { Toast } from "primereact/toast";

// Main Layout
const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, initializeAuth, logout, isLoading } =
    useAuthStore();
  const toast = useRef(null);

  // cart item count
  // Replace with: const { totalItems } = useCartStore();
  const cartCount = 0;

  useEffect(() => {
    initializeAuth();
  }, []); // intentionally empty — initializeAuth should only run once on mount

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      toast.current?.show({
        severity: "success",
        summary: "Logged out",
        detail: "See you next time!",
        life: 2000,
      });
    } catch {
      // still log out locally even if the API call fails
      toast.current?.show({
        severity: "warn",
        summary: "Session ended",
        detail: "You have been logged out.",
        life: 2000,
      });
    } finally {
      logout();
      navigate("/login");
    }
  };

  // Memoized nav items so they don't re-create on every render
  const items = useMemo(
    () => [
      {
        template: () => (
          <div
            className="flex align-items-center gap-2 cursor-pointer mr-3"
            onClick={() => navigate("/")}
            role="link"
            aria-label="Go to homepage"
          >
            <i className="pi pi-shopping-cart text-primary text-xl" />
            <span className="font-bold text-lg">EcompLiy</span>
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
        template: () => (
          <div
            className={`p-menuitem-link flex align-items-center gap-2 cursor-pointer ${
              location.pathname.startsWith("/cart")
                ? "font-bold text-primary"
                : ""
            }`}
            onClick={() => navigate("/cart")}
            role="link"
            aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
          >
            <span className="p-overlay-badge">
              <i className="pi pi-shopping-cart" />
              {cartCount > 0 && <Badge value={cartCount} severity="danger" />}
            </span>
            <span>Cart</span>
          </div>
        ),
      },
    ],
    [location.pathname, navigate, cartCount],
  );
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";
  // Memoized end content
  const endContent = useMemo(
    () => (
      <div className="flex align-items-center gap-2 md:gap-3 w-full md:w-auto">
        <SearchBar />

        {isLoading ? (
          // Show skeleton while auth state is resolving
          <Skeleton shape="circle" size="2rem" />
        ) : isAuthenticated ? (
          <UserMenu user={user} onLogout={handleLogout} />
        ) : (
          <Button
            label="Login"
            icon="pi pi-sign-in"
            className="border-round-full font-semibold p-button-sm"
            onClick={() => navigate("/login")}
          />
        )}
      </div>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isAuthenticated, isLoading, user, navigate],
  );

  return (
    <div className="min-h-screen flex flex-column surface-ground">
      <Toast ref={toast} />
      <header
        className="sticky top-0 z-5"
        style={{
          backdropFilter: "blur(12px)",
          background: "rgba(255,255,255,0.75)",
          borderBottom: "1px solid var(--surface-border)",
        }}
      >
        <Menubar
          model={items}
          end={endContent}
          className="border-none px-2 md:px-4 py-2 w-full"
          aria-label="Main navigation"
        />
      </header>

      <main className={`flex-grow-1 ${isAuthPage ? "" : "p-4 md:p-6 lg:p-8"}`}>
        {isAuthPage ? (
          <Outlet />
        ) : (
          <div className="surface-card border-round-2xl shadow-3 p-5 flex-grow-1">
            <Outlet />
          </div>
        )}
      </main>

      <footer className="surface-800 text-black p-4">
        <div className="flex flex-column md:flex-row justify-content-between align-items-center gap-3 max-w-screen-lg mx-auto">
          <div>
            <span className="font-bold text-lg">EcompLiy</span>
            <span className="block text-sm mt-1 text-300">
              © {new Date().getFullYear()} All rights reserved.
            </span>
          </div>

          <div className="flex gap-4 text-xl">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              className="text-300 hover:text-white transition-colors transition-duration-200 no-underline"
            >
              <i className="pi pi-twitter" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="text-300 hover:text-white transition-colors transition-duration-200 no-underline"
            >
              <i className="pi pi-facebook" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-300 hover:text-white transition-colors transition-duration-200 no-underline"
            >
              <i className="pi pi-instagram" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
