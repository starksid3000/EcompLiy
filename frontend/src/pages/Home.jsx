import React from "react";
import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

const Home = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <div className="flex flex-column">
      {/* Hero Section */}
      <div
        className="relative overflow-hidden border-round-3xl mb-6 shadow-4"
        style={{ minHeight: "65vh" }}
      >
        {/* Background Image */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://primefaces.org/cdn/primereact/images/galleria/galleria4.jpg')",
          }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 w-full h-full bg-black-alpha-30"></div>

        {/* Content */}
        <div className="relative z-1 flex flex-column align-items-center justify-content-center h-full py-8 px-4 text-center">
          <div
            className="surface-0 p-5 shadow-6 border-round-3xl mb-6 animation-duration-500 fadeinup"
            style={{
              backdropFilter: "blur(12px)",
              backgroundColor: "rgba(255,255,255,0.9)",
            }}
          >
            <i className="pi pi-shopping-bag text-primary text-6xl mb-4 block"></i>
            <h1
              className="text-6xl md:text-8xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-indigo-500"
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
              className="text-xl md:text-2xl text-700 font-medium mb-0 max-w-4xl line-height-3 mx-auto"
              style={{
                background: "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                lineHeight: "1.2",
              }}
            >
              Experience the most premium, seamless shopping destination built
              just for you. Discover curated collections and unmatched quality.
            </p>
          </div>

          <div className="flex flex-column md:flex-row gap-4 animation-duration-1000 fadeinup animation-ease-in-out">
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

      {/* Features Section */}
      <div className="grid mt-4">
        <div className="col-12 md:col-4 p-3 fadeinleft animation-duration-5">
          <div className="h-full p-4 surface-card shadow-2 border-round-xl border-1 border-gray-100 hover:shadow-6 transition-all transition-duration-300 transform hover:-translate-y-2 text-center">
            <div className="w-4rem h-4rem flex align-items-center justify-content-center bg-blue-100 border-circle mx-auto mb-4">
              <i className="pi pi-shield text-3xl text-blue-600"></i>
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
        <div className="col-12 md:col-4 p-3 fadeinup animation-duration-500">
          <div className="h-full p-4 surface-card shadow-2 border-round-xl border-1 border-gray-100 hover:shadow-6 transition-all transition-duration-300 transform hover:-translate-y-2 text-center">
            <div className="w-4rem h-4rem flex align-items-center justify-content-center bg-orange-100 border-circle mx-auto mb-4">
              <i className="pi pi-bolt text-3xl text-orange-600"></i>
            </div>
            <h3 className="text-2xl font-bold text-900 mb-3">Lightning Fast</h3>
            <p className="text-600 line-height-3 text-lg">
              Enjoy a blazing fast, seamless interface powered by React and
              cutting-edge web technologies.
            </p>
          </div>
        </div>
        <div className="col-12 md:col-4 p-3 fadeinright animation-duration-500">
          <div className="h-full p-4 surface-card shadow-2 border-round-xl border-1 border-gray-100 hover:shadow-6 transition-all transition-duration-300 transform hover:-translate-y-2 text-center">
            <div className="w-4rem h-4rem flex align-items-center justify-content-center bg-purple-100 border-circle mx-auto mb-4">
              <i className="pi pi-star text-3xl text-purple-600"></i>
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
