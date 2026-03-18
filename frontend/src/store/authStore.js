import { create } from "zustand";

const useAuthStore = create((set) => ({
  isAuthenticated: !!localStorage.getItem("accessToken"),
  user: null,

  login: (token, userData) => {
    localStorage.setItem("accessToken", token);
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
    }
    set({ isAuthenticated: true, user: userData });
  },
  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    set({ isAuthenticated: false, user: null });
  },
  initializeAuth: () => {
    const token = localStorage.getItem("accessToken");
    const userStr = localStorage.getItem("user");
    let user = null;
    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch (e) {
        console.error("Failed to parse user data from local storage", e);
      }
    }
    set({ isAuthenticated: !!token, user });
  },
}));

export default useAuthStore;
