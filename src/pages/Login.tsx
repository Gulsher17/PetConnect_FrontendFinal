// src/pages/Login.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NavBar from "../components/layout/NavBar";
import Footer from "../components/layout/Footer";
import { http } from "../lib/http";
import { useAuth } from "../features/auth/useAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { setTokenAndLoad, profileIncomplete } = useAuth();
  const nav = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);
    try {
      const { data } = await http.post("/auth/login", { email, password });
      await setTokenAndLoad(data.token);
      nav(profileIncomplete ? "/profile-setup" : "/app", { replace: true });
    } catch (e: any) {
      setErr("Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-xl mt-12">
        <h1 className="text-3xl font-extrabold text-[var(--pc-primary)]">Welcome back</h1>

        {err && <div className="mt-4 bg-red-100 text-red-700 p-3 rounded-lg text-sm">{err}</div>}

        <form className="space-y-5 mt-6" onSubmit={onSubmit}>
          <div>
            <label className="text-sm">Email</label>
            <input className="w-full border rounded-lg p-3 mt-1" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm">Password</label>
            <input className="w-full border rounded-lg p-3 mt-1" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>
          <button className="pc-btn pc-btn-primary w-full text-lg" disabled={submitting}>
            {submitting ? "Signing in…" : "Log In"}
          </button>
        </form>

        <p className="text-sm text-center mt-6">
          New here? <Link className="text-[var(--pc-primary)] underline" to="/signup">Create an account</Link>
        </p>
      </div>
    <Footer />
    </div>
  );
}
