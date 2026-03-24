import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { ProgressSpinner } from "primereact/progressspinner";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes, ordersRes] = await Promise.all([
        api.get("/products", { params: { limit: 1 } }),
        api.get("/category", { params: { limit: 1 } }),
        api.get("/orders/admin/all", { params: { limit: 1 } }),
      ]);
      setStats({
        totalProducts: productsRes.data?.meta?.total || 0,
        totalCategories: categoriesRes.data?.meta?.total || 0,
        totalOrders: ordersRes.data?.meta?.total || ordersRes.data?.total || 0,
      });
    } catch {
      setStats({ totalProducts: 0, totalCategories: 0, totalOrders: 0 });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-content-center py-8">
        <ProgressSpinner />
      </div>
    );
  }

  const cards = [
    {
      title: "Products",
      value: stats?.totalProducts || 0,
      icon: "pi pi-box",
      color: "bg-blue-100",
      iconColor: "text-blue-600",
      link: "/admin/products",
    },
    {
      title: "Categories",
      value: stats?.totalCategories || 0,
      icon: "pi pi-tags",
      color: "bg-purple-100",
      iconColor: "text-purple-600",
      link: "/admin/category",
    },
    {
      title: "Orders",
      value: stats?.totalOrders || 0,
      icon: "pi pi-shopping-cart",
      color: "bg-green-100",
      iconColor: "text-green-600",
      link: "/admin/orders",
    },
  ];

  return (
    <div className="px-2 py-4 md:px-4">
      <h1 className="text-900 font-bold text-3xl mb-2">
        <i className="pi pi-th-large mr-3 text-primary" />
        Admin Dashboard
      </h1>
      <p className="text-600 text-lg mb-5">Manage your store from one place.</p>

      <div className="grid">
        {cards.map((card, idx) => (
          <div key={idx} className="col-12 md:col-4 p-2">
            <div
              className="surface-card shadow-2 border-round-xl p-4 cursor-pointer hover:shadow-6 transition-duration-300"
              onClick={() => navigate(card.link)}
            >
              <div className="flex align-items-center gap-4">
                <div
                  className={`w-4rem h-4rem flex align-items-center justify-content-center border-circle ${card.color}`}
                >
                  <i className={`${card.icon} text-3xl ${card.iconColor}`} />
                </div>
                <div>
                  <span className="text-500 font-medium text-sm block mb-1">
                    {card.title}
                  </span>
                  <span className="text-900 font-bold text-3xl">
                    {card.value}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-900 font-bold text-xl mt-6 mb-4">Quick Actions</h2>
      <div className="grid">
        <div className="col-12 md:col-6 lg:col-4 p-2">
          <Card
            className="shadow-2 border-round-xl cursor-pointer hover:shadow-6 transition-duration-300"
            onClick={() => navigate("/admin/products")}
          >
            <div className="flex align-items-center gap-3">
              <i className="pi pi-plus-circle text-3xl text-primary" />
              <div>
                <h3 className="m-0 text-900 font-bold">Manage Products</h3>
                <p className="m-0 text-500 text-sm mt-1">
                  Add, edit, or remove products
                </p>
              </div>
            </div>
          </Card>
        </div>
        <div className="col-12 md:col-6 lg:col-4 p-2">
          <Card
            className="shadow-2 border-round-xl cursor-pointer hover:shadow-6 transition-duration-300"
            onClick={() => navigate("/admin/orders")}
          >
            <div className="flex align-items-center gap-3">
              <i className="pi pi-list text-3xl text-orange-500" />
              <div>
                <h3 className="m-0 text-900 font-bold">Manage Orders</h3>
                <p className="m-0 text-500 text-sm mt-1">
                  View and update order statuses
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
