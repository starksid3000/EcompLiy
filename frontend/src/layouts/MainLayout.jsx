import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { Toast } from "primereact/toast";
import useAuthStore from "../store/authStore";
import useCartStore from "../store/cartStore";

import Navbar from "../components/Navbar";
import MobileTopBar from "../components/MobileTopBar";
import MobileBottomNav from "../components/MobileBottomNav";

const MainLayout = () => {
  const location = useLocation();
  const { isAuthenticated, initializeAuth, isLoading } = useAuthStore();
  const { fetchCart } = useCartStore();
  const toast = useRef(null);

  useEffect(() => {
    initializeAuth();
  }, []); // Run once on mount

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      fetchCart();
    }
  }, [isAuthenticated, isLoading]);

  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  return (
    <div className="min-h-screen flex flex-column surface-ground">
      <Toast ref={toast} />
      
      {/* Desktop Navigation */}
      <Navbar />

      {/* Mobile Top Navigation (Search & Branded Header) */}
      <MobileTopBar />

      {/* Content Plane */}
      <main className="flex-grow-1" style={{ paddingBottom: '90px' }}> {/* Bottom padding to prevent content from hiding behind Bottom Nav */}
        {isAuthPage ? (
          <Outlet />
        ) : (
          <div className="p-3 flex-grow-1 max-w-screen-xl mx-auto w-full">
            <Outlet />
          </div>
        )}
      </main>

      {/* Mobile Bottom Thumbnail Navigation (Icons inside) */}
      <MobileBottomNav />

      {/* Standard Footer - hidden on heavily constrained mobile screens to avoid fighting Thumb Nav */}
      <footer className="surface-800 text-black p-4 hidden md:block">
        <div className="flex flex-column md:flex-row justify-content-between align-items-center gap-3 max-w-screen-lg mx-auto w-full">
          <div>
            <span className="font-bold text-lg">EcompLiy</span>
            <span className="block text-sm mt-1 text-400">
              © {new Date().getFullYear()} All rights reserved.
            </span>
          </div>

          <div className="flex gap-4 text-xl">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-300 hover:text-white transition-colors transition-duration-200 no-underline" >
              <i className="pi pi-twitter" />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-300 hover:text-white transition-colors transition-duration-200 no-underline" >
              <i className="pi pi-facebook" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-300 hover:text-white transition-colors transition-duration-200 no-underline" >
              <i className="pi pi-instagram" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
