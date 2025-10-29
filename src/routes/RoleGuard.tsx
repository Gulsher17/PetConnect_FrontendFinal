import { Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";

export default function RoleGuard({
  roles,
  children,
}: {
  roles: Array<"adopter" | "staff" | "vet" | "trainer" | "admin">;
  children: React.ReactNode;
}) {
  const { user, token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;

  if (!user) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  if (!roles.includes(user.role as any)) return <Navigate to="/" replace />;

  return <>{children}</>;
}
