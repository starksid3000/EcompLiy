import useAuthStore from "../store/authStore";
import { Navigate } from "react-router-dom";
export const ProtectedRoute = (children) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};
export const AdminRoute = (children) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "ADMIN") return <Navigate to="/login" replace />;
  return children;
};
