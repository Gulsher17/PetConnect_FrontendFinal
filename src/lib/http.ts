// src/lib/http.ts
import axios from "axios";

export const http = axios.create({
  baseURL: "http://localhost:5001/api",
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers["x-auth-token"] = token;
  return config;
});
