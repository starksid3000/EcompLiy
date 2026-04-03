import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { InputText } from "primereact/inputtext";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const debounceTimeout = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Click outside listener to close dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    try {
      const res = await fetch(`/api/v1/products/suggestions?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSuggestions(data || []);
      setShowDropdown(true);
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 300); // 300ms Debounce Loop
  };

  const handleSearch = () => {
    setShowDropdown(false);
    const trimmed = query.trim();
    if (trimmed) navigate(`/products?search=${encodeURIComponent(trimmed)}`);
    if (!trimmed) {
      navigate("/products");
    }
  };

  const handleSuggestionClick = (id) => {
    setShowDropdown(false);
    navigate(`/products/${id}`);
  };

  return (
    <div className="relative w-full md:w-14rem lg:w-18rem" ref={dropdownRef}>
      <span className="p-input-icon-right w-full">
        <i
          className="pi pi-search cursor-pointer"
          onClick={handleSearch}
          style={{ right: "0.75rem", zIndex: 10 }}
        />
        <InputText
          value={query}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search products…"
          className="w-full pr-4"
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
        />
      </span>

      {/* Suggestion Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div 
          className="absolute left-0 w-full bg-white border-round shadow-4 mt-1 overflow-hidden" 
          style={{ top: '100%', zIndex: 1000, border: '1px solid #e5e7eb' }}
        >
          {suggestions.map((product) => (
            <div
              key={product.id}
              className="flex align-items-center p-2 hover:bg-gray-100 cursor-pointer transition-colors transition-duration-150"
              onClick={() => handleSuggestionClick(product.id)}
            >
              {product.imageUrl && (
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px', marginRight: '10px' }} 
                />
              )}
              <span className="text-sm font-medium text-gray-800 line-height-2" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {product.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
