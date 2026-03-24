import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Products from "./pages/Products";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute";
import ProductDetail from "./pages/ProductDetail";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/admin/AdminDashboard";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {/* Public route */}
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetail />} />
          {/* Authenticated Users route */}
          <Route path="cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
          <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          </Route>
        {/* Authenticated Admin route */}
        <Route path="admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>}/>
      </Routes>
    </Router>
  );
}

export default App;
