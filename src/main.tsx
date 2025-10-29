// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import AppRouter from "./routes";
import { AuthProvider } from "./features/auth/useAuth";
import Providers from "./app/providers";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Providers>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </Providers>
  </React.StrictMode>
);
