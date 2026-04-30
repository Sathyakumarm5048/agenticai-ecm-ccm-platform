/// <reference types="vite/client" />

import axios from "axios";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8008";

const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// -----------------------------------------------------
// REQUEST INTERCEPTOR — Inject Bearer Token
// -----------------------------------------------------
axiosInstance.interceptors.request.use((config) => {
  const token = window.localStorage.getItem("agenticai_access_token");

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// -----------------------------------------------------
// RESPONSE INTERCEPTOR — Unified Error Logging
// -----------------------------------------------------
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API request failed:", {
      url: error?.config?.url,
      method: error?.config?.method,
      status: error?.response?.status,
      data: error?.response?.data,
    });

    return Promise.reject(error);
  }
);

export default axiosInstance;