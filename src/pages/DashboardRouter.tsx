// src/routes/DashboardRouter.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../lib/http";
import { useAuth } from "../features/auth/useAuth";

type AnyObj = Record<string, any>;

export default function DashboardRouter() {
  const { token } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!token) {
        nav("/login", { replace: true });
        return;
      }

      // Try /users/me then /auth/me (same pattern used elsewhere)
      const me = await (async (): Promise<AnyObj | null> => {
        try {
          const r1 = await http.get("/users/me");
          return r1.data;
        } catch {
          try {
            const r2 = await http.get("/auth/me");
            return r2.data;
          } catch {
            return null;
          }
        }
      })();

      if (!mounted) return;

      const role = String(me?.role || "").toLowerCase();
      if (role === "staff" || role === "admin") {
        nav("/staff", { replace: true });
      } else {
        nav("/dashboard", { replace: true }); // adopter dashboard (already exists)
      }
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {loading ? "Loading…" : null}
    </div>
  );
}
