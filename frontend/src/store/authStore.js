import { create } from "zustand";

const useAuthStore = create((set) => ({
  isAuthenticated: !!localStorage.getItem("accessToken"),
  user: null,
  isLoading: true,
  login: (token, userData, refreshToken) => {
    localStorage.setItem("accessToken", token);
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
    }
    set({ isAuthenticated: true, user: userData });
  },
  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    set({ isAuthenticated: false, user: null });
  },
  initializeAuth: () => {
    const token = localStorage.getItem("accessToken");
    const userStr = localStorage.getItem("user");
    let user = null;
    set({ isLoading: true });
    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch (e) {
        console.error("Failed to parse user data from local storage", e);
      }
    }
    set({
      isAuthenticated: !!token,
      user,
      isLoading: false,
    });
  },
}));

export default useAuthStore;
