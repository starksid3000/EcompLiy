import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { ProgressSpinner } from "primereact/progressspinner";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Paginator } from "primereact/paginator";
import api from "../utils/api";
import useAuthStore from "../store/authStore";
import useCartStore from "../store/cartStore";
import MobilePaginator from "../components/MobilePaginator";

const FALLBACK_IMG =
  "https://primefaces.org/cdn/primereact/images/usercard.png";
const VIEW_KEY = "products_view";
const Products = () => {
  const toast = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addToCart = useCartStore((s) => s.addToCart);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get("category") || null);
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem(VIEW_KEY) || "grid",
  );
  const [addingId, setAddingId] = useState(null);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(12);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchQuery = searchParams.get("search") || "";
  useEffect(() => {
    fetchCategories();
  }, []);
  useEffect(() => {
    const catId = searchParams.get("category");
    if (catId && catId !== selectedCategory) {
      setSelectedCategory(catId);
    }
  }, [searchParams]);
  useEffect(() => {
    fetchProducts();
  }, [first, rows, selectedCategory, searchQuery]);
  const fetchCategories = async () => {
    try {
      const res = await api.get("/category", { params: { limit: 50 } });
      const cats = (res.data?.data || []).map((c) => ({
        label: c.name,
        value: c.id,
      }));
      setCategories([{ label: "All categories", value: null }, ...cats]);
    } catch {
      //silent
    }
  };
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: Math.floor(first / rows) + 1,
        limit: rows,
      };
      if (selectedCategory !== null && selectedCategory !== undefined) {
        params.category = selectedCategory;
      }
      if (searchQuery) params.search = searchQuery;
      const res = await api.get("/products", { params });
      setProducts(res.data?.data || []);
      setTotalRecords(res.data?.meta?.total || 0);
      setError(null);
    } catch (err) {
      setError("Failed to fetch products. Please try again.", err);
    } finally {
      setLoading(false);
    }
  };
  const onPageChange = (e) => {
    setFirst(e.first);
    setRows(e.rows);
  };
  const switchView = (mode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_KEY, mode);
  };
  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      toast.current?.show({
        severity: "warn",
        summary: "Login Required",
        detail: "Please login to add items to your cart",
        life: 3000,
      });
      setTimeout(() => {
        navigate("/login");
      }, 1000);
      return
    }
    setAddingId(product.id);
    try {
      await addToCart(product.id);
      toast.current?.show({
        severity: "success",
        summary: "Added to Cart",
        detail: `${product.name} added to your cart`,
        life: 2000,
      });
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Failed",
        detail: "Could not add item to cart",
        life: 3000,
      });
    } finally {
      setAddingId(null);
    }
  };
  const header = (product) => (
    <div
      className="relative overflow-hidden"
      style={{ height: "220px" }}
      onClick={() => navigate(`/products/${product.id}`)}
    >
      <img
        alt={product.name}
        src={product.imageUrl || FALLBACK_IMG}
        className="w-full h-full"
        style={{ objectFit: "cover", transition: "transform 0.3s" }}
        onMouseOver={(e) => (e.target.style.transform = "scale(1.05)")}
        onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
      />
      {product.stock <= 5 && product.stock > 0 && (
        <Tag
          value="Limited Stock"
          severity="warning"
          className="absolute"
          style={{ top: "10px", right: "10px" }}
        />
      )}
      {product.stock === 0 && (
        <Tag
          value="Out of Stock"
          severity="danger"
          className="absolute"
          style={{ top: "10px", right: "10px" }}
        />
      )}
      {product.stock > 0 && !product.isActive && (
        <Tag
          value="Unavailable"
          severity="warning"
          className="absolute"
          style={{ top: "10px", right: "10px" }}
        />
      )}
    </div>
  );
  const footer = (product) => {
    const isAdding = addingId === product.id;
    return (
      <div className="flex flex-column gap-2">
        {product.isActive && product.stock > 0 && (
          <div className="flex align-items-center gap-2 text-green-600 text-xs font-semibold">
            <i className="pi pi-truck" />
            <span className="surface-100 px-2 py-1 border-round-lg">
              Free Delivery
            </span>
          </div>
        )}
        <div className="flex align-items-center justify-content-between gap-1">
          <span className="text-xl md:text-2xl font-bold text-primary">
            ${Number(product.price).toFixed(2)}
          </span>
          {product.stock === 0 || !product.isActive ? (
            <Button
              label={product.stock === 0 ? "Out of Stock" : "Unavailable"}
              icon="pi pi-times"
              className={`p-button-rounded p-button-sm p-button-${product.stock === 0 ? "danger" : "warning"
                } p-button-outlined`}
              disabled
            />
          ) : (
            <Button
              label={isAdding ? "Adding..." : "Add To Cart"}
              icon={isAdding ? "pi pi-spin pi-spinner" : "pi pi-shopping-cart"}
              className="p-button-rounded p-button-sm shadow-2"
              onClick={() => handleAddToCart(product)}
              disabled={isAdding}
            />
          )}
        </div>
      </div>
    );
  };
  const ListRow = ({ product }) => {
    const isAdding = addingId === product.id;
    const unavailable = product.stock === 0 || !product.isActive;
    return (
      <div
        className="surface-card shadow-1 border-round-xl overflow-hidden flex hover:shadow-4 transition-duration-300"
        style={{ minHeight: "180px" }}
      >
        <div
          className="flex-shrink-0 overflow-hidden cursor-pointer"
          style={{ width: "180px", minWidth: "180px", height: "180px" }}
          onClick={() => navigate(`/products/${product.id}`)}
        >
          <img
            src={product.imageUrl || FALLBACK_IMG}
            alt={product.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.3s",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.transform = "scale(1.07)")
            }
            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
          />
        </div>
        <div className="flex flex-column justify-content-between flex-1 p-3 min-w-0 gap-1">
          <span
            className="font-bold text-900 text-base line-height-2 cursor-pointer hover:text-primary transition-duration-200"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
            onClick={() => navigate(`/products/${product.id}`)}
          >
            {product.name}
          </span>
          <div className="flex align-items-center gap-2 flex-wrap">
            <Tag
              value={product.category || "General"}
              severity="info"
              className="text-xs"
            />
            {product.stock === 0 && (
              <Tag value="Out of Stock" severity="danger" className="text-xs" />
            )}
            {product.stock > 0 && product.stock <= 5 && (
              <Tag
                value={`Only ${product.stock} left`}
                severity="warning"
                className="text-xs"
              />
            )}
            {product.stock > 5 && product.isActive && (
              <Tag value="In Stock" severity="success" className="text-xs" />
            )}
          </div>
          <p
            className="m-0 text-500 text-xs line-height-3"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {product.description || "No description available."}
          </p>
          <div className="flex align-items-end justify-content-between gap-3 flex-wrap mt-1">
            <div className="flex flex-column gap-1">
              <span className="text-2xl font-bold text-primary">
                ${Number(product.price).toFixed(2)}
              </span>
              {product.isActive && product.stock > 0 && (
                <span className="text-xs text-green-600 font-semibold">
                  <i className="pi pi-truck mr-1" />
                  FREE delivery
                </span>
              )}
            </div>

            {unavailable ? (
              <Button
                label={product.stock === 0 ? "Out of Stock" : "Unavailable"}
                icon="pi pi-times-circle"
                className={`p-button-rounded p-button-sm p-button-outlined ${product.stock === 0 ? "p-button-danger" : "p-button-warning"
                  }`}
                disabled
              />
            ) : (
              <Button
                label={isAdding ? "Adding…" : "Add to Cart"}
                icon={
                  isAdding ? "pi pi-spin pi-spinner" : "pi pi-shopping-cart"
                }
                className="p-button-rounded p-button-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart(product);
                }}
                disabled={isAdding}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="flex flex-column align-items-center justify-content-center py-8">
        <i className="pi pi-exclamation-triangle text-5xl text-orange-500 mb-3" />
        <p className="text-xl text-700">{error}</p>
        <Button
          label="Retry"
          icon="pi pi-refresh"
          onClick={fetchProducts}
          className="mt-3"
        />
      </div>
    );
  }

  return (
    <div className="px-2 py-4 md:px-4 lg:px-6">
     
        <Toast ref={toast} />
      <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-5 gap-3">
        <div>
          <h1 className="text-900 font-bold text-4xl m-0 mb-2">Our Products</h1>
          <p className="text-600 text-lg m-0">
            Discover {totalRecords} amazing items selected just for you.
          </p>
         </div>
        <div className="flex align-items-center gap-3">
          <Dropdown
            value={selectedCategory}
            options={categories}
            optionValue="value"
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setFirst(0);
            }}
            placeholder="All Categories"
            className="w-15rem"
          />
            <div
            className="flex gap-1 border-round-lg p-1"
            style={{ background: "var(--surface-100)" }}
          >
            <Button
              icon="pi pi-th-large"
              className={`p-button-sm p-button-rounded ${viewMode === "grid" ? "" : "p-button-text p-button-secondary"
                }`}
              onClick={() => switchView("grid")}
              tooltip="Grid View"
              tooltipOptions={{ position: "top" }}
            />
             <Button
              icon="pi pi-list"
              className={`p-button-sm p-button-rounded ${viewMode === "list" ? "" : "p-button-text p-button-secondary"
                }`}
              onClick={() => switchView("list")}
              tooltip="List View"
              tooltipOptions={{ position: "top" }}
            />
          </div>
        </div>
        </div>
      {loading ? (
        <div className="flex justify-content-center align-items-center py-8">
          <ProgressSpinner />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-column align-items-center py-8">
          <i className="pi pi-inbox text-5xl text-400 mb-3" />
          <p className="text-xl text-600">No products found.</p>
        </div>
      ) : (
        <>
          {viewMode === "grid" && (
            <div className="grid">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="col-12 md:col-6 lg:col-4 xl:col-3 p-2"
                >
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
                    header={header(product)}
                    footer={footer(product)}
                    className="h-full flex flex-column justify-content-between shadow-3 border-round-xl overflow-hidden hover:shadow-6 transition-duration-300"
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
          )}
          {viewMode === "list" && (
            <div className="flex flex-column gap-2">
              {products.map((product) => (
                <ListRow key={product.id} product={product} />
              ))}
            </div>
          )}
          {totalRecords > rows && (
            <div className="flex justify-content-center mt-5">
              <MobilePaginator
                first={first}
                rows={rows}
                totalRecords={totalRecords}
                onPageChange={onPageChange}
              />
              <div className="hidden md:flex">
                <Paginator
                  first={first}
                  rows={rows}
                  totalRecords={totalRecords}
                  rowsPerPageOptions={[8, 12, 24]}
                  onPageChange={onPageChange}
                  className="border-round-xl"
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
export default Products;