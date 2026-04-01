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
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    fetchFeatured();
    fetchCategories();
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

  const fetchCategories = async () => {
    try {
      const res = await api.get("/category", { params: { limit: 20 } });
      setCategories(res.data?.data || []);
    } catch {
      /* silent */
    } finally {
      setLoadingCategories(false);
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
      setTimeout(() => {
        navigate("/login");
      }, 1000);
      return;
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
      <div className="relative overflow-hidden border-round-3xl mb-6 shadow-4 min-h-[55vh] md:min-h-[70vh]">
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://primefaces.org/cdn/primereact/images/galleria/galleria4.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black-alpha-40 via-black-alpha-30 to-black-alpha-60" />

        <div className="relative z-1 flex flex-column align-items-center justify-content-center h-full px-3 md:px-5 py-6 md:py-8 text-center">
          <div
            className="p-4 md:p-6 border-round-3xl shadow-6 mb-5"
            style={{
              backdropFilter: "blur(7px)",
              background: "rgba(255,255,255,0.85)",
              maxWidth: "650px",
              width: "100%",
            }}
          >
            <i className="pi pi-shopping-bag text-primary text-4xl md:text-6xl mb-3 block" />

            <h1
              className="text-3xl md:text-6xl lg:text-7xl font-black mb-3"
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

            <p className="text-sm md:text-lg text-700 line-height-3 m-0">
              Experience premium, seamless shopping with curated collections and
              unmatched quality designed for modern customers.
            </p>
          </div>

          <div className="flex flex-column sm:flex-row gap-3 md:gap-4">
            <Button
              label="Explore Collection"
              icon="pi pi-arrow-right"
              iconPos="right"
              className="p-button-rounded p-button-primary px-5 py-3 md:px-6 md:py-4 text-sm md:text-lg font-semibold shadow-5 hover:scale-105 transition-transform"
              onClick={() => navigate("/products")}
            />

            {!isAuthenticated && (
              <Button
                label="Join Now"
                icon="pi pi-user"
                outlined
                className="p-button-rounded p-button-primary px-5 py-3 md:px-6 md:py-4 text-sm md:text-lg font-semibold shadow-5 hover:scale-105 transition-transform"
                onClick={() => navigate("/register")}
              />
            )}
          </div>
        </div>
      </div>

      {/* ──── Shop by Category ──── */}
      <div className="mb-6">
        <h2 className="text-900 font-bold text-3xl m-0 mb-4">Shop by Category</h2>
        <div 
          className="flex gap-4 overflow-x-auto pb-4" 
          style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}
        >
          {loadingCategories
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 flex flex-column align-items-center gap-2" style={{ width: '120px' }}>
                  <Skeleton shape="circle" size="100px" />
                  <Skeleton width="80%" className="mt-2" />
                </div>
              ))
            : categories.map((cat) => (
                <div 
                  key={cat.id} 
                  className="flex-shrink-0 flex flex-column align-items-center gap-2 cursor-pointer transition-transform hover:-translate-y-1 transition-duration-200"
                  style={{ width: '120px' }}
                  onClick={() => navigate(`/products?category=${cat.id}`)}
                >
                  <div 
                    className="border-circle overflow-hidden shadow-2 flex align-items-center justify-content-center surface-200"
                    style={{ width: '100px', height: '100px', border: '3px solid white' }}
                  >
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} className="w-full h-full" style={{ objectFit: 'cover' }} />
                    ) : (
                      <i className="pi pi-th-large text-4xl text-500" />
                    )}
                  </div>
                  <span className="font-semibold text-700 text-center w-full white-space-nowrap overflow-hidden text-overflow-ellipsis">
                    {cat.name}
                  </span>
                </div>
              ))}
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
            className="p-button-text p-button-small"
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
                      <div className="flex flex-wrap justify-content-between align-items-center gap-2">
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
