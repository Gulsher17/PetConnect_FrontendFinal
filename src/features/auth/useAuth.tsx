// src/features/auth/useAuth.tsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { http } from "../../lib/http";

export const hasActiveRequest = (user: any) =>
  user?.adoptionStatus === "active";

type User = {
  _id: string;
  email: string;
  role: "adopter" | "vet" | "staff" | "trainer" | "admin";
  name?: string;
  avatar?: string | { url: string; public_id?: string };
  location?: string;
  lifestyle?: { activityLevel?: string,homeType?: string;
    personalityTraits?: string[];
    allergies?: string[]; };
    favoritedPets?: string[];
};

type Ctx = {
  user: User | null;
  token: string | null;
  loading: boolean;
  setTokenAndLoad: (token: string) => Promise<void>;
  logout: () => void;
  profileIncomplete: boolean;
};

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("access_token"));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(!!token);

  useEffect(() => {
    const boot = async () => {
      if (!token) return setLoading(false);
      try {
        const { data } = await http.get("/auth/me");
        setUser(data);
        localStorage.setItem("user", JSON.stringify(data));
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, [token]);

  const setTokenAndLoad = async (t: string) => {
    localStorage.setItem("access_token", t);
    setToken(t);
    setLoading(true);
    try {
      const { data } = await http.get("/auth/me");
      setUser(data);
      localStorage.setItem("user", JSON.stringify(data));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
  };

  const profileIncomplete = useMemo(() => {
    if (!user) return false;
    return !user.name || !user.location; // your rule
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, token, loading, setTokenAndLoad, logout, profileIncomplete }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
