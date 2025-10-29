// src/routes/PrivateRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";
import type { JSX } from "react";

export default function PrivateRoute({ children }: { children: JSX.Element }) {
  const { token, loading, profileIncomplete } = useAuth();

  if (loading) return <div className="p-8">Loading…</div>;
  if (!token) return <Navigate to="/login" replace />;
  if (profileIncomplete) return <Navigate to="/profile-setup" replace />;

  return children;
}
