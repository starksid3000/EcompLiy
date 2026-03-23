import React, { useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import useAuthStore from "../store/authStore";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", { email, password });
      login(
        response.data.accessToken,
        response.data.user,
        response.data.refreshToken,
      );
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex justify-content-center align-items-center min-h-screen"
      style={{
        background: "linear-gradient(135deg, #dbd9f4ff, #ffffffff)",
      }}
    >
      <div
        className="surface-card p-6 shadow-6 border-round-2xl w-full fadein animation-duration-300"
        style={{ maxWidth: "420px" }}
      >
        <div className="text-center mb-5">
          <i className="pi pi-shopping-cart text-primary text-5xl mb-3"></i>
          <h2 className="text-900 font-bold mb-2">Welcome Back</h2>
          <span className="text-600 text-sm">Login to continue shopping</span>
        </div>

        {error && (
          <Message severity="error" text={error} className="mb-4 w-full" />
        )}

        <form onSubmit={handleLogin} className="p-fluid flex flex-column gap-4">
          {/* Email */}
          <div className="field">
            <label htmlFor="email" className="font-medium mb-2 block">
              Email
            </label>
            <InputText
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              className="w-full p-3 border-round-lg"
              required
            />
          </div>

          {/* Password */}
          <div className="field">
            <label htmlFor="password" className="font-medium mb-2 block">
              Password
            </label>
            <Password
              inputId="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              feedback={false}
              toggleMask
              autoComplete="current-password"
              className="w-full"
              inputClassName="w-full p-3 border-round-lg"
              required
            />
          </div>

          {/* Forgot */}
          <div className="flex justify-content-end">
            <a className="text-sm text-primary hover:underline cursor-pointer">
              Forgot password?
            </a>
          </div>

          {/* Button */}
          <Button
            label={loading ? "Signing in..." : "Login"}
            icon={loading ? "pi pi-spin pi-spinner" : "pi pi-sign-in"}
            className="w-full p-3 text-lg font-semibold border-round-xl"
            type="submit"
            loading={loading}
            disabled={loading}
          />
        </form>

        <div className="mt-5 text-center text-sm">
          <span className="text-600">Don’t have an account? </span>
          <a
            href="/register"
            className="font-semibold text-primary hover:underline"
          >
            Register
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
