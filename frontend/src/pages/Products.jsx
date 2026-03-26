import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "primereact/button";
import api from "../utils/api";
import useAuthStore from "../store/authStore";
import { Dropdown } from "primereact/dropdown";
import { ProgressSpinner } from "primereact/progressspinner";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Paginator } from "primereact/paginator";
import useCartStore from "../store/cartStore";
const Products = () => {
  const toast = useRef(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [addingId, setAddingId] = useState(null);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const searchQuery = searchParams.get("search") || "";

  //fetch cart
  const addToCart = useCartStore((s) => s.addToCart);
  useEffect(() => {
    fetchCategories();
  }, []);

  //fetch products keep rendering for array
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
  //handling add to cart
  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      toast.current?.show({
        severity: "warn",
        summary: "Login Required",
        detail: "Please login to add items to your cart",
        life: 3000,
      });
      return;
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
        src={
          product.imageUrl ||
          "https://primefaces.org/cdn/primereact/images/usercard.png"
        }
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
      <div className="flex flex-wrap justify-content-between align-items-center gap-2">
        <span className="text-2xl font-bold text-primary">
          ${Number(product.price).toFixed(2)}
        </span>

        {product.stock === 0 || !product.isActive ? (
          <Button
            label={product.stock === 0 ? "Out of Stock" : "Unavailable"}
            icon="pi pi-times"
            className={`p-button-rounded p-button-${product.stock === 0 ? "danger" : "warning"} p-button-small shadow-2`}
            disabled
          />
        ) : (
          <Button
            label={isAdding ? "Adding..." : "Add to Cart"}
            icon="pi pi-shopping-cart"
            className="p-button-rounded p-button-small shadow-2"
            onClick={() => handleAddToCart(product)}
            disabled={isAdding}
            loading={isAdding}
          />
        )}
      </div>
    );
  };
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

          {/* Pagination */}
          {totalRecords > rows && (
            <div className="flex justify-content-center mt-5">
              <Paginator
                first={first}
                rows={rows}
                totalRecords={totalRecords}
                rowsPerPageOptions={[8, 12, 24]}
                onPageChange={onPageChange}
                className="border-round-xl"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
export default Products;
