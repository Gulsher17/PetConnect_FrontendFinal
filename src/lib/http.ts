// src/lib/http.ts
import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL;

export const http = axios.create({
  baseURL,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers["x-auth-token"] = token;
  return config;
});
