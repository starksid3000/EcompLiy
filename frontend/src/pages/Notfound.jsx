import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div
      className="flex flex-column align-items-center justify-content-center text-center"
      style={{ minHeight: "60vh", padding: "2rem" }}
    >
      <div
        className="mb-4 flex align-items-center justify-content-center border-circle bg-primary"
        style={{ width: "96px", height: "96px" }}
      >
        <i className="pi pi-exclamation-triangle text-white text-5xl" />
      </div>

      <h1 className="text-900 font-bold mb-2" style={{ fontSize: "5rem", lineHeight: 1 }}>
        404
      </h1>
      <h2 className="text-700 font-semibold text-2xl mb-3">Page Not Found</h2>
      <p className="text-500 text-lg mb-5" style={{ maxWidth: "420px" }}>
        The page you're looking for doesn't exist or has been moved.
      </p>

      <div className="flex gap-3 flex-wrap justify-content-center">
        <Button
          label="Go Home"
          icon="pi pi-home"
          className="p-button-rounded font-semibold"
          onClick={() => navigate("/")}
        />
        <Button
          label="Browse Products"
          icon="pi pi-shopping-bag"
          className="p-button-rounded p-button-outlined font-semibold"
          onClick={() => navigate("/products")}
        />
      </div>
    </div>
  );
};

export default NotFound;
