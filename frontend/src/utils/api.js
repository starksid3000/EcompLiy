import axios from "axios";

const api = axios.create({
  baseURL: "/api/v1",
});
//Attaching accesstoken to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

//401 error handler
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      originalRequest.url.includes("/auth/login") ||
      originalRequest.url.includes("/auth/register")
    ) {
      return Promise.reject(error);
    }
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("accessToken");
        const res = await axios.post("/api/v1/auth/refresh", null, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        });
        const { accessToken } = res.data;

        localStorage.setItem("accessToken", accessToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);
export default api;
