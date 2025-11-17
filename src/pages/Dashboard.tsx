// src/pages/Dashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/layout/NavBar";
import Footer from "../components/layout/Footer";
import { useAuth } from "../features/auth/useAuth";
import { http } from "../lib/http";
import toast from "react-hot-toast";
import PetCard from "../components/layout/PetCard";
// import { SocketTest } from '../components/SocketTest';

type AnyObj = Record<string, any>;

export default function Dashboard() {
  const { user: authUser, token } = useAuth();

  const [loading, setLoading] = useState(true);

  const [me, setMe] = useState<AnyObj | null>(null);
  const [availablePets, setAvailablePets] = useState<AnyObj[]>([]);
  const [requests, setRequests] = useState<AnyObj[]>([]);
  const [favorites, setFavorites] = useState<AnyObj[]>([]);
  const [activity, setActivity] = useState<AnyObj[]>([]);
  const [myListings, setMyListings] = useState<AnyObj[]>([]); // personal listings

  const [tab, setTab] = useState<
    "overview" | "favorites" | "requests" | "activity" | "myListings">("overview");

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);

      // 1) Me (fallback to /auth/me)
      const meRes = await safeGet(() => http.get("/users/me"))
        .then(r => (r.ok ? r : safeGet(() => http.get("/auth/me"))));
      if (!meRes.ok || !meRes.data) {
        toast.error("Session error. Please sign in again.");
        setLoading(false);
        return;
      }
      const meData: AnyObj = meRes.data || {};
      if (mounted) setMe(meData);

      // 2) Favorites (resolve ids if needed)
      const favPets = await resolveFavorites(meData);
      if (mounted) setFavorites(favPets);

      // 3) Shelter/pet catalog
      const petsRes = await safeGet(() => http.get("/pets"));
      if (mounted) {
        const allPets: AnyObj[] = Array.isArray(petsRes.data) ? petsRes.data : [];
        const av = allPets.filter(p =>
          String(p?.status || "").toLowerCase().includes("available")
        );
        setAvailablePets(av);
      }

      // 4) My adoption requests
      const reqRes = await safeGet(() => http.get("/adoptions/my-requests"));
      if (mounted) {
        const reqs: AnyObj[] = Array.isArray(reqRes.data)
          ? reqRes.data
          : Array.isArray(reqRes.data?.requests)
          ? reqRes.data.requests
          : [];
        setRequests(reqs.filter(r => r && (r.pet || r.status)));
      }

      // 5) Activity (best effort)
      if (meData?._id) {
        const actRes = await safeGet(() => http.get(`/users/activity-logs/${meData._id}`));
        if (mounted) {
          const logs: AnyObj[] = Array.isArray(actRes.data)
            ? actRes.data
            : Array.isArray(actRes.data?.logs)
            ? actRes.data.logs
            : [];
          setActivity(logs);
        }
      }

      // 6)  My personal listings (authoritative source)
      const myListRes = await safeGet(() => http.get("/pet-files/my-listings"));
      if (mounted) {
        const listPayload = myListRes.data;
        const list = Array.isArray(listPayload?.listings)
          ? listPayload.listings
          : Array.isArray(listPayload)
          ? listPayload
          : [];
        setMyListings(list);
      }

      if (mounted) setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [token]);

  const stats = useMemo(() => {
    const favCount = favorites.length;
    const reqCount = requests.length;
    const memberSince = me?.createdAt ? new Date(me.createdAt) : null;
    return { favCount, reqCount, memberSince };
  }, [favorites, requests, me]);

  const displayStatus = useMemo(() => {
    if (me?.adoptionStatus) return me.adoptionStatus;
    const statuses = requests.map(r => String(r?.status || "").toLowerCase());
    if (statuses.includes("approved")) return "Approved — next steps";
    if (statuses.includes("meeting")) return "Meeting scheduled";
    if (statuses.length > 0) return "In progress";
    return "Active";
  }, [me, requests]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Please sign in…
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading…
      </div>
    );
  }

  const displayName = me?.name || authUser?.name || "Adopter";
  const displayEmail = me?.email || authUser?.email || "";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />

      <main className="max-w-7xl mx-auto w-full flex-grow p-6">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold" style={{ color: "var(--pc-primary)" }}>
                {displayName}
              </h1>
              {displayEmail && <p className="text-gray-600">{displayEmail}</p>}
              <div className="mt-3 flex items-center gap-2">
                {(me?.role || authUser?.role) && (
                  <span className="px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700">
                    {me?.role || authUser?.role}
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-sm bg-green-50 text-green-700">
                  {displayStatus}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Link to="/browse" className="pc-btn pc-btn-outline">
                Browse Pets
              </Link>
              <Link to="/blockchain-demo" className="pc-btn pc-btn-outline">
     Blockchain Demo
  </Link>
              <Link to="/profile-setup" className="pc-btn pc-btn-primary">
                Edit Profile
              </Link>
            </div>
          </div>
        </header>

        {/* Profile completion nudge */}
        {!me?.lifestyle && (
          <div className="bg-yellow-50 border border-yellow-300 text-yellow-900 rounded-xl p-4 mb-6 flex justify-between items-center">
            <span>Complete your profile to get personalized pet recommendations</span>
            <Link to="/profile-setup" className="pc-btn pc-btn-primary text-sm">
              Complete Profile
            </Link>
          </div>
        )}

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard title="Favorited Pets" value={stats.favCount} accent="text-indigo-600" />
          <StatCard title="Adoption Requests" value={stats.reqCount} accent="text-green-600" />
          <StatCard
            title="Member Since"
            value={stats.memberSince ? stats.memberSince.toLocaleDateString() : "—"}
          />

        </section>

        {/* Tabs */}
        <div className="border-b flex gap-6 text-lg mb-6">
          {(["overview", "favorites", "requests", "activity"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2 capitalize ${
                tab === t
                  ? "border-b-2 border-[var(--pc-primary)] text-[var(--pc-primary)] font-semibold"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t}
            </button>
          ))}

          {/* ✅ Only adopters can see "My Listings" */}
          {me?.role === "adopter" && (
            <button
              onClick={() => setTab("myListings")}
              className={`pb-2 capitalize ${
                tab === "myListings"
                  ? "border-b-2 border-[var(--pc-primary)] text-[var(--pc-primary)] font-semibold"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              My Listings
            </button>
          )}
        </div>

        {/* ✅ My Listings (uses /pet-files/my-listings) */}
        {tab === "myListings" && me?.role === "adopter" && (
          <section className="pc-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">My Listings</h2>
              <Link to="/create-listing" className="pc-btn pc-btn-primary text-sm">
                + Add Listing
              </Link>
            </div>
            {/* <SocketTest /> */}  // testing socket connection

            {Array.isArray(myListings) && myListings.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myListings.map((pet) => (
                  <MyListingCard key={pet._id} pet={pet} />
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center mt-4">
                You have no pet listings yet.
              </div>
            )}
          </section>
        )}

        {/* Other sections remain untouched */}
        {tab === "overview" && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="pc-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Available Pets</h2>
                  <Link to="/browse" className="text-sm text-[var(--pc-primary)] hover:underline">
                    See all
                  </Link>
                </div>
                {availablePets.length ? (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {availablePets.slice(0, 6).map((p) => (
                      <PetCard key={p?._id || p?.id} pet={p} />
                    ))}
                  </div>
                ) : (
                  <Empty text="No pets available right now." />
                )}
              </div>

              <div className="pc-card p-5">
                <h2 className="text-xl font-semibold mb-4">My Adoption Requests</h2>
                {requests.length ? (
                  <div className="grid sm:grid-cols-2 gap-5">
                    {requests.map((r) => (
                      <RequestCard key={r?._id || r?.id} req={r} />
                    ))}
                  </div>
                ) : (
                  <Empty text="You have no adoption requests yet." />
                )}
              </div>
            </div>

            <aside className="space-y-6">
              <div className="pc-card p-5">
                <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                {activity.length ? (
                  <ul className="space-y-3">
                    {activity.slice(0, 8).map((a, i) => (
                      <ActivityRow key={a?._id || i} item={a} />
                    ))}
                  </ul>
                ) : (
                  <Empty text="No recent activity to show." />
                )}
              </div>
            </aside>
          </section>
        )}

        {tab === "favorites" && (
          <section className="pc-card p-5">
            <h2 className="text-xl font-semibold mb-4">Your Favorites</h2>
            {favorites.length ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((pet) => (
                  <PetCard key={pet?._id || pet?.id} pet={pet} />
                ))}
              </div>
            ) : (
              <Empty text="No favorites yet." />
            )}
          </section>
        )}

        {tab === "requests" && (
          <section className="pc-card p-5">
            <h2 className="text-xl font-semibold mb-4">Adoption Requests</h2>
            {requests.length ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {requests.map((r) => (
                  <RequestCard key={r?._id || r?.id} req={r} />
                ))}
              </div>
            ) : (
              <Empty text="You have no adoption requests yet." />
            )}
          </section>
        )}

        {tab === "activity" && (
          <section className="pc-card p-5">
            <h2 className="text-xl font-semibold mb-4">Activity</h2>
            {activity.length ? (
              <ul className="space-y-3">
                {activity.map((a, i) => (
                  <ActivityRow key={a?._id || i} item={a} />
                ))}
              </ul>
            ) : (
              <Empty text="No recent activity to show." />
            )}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

/* ========== MyListingCard (UI-only; no backend changes) ========== */
function MyListingCard({ pet }: { pet: AnyObj }) {
  const img =
    Array.isArray(pet?.images)
      ? (pet.images[0]?.url || pet.images[0])
      : "/fallback.jpg";

  const status = String(pet?.status || "available_fostering");

  const onDelete = async () => {
    if (!confirm("Delete this listing?")) return;
    try {
      await http.delete(`/pet-files/user-pet/${pet._id}`);
      toast.success("Listing deleted!");
      // quick refresh of the tab (keeps rest of dashboard intact)
      window.location.reload();
    } catch (e: any) {
      toast.error(e?.response?.data?.msg || "Failed to delete listing.");
    }
  };

  return (
    <div className="pc-card p-4 flex flex-col gap-2">
      <img src={img} className="w-full h-40 object-cover rounded-lg" />
      <h3 className="font-bold text-lg">{pet?.name || "Pet"}</h3>
      {pet?.breed && <p className="text-sm text-gray-500">{pet.breed}</p>}
      <p className="text-sm text-gray-600 capitalize">Status: {status}</p>

      <div className="flex gap-2 mt-auto">
        <Link to={`/pet/${pet._id}`} className="pc-btn pc-btn-outline w-1/3 text-center">
          View
        </Link>
        <Link
          to={`/create-listing?edit=${pet._id}`}
          className="pc-btn pc-btn-primary w-1/3 text-center"
        >
          Edit
        </Link>
        <button onClick={onDelete} className="pc-btn pc-btn-danger w-1/3">
          Delete
        </button>
      </div>
    </div>
  );
}

/* ========== UI bits (unchanged) ========== */
function StatCard({ title, value, accent }: { title: string; value: number | string; accent?: string }) {
  return (
    <div className="pc-card p-5">
      <p className="text-gray-600">{title}</p>
      <p className={`text-3xl font-bold mt-2 ${accent ?? ""}`}>{value}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-gray-500">{text}</p>;
}

function RequestCard({ req }: { req: AnyObj }) {
  const pet = (req && req.pet) || {};
  const img = Array.isArray(pet?.images) && pet.images[0] ? pet.images[0] : "/fallback.jpg";
  const name = pet?.name || "Pet";
  const pid = pet?._id || pet?.id || "";
  const status = String(req?.status || "pending").toLowerCase();

  const badge =
    status === "approved"
      ? "bg-green-100 text-green-800"
      : status === "meeting"
      ? "bg-blue-100 text-blue-800"
      : status === "finalized"
      ? "bg-emerald-100 text-emerald-800"
      : status === "pending"
      ? "bg-yellow-100 text-yellow-800"
      : "bg-gray-100 text-gray-800";

  return (
    <div className="pc-card overflow-hidden">
      <div className="flex gap-4 p-4">
        <img src={img} className="w-20 h-20 rounded-lg object-cover" />
        <div className="flex-1">
          <p className="font-semibold">{name}</p>
          <p className="text-sm text-gray-600 capitalize">
            Status: <span className={`px-2 py-0.5 rounded-full text-xs ${badge}`}>{status}</span>
          </p>
          <div className="mt-2">
            <Link to={`/pet/${pid}`} className="text-[var(--pc-primary)] hover:underline text-sm">
              View pet
            </Link>
          </div>
        </div>
      </div>

      {status === "finalized" && (
        <div className="px-4 pb-4">
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-50 text-green-700">
            🎉 Adoption Finalized!
          </span>
        </div>
      )}
    </div>
  );
}

function ActivityRow({ item }: { item: AnyObj }) {
  const when = item?.createdAt ? new Date(item.createdAt).toLocaleDateString() : "";
  const action = String(item?.action || "");
  const label =
    action === "avatar_upload"
      ? "Uploaded Avatar"
      : action === "profile_update"
      ? "Updated Profile"
      : action === "request_created"
      ? "Created Adoption Request"
      : action || "Activity";

  return (
    <li className="flex items-start justify-between rounded-lg bg-gray-50 p-3">
      <div>
        <p className="font-medium">{label}</p>
        {item?.details && <p className="text-sm text-gray-600">{item.details}</p>}
      </div>
      <div className="text-sm text-gray-500 ml-3 whitespace-nowrap">{when}</div>
    </li>
  );
}

/* ========== helpers ========== */
async function safeGet<T = any>(fn: () => Promise<{ data: T }>) {
  try {
    const res = await fn();
    return { ok: true as const, data: res.data as T };
  } catch (_e: any) {
    return { ok: false as const, data: undefined as unknown as T };
  }
}

async function resolveFavorites(me: AnyObj | null): Promise<AnyObj[]> {
  if (!me?.favoritedPets || me.favoritedPets.length === 0) return [];
  const first = me.favoritedPets[0];
  if (first && typeof first === "object") {
    return (me.favoritedPets as AnyObj[]).filter(Boolean);
  }
  const ids: string[] = me.favoritedPets as string[];
  const results = await Promise.all(
    ids.map(async (id) => {
      try {
        const r = await http.get(`/pets/${id}`);
        return r.data;
      } catch {
        return null;
      }
    })
  );
  return results.filter(Boolean) as AnyObj[];
}
