import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useAuthStore from "../store/authStore";
import useCartStore from "../store/cartStore";
import { Skeleton } from "primereact/skeleton";
import api from "../utils/api";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";
import { InputNumber } from "primereact/inputnumber";
const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useRef(null);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addToCart = useCartStore((s) => s.addToCart);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/products/${id}`);
      const data = res.data?.data || res.data;
      setProduct(data);

      // Fetch related products from same category
      if (data?.categoryId) {
        try {
          const relRes = await api.get("/products", {
            params: { category: data.categoryId, limit: 4 },
          });
          const related = (relRes.data?.data || []).filter((p) => p.id !== id);
          setRelatedProducts(related.slice(0, 4));
        } catch {
          /* silent */
        }
      }
    } catch {
      setError("Product not found or failed to load.");
    } finally {
      setLoading(false);
    }
  };

  //handling add to cart
  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.current?.show({
        severity: "warn",
        summary: "Login required",
        detail: "Please login to add item to cart",
        life: 2000,
      });
      return navigate("/login");
    }
    setAdding(true);
    try {
      await addToCart(product.id, quantity);
      toast.current?.show({
        severity: "success",
        summary: "Added to cart",
        detail: `${quantity}x ${product.name} added`,
        life: 2000,
      });
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Could not add to cart",
        life: 2000,
      });
    } finally {
      setAdding(false);
    }
  };
  if (loading) {
    return (
      <div className="px-2 py-4 md:px-4 lg:px-6">
        <div className="grid">
          <div className="col-12 md:col-6 p-3">
            <Skeleton height="450px" borderRadius="16px" />
          </div>
          <div className="col-12 md:col-6 p-3">
            <Skeleton width="60%" height="2.5rem" className="mb-3" />
            <Skeleton width="30%" height="1.5rem" className="mb-4" />
            <Skeleton width="100%" height="5rem" className="mb-4" />
            <Skeleton width="40%" height="2.5rem" className="mb-4" />
            <Skeleton width="50%" height="3rem" />
          </div>
        </div>
      </div>
    );
  }
  if (error || !product) {
    return (
      <div className="flex flex-column align-items-center justify-content-center py-8">
        <i className="pi pi-exclamation-triangle text-6xl text-orange-500 mb-4" />
        <h2 className="text-700 font-medium mb-3">
          {error || "Product not found"}
        </h2>
        <Button
          label="Back to products"
          icon="pi pi-arrow-left"
          className="p-button-rounded"
          onClick={() => navigate("/products")}
        />
      </div>
    );
  }
  const stockStatus = (stock) => {
    if (stock === 0)
      return {
        label: "Out of Stock",
        severity: "danger",
        icon: "pi pi-times-circle",
      };
    if (stock <= 5)
      return {
        label: `Only ${stock} left!`,
        severity: "warning",
        icon: "pi pi-exclamation-triangle",
      };
    return {
      label: "In Stock",
      severity: "success",
      icon: "pi pi-check-circle",
    };
  };

  const stock = stockStatus(product.stock);
  return (
    <div className="px-2 py-4 md:px-4 lg:px-6">
      <Toast ref={toast} />
      {/* setting navigation */}
      <div className="flex align-items-center gap-2 mb-4 text-500">
        <span
          className="cursor-pointer hover:text-primary"
          onClick={() => navigate("/")}
        >
          Home
        </span>
        <i className="pi pi-chevron-right text-xs" />
        <span
          className="cursor-pointer hover:text-primary"
          onClick={() => navigate("/products")}
        >
          Products
        </span>
        <i className="pi pi-chevron-right text-xs" />
        <span className="text-900 font-medium">{product.name}</span>
      </div>

      {/* Product Detail */}
      <div className="grid">
        {/* image */}
        <div className="col-12 md:col-6 p-3">
          <div
            className="surface-card shadow-2 border-round-2xl overflow-hidden"
            style={{ maxHeight: "500px" }}
          >
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full"
              style={{ objectFit: "cover", maxHeight: "500px" }}
            />
          </div>
        </div>
        {/* product detial */}
        <div className="col-12 md:col-6 p-3">
          <div className="surface-card shadow-2 border-round-2xl p-5 h-full">
            {/* category name */}
            <Tag
              value={product.category || "Uncategorized"}
              severity="info"
              className="mb-3"
            />
            {/* name */}
            <h1 className="text-900 font-bold text-3xl md:text-4xl m-0 mb-3 line-height-2">
              {product.name}
            </h1>
            {/* Price */}
            <div className="flex align-items-center gap-3 mb-4">
              <span
                className="text-4xl font-black"
                style={{
                  background:
                    "linear-gradient(90deg, var(--primary-color), var(--indigo-500)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                ${Number(product.price).toFixed(2)}
              </span>
            </div>
            {/* stock status */}
            <div className="flex align-items-center gap-2 mb-4">
              <i
                className={`${stock.icon} text-${stock.severity === "success" ? "green" : stock.severity === "warning" ? "orange" : "red"}-500`}
              />
              <Tag value={stock.label} severity={stock.severity} />
            </div>
            <Divider />
            {/* description */}
            <h3 className="text-900 font-bold text-lg mb-2">Description</h3>
            <p className="text-600 line-height-3 text-base mb-4">
              {product.description || "No description available"}
            </p>
            <Divider />
            {/* info */}
            <div className="grid mb-4">
              <div className="col-6">
                <span className="text-500 text-sm block mb-1">SKU</span>
                <span className="text-900 font-mono font-semibold">
                  {product.sku || "N/A"}
                </span>
              </div>
              <div className="col-6">
                <span className="text-500 text-sm block mb1">Category</span>
                <span className="text-900 font-semibold">
                  {product.category}
                </span>
              </div>
              <div className="col-6 mt-2">
                <span className="text-500 text-sm block mb-1">Stock</span>
                <span className="text-900 font-semibold">
                  {product.stock} units
                </span>
              </div>
              <div className="col-6 mt-2">
                <span className="text-500 text-sm block mb-1">Status</span>
                <Tag
                  value={product.isActive ? "Active" : "InActive"}
                  severity={product.isActive ? "success" : "danger"}
                />
              </div>
            </div>
            {/* Add to cart */}
            {product.stock > 0 && product.isActive ? (
              <div className="flex flex-column sm:flex-row align-items-stretch sm:align-items-center gap-3">
                <div className="flex align-items-center gap-2">
                  <label className="font-semibold text-900">Qty:</label>
                  <InputNumber
                    value={quantity}
                    onValueChange={(e) => setQuantity(e.value)}
                    showButtons
                    buttonLayout="horizontal"
                    min={1}
                    max={product.stock}
                    decrementButtonClassName="p-button-outlined p-button-sm"
                    incrementButtonClassName="p-button-outlined p-button-sm"
                    incrementButtonIcon="pi pi-plus"
                    decrementButtonIcon="pi pi-minus"
                    inputClassName="w-4rem text-center font-bold"
                  />
                </div>
                <Button
                  label={adding ? "Adding..." : "Add to Cart"}
                  icon="pi pi-shopping-cart"
                  className="p-button-rounded p-button-lg flex-grow-1 font-bold shadow-3"
                  onClick={handleAddToCart}
                  loading={adding}
                  disabled={adding}
                />
              </div>
            ) : (
              <Button
                label={product.stock === 0 ? "Out of Stock" : "Unavilable"}
                icon="pi pi-times"
                className="p-button-rounded p-button-lg p-button-danger w-full"
                disabled
              />
            )}
          </div>
        </div>
      </div>

      {/* related product of same categories */}
      {relatedProducts.length > 0 && (
        <div className="mt-6">
          <h2 className="text-900 font-bold text-2xl mb-4">
            You May Also Like
          </h2>
          <div className="grid">
            {relatedProducts.map((rp) => (
              <div key={rp.id} className="col-12 md:col-6 lg:col-3 p-2">
                <div
                  className="surface-card shadow-2 border-round-xl overflow-hidden cursor-pointer hover:shadow-6 transition-all transition-duration-300"
                  onClick={() => navigate(`/products/${rp.id}`)}
                >
                  <img
                    src={
                      rp.imageUrl ||
                      "https://primefaces.org/cdn/primereact/images/usercard.png"
                    }
                    alt={rp.name}
                    className="w-full"
                    style={{ height: "180px", objectFit: "cover" }}
                  />
                  <div className="p-3">
                    <h4 className="text-900 font-bold m-0 mb-1 white-space-nowrap overflow-hidden text-overflow-ellipsis">
                      {rp.name}
                    </h4>
                    <span className="text-primary font-bold text-lg">
                      ${Number(rp.price).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default ProductDetail;
