import { useState, useEffect, useRef } from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Skeleton } from "primereact/skeleton";
import { Toast } from "primereact/toast";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import useCartStore from "../store/cartStore";
import api from "../utils/api";

const Home = () => {
  const navigate = useNavigate();
  const toast = useRef(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addToCart = useCartStore((s) => s.addToCart);

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    fetchFeatured();
  }, []);

  const fetchFeatured = async () => {
    try {
      const res = await api.get("/products", { params: { limit: 8, page: 1 } });
      setFeaturedProducts(res.data?.data || []);
    } catch {
      /* silent */
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      toast.current?.show({
        severity: "warn",
        summary: "Login required",
        detail: "Please login to add items to cart",
        life: 2000,
      });
      return navigate("/login");
    }
    try {
      await addToCart(product.id, 1);
      toast.current?.show({
        severity: "success",
        summary: "Added!",
        detail: `${product.name} added to cart`,
        life: 1500,
      });
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Could not add to cart",
        life: 2000,
      });
    }
  };
  return (
    <div className="flex flex-column">
      <Toast ref={toast} />

      {/* ──── Hero Section ──── */}
      <div
        className="relative overflow-hidden border-round-3xl mb-6 shadow-4"
        style={{ minHeight: "65vh" }}
      >
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://primefaces.org/cdn/primereact/images/galleria/galleria4.jpg')",
          }}
        />
        <div className="absolute inset-0 w-full h-full bg-black-alpha-30" />
        <div className="relative z-1 flex flex-column align-items-center justify-content-center h-full py-8 px-4 text-center">
          <div
            className="surface-0 p-5 shadow-6 border-round-3xl mb-6"
            style={{
              backdropFilter: "blur(12px)",
              backgroundColor: "rgba(255,255,255,0.9)",
            }}
          >
            <i className="pi pi-shopping-bag text-primary text-6xl mb-4 block" />
            <h1
              className="text-6xl md:text-8xl font-black mb-4"
              style={{
                background:
                  "linear-gradient(90deg, var(--primary-color), var(--indigo-500))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                lineHeight: "1.2",
              }}
            >
              Future of Retail
            </h1>
            <p
              className="text-xl md:text-2xl font-medium mb-0 max-w-4xl line-height-3 mx-auto"
              style={{
                background: "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Experience the most premium, seamless shopping destination built
              just for you. Discover curated collections and unmatched quality.
            </p>
          </div>
          <div className="flex flex-column md:flex-row gap-4">
            <Button
              label="Explore Collection"
              icon="pi pi-arrow-right"
              iconPos="right"
              size="large"
              className="p-button-rounded p-button-primary shadow-6 px-6 py-4 text-xl font-bold hover:scale-105 transition-transform transition-duration-300"
              onClick={() => navigate("/products")}
            />
            {!isAuthenticated && (
              <Button
                label="Join Now"
                icon="pi pi-user"
                size="large"
                outlined
                className="p-button-rounded p-button-primary shadow-6 px-6 py-4 text-xl font-bold hover:scale-105 transition-transform transition-duration-300"
                onClick={() => navigate("/register")}
              />
            )}
          </div>
        </div>
      </div>

      {/* ──── Featured Products ──── */}
      <div className="mb-6">
        <div className="flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="text-900 font-bold text-3xl m-0">
              Featured Products
            </h2>
            <p className="text-500 mt-1 mb-0">Handpicked for you</p>
          </div>
          <Button
            label="View All"
            icon="pi pi-arrow-right"
            iconPos="right"
            className="p-button-text p-button-sm"
            onClick={() => navigate("/products")}
          />
        </div>
        <div className="grid">
          {loadingProducts
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="col-12 md:col-6 lg:col-3 p-2">
                  <Skeleton height="350px" borderRadius="16px" />
                </div>
              ))
            : featuredProducts.map((product) => (
                <div key={product.id} className="col-12 md:col-6 lg:col-3 p-2">
                  <Card
                    title={
                      <span className="text-lg font-bold text-900 white-space-nowrap overflow-hidden text-overflow-ellipsis block">
                        {product.name}
                      </span>
                    }
                    subTitle={
                      <Tag
                        value={product.category || "Uncategorized"}
                        severity="info"
                        className="text-xs"
                      />
                    }
                    header={
                      <div
                        className="relative overflow-hidden cursor-pointer"
                        style={{ height: "200px" }}
                        onClick={() => navigate(`/products/${product.id}`)}
                      >
                        <img
                          src={
                            product.imageUrl ||
                            "https://primefaces.org/cdn/primereact/images/usercard.png"
                          }
                          className="w-full h-full"
                          style={{
                            objectFit: "cover",
                            transition: "transform 0.3s",
                          }}
                          onMouseOver={(e) =>
                            (e.target.style.transform = "scale(1.05)")
                          }
                          onMouseOut={(e) =>
                            (e.target.style.transform = "scale(1)")
                          }
                          alt={product.name}
                        />
                        {product.stock <= 5 && product.stock > 0 && (
                          <Tag
                            value="Low Stock"
                            severity="warning"
                            className="absolute"
                            style={{ top: "10px", right: "10px" }}
                          />
                        )}
                      </div>
                    }
                    footer={
                      <div className="flex justify-content-between align-items-center">
                        <span className="text-2xl font-bold text-primary">
                          ${Number(product.price).toFixed(2)}
                        </span>
                        <Button
                          label="Add to Cart"
                          icon="pi pi-shopping-cart"
                          className="p-button-rounded p-button-sm"
                          onClick={() => handleAddToCart(product)}
                        />
                      </div>
                    }
                    className="shadow-2 border-round-xl hover:shadow-6 transition-all transition-duration-300 h-full"
                  >
                    <p
                      className="m-0 text-600 line-height-3 text-sm"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {product.description || "No description available."}
                    </p>
                  </Card>
                </div>
              ))}
        </div>
      </div>

      {/* ──── Features Section ──── */}
      <div className="grid mt-2">
        <div className="col-12 md:col-4 p-3">
          <div className="h-full p-4 surface-card shadow-2 border-round-xl border-1 border-gray-100 hover:shadow-6 transition-all transition-duration-300 transform hover:-translate-y-2 text-center">
            <div className="w-4rem h-4rem flex align-items-center justify-content-center bg-blue-100 border-circle mx-auto mb-4">
              <i className="pi pi-shield text-3xl text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-900 mb-3">
              Secure Checkout
            </h3>
            <p className="text-600 line-height-3 text-lg">
              Your data is protected with state-of-the-art encryption algorithms
              ensuring total safety.
            </p>
          </div>
        </div>
        <div className="col-12 md:col-4 p-3">
          <div className="h-full p-4 surface-card shadow-2 border-round-xl border-1 border-gray-100 hover:shadow-6 transition-all transition-duration-300 transform hover:-translate-y-2 text-center">
            <div className="w-4rem h-4rem flex align-items-center justify-content-center bg-orange-100 border-circle mx-auto mb-4">
              <i className="pi pi-bolt text-3xl text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-900 mb-3">Lightning Fast</h3>
            <p className="text-600 line-height-3 text-lg">
              Enjoy a blazing fast, seamless interface powered by React and
              cutting-edge web technologies.
            </p>
          </div>
        </div>
        <div className="col-12 md:col-4 p-3">
          <div className="h-full p-4 surface-card shadow-2 border-round-xl border-1 border-gray-100 hover:shadow-6 transition-all transition-duration-300 transform hover:-translate-y-2 text-center">
            <div className="w-4rem h-4rem flex align-items-center justify-content-center bg-purple-100 border-circle mx-auto mb-4">
              <i className="pi pi-star text-3xl text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-900 mb-3">
              Premium Quality
            </h3>
            <p className="text-600 line-height-3 text-lg">
              Every product in our catalog meets the absolute highest standards
              of quality and excellence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
