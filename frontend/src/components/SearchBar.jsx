import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
// ─── Sub-component: Search Bar ───────────────────────────────────────────────
const SearchBar = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    const trimmed = query.trim();
    if (trimmed) navigate(`/products?search=${encodeURIComponent(trimmed)}`);
    if (!trimmed) {
      navigate("/products");
      return;
    }
  };
  return (
    <span className="p-input-icon-right w-full md:w-14rem lg:w-18rem">
      <i
        className="pi pi-search cursor-pointer"
        onClick={handleSearch}
        style={{ right: "0.75rem" }}
      />
      <InputText
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        placeholder="Search products…"
        className="w-full pr-4"
      />
    </span>
  );
};

export default SearchBar;
