/* eslint-disable no-unused-vars */
import api from "../utils/api";
import { create } from "zustand";
const useCartStore = create((set, get) => ({
  cart: null,
  cartItems: [],
  totalItems: 0,
  totalAmount: 0,
  loading: false,

  fetchCart: async () => {
    try {
      set({ loading: true });
      const res = await api.get("/cart");
      const cart = res.data;
      const items = cart.cartItems || [];
      set({
        cart,
        cartItems: items,
        totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: items.reduce((sum, item) => {
          console.log(item.product?.price);
          console.log(item.quantity);
          return sum + item.quantity * Number(item.product?.price);
        }, 0),
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },
  addToCart: async (productId, quantity = 1) => {
    try {
      const res = await api.post("/cart/items", { productId, quantity });
      const cart = res.data;
      const items = cart.cartItems || [];
      set({
        cart,
        cartItems: items,
        totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: items.reduce(
          (sum, item) => sum + item.quantity * Number(item.product?.price),
          0,
        ),
        loading: false,
      });
      return true;
    } catch {
      return false;
    }
  },
  updateItem: async (itemId, quantity) => {
    try {
      const res = await api.patch(`/cart/items/${itemId}`, { quantity });
      const cart = res.data;
      const items = cart.cartItems || [];
      set({
        cart,
        cartItems: items,
        totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: items.reduce(
          (sum, item) => sum + item.quantity * Number(item.product?.price),
          0,
        ),
        loading: false,
      });
    } catch {
      //silent
    }
  },
  removeItem: async (itemId) => {
    try {
      const res = await api.delete(`/cart/items/${itemId}`);
      const cart = res.data;
      const items = cart.cartItems || [];
      set({
        cart,
        cartItems: items,
        totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: items.reduce(
          (sum, item) => sum + item.quantity * Number(item.product?.price),
          0,
        ),
      });
    } catch {
      // silent
    }
  },
  clearCart: async () => {
    try {
      await api.delete("/cart");
      set({ cart: null, cartItems: [], totalItems: 0, totalAmount: 0 });
    } catch {
      //silent
    }
  },
  resetCart: () => {
    set({ cart: null, cartItems: [], totalItems: 0, totalAmount: 0 });
  },
}));

export default useCartStore;
