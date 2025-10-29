// src/components/layout/NavBar.tsx
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/useAuth";
import Logo from "../brand/Logo";
import { useState, useRef, useEffect } from "react";

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initials =
    user?.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase() : "U";

  // ✅ support avatar as string or { url }
  const avatarUrl =
    typeof (user as any)?.avatar === "string"
      ? (user as any).avatar
      : (user as any)?.avatar?.url;

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ✅ Close dropdown on route change (prevents stuck-open menu)
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo (unchanged) */}
        <Link to="/" className="flex items-center gap-3">
          <Logo />
        </Link>


        {/* Right content */}
        <div>
          {!user ? (
            <Link
              to="/signup"
              className="px-5 py-2 bg-[var(--pc-primary)] text-white rounded-xl font-semibold hover:opacity-90 transition"
            >
              Get Started
            </Link>
          ) : (
            <div className="relative" ref={dropdownRef}>
              {/* Avatar / Initials button */}
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                className="h-10 w-10 rounded-full overflow-hidden bg-[var(--pc-primary-light)] flex items-center justify-center shadow-md focus:outline-none"
                onClick={() => setOpen(o => !o)}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    className="h-full w-full object-cover"
                    onError={e => {
                      // fallback to initials if image fails
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <span className="font-bold text-[var(--pc-primary)]">{initials}</span>
                )}
              </button>

              {/* Dropdown */}
              {open && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg py-2 z-50"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    role="menuitem"
                    onClick={() => {
                      navigate("/app");
                      setOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                  >
                    Dashboard
                  </button>

                  <button
                    role="menuitem"
                    onClick={() => {
                      navigate("/profile-setup");
                      setOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                  >
                    Edit Profile
                  </button>

                  <button
                    role="menuitem"
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
