// src/pages/Dashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/layout/NavBar";
import Footer from "../components/layout/Footer";
import { useAuth } from "../features/auth/useAuth";
import { http } from "../lib/http";
import toast from "react-hot-toast";
import PetCard from "../components/layout/PetCard";
import MyListings from "../pages/MyListings";

type AnyObj = Record<string, any>;

export default function Dashboard() {
  const { user: authUser, token } = useAuth();

  const [loading, setLoading] = useState(true);

  const [me, setMe] = useState<AnyObj | null>(null);
  const [availablePets, setAvailablePets] = useState<AnyObj[]>([]);
  const [requests, setRequests] = useState<AnyObj[]>([]);
  const [fosterRequests, setFosterRequests] = useState<AnyObj[]>([]);
  const [favorites, setFavorites] = useState<AnyObj[]>([]);
  const [activity, setActivity] = useState<AnyObj[]>([]);
  const [myListings, setMyListings] = useState<AnyObj[]>([]);

  const [tab, setTab] = useState<
    "overview" | "favorites" | "requests" | "activity" | "myListings">("overview");
  
  // State for expandable request tabs
  const [expandedRequestTab, setExpandedRequestTab] = useState<"adoption" | "foster" | null>("adoption");

  // Fetch adoption requests from the correct endpoint
  const fetchAdoptionRequests = async () => {
    try {
      console.log('Fetching adoption requests...');
      const adoptionRes = await http.get("/adoptions/my-requests");
      console.log('Adoption response:', adoptionRes.data);
      
      let adoptionRequests: AnyObj[] = [];
      
      // Handle different response formats
      if (Array.isArray(adoptionRes.data)) {
        adoptionRequests = adoptionRes.data;
      } else if (Array.isArray(adoptionRes.data?.requests)) {
        adoptionRequests = adoptionRes.data.requests;
      } else if (Array.isArray(adoptionRes.data?.adoptions)) {
        adoptionRequests = adoptionRes.data.adoptions;
      }
      
      console.log('Processed adoption requests:', adoptionRequests.length);
      setRequests(adoptionRequests.filter(r => r && (r.pet || r.status)));
    } catch (error: any) {
      console.error('Error fetching adoption requests:', error);
      // If endpoint doesn't exist, try alternative
      if (error.response?.status === 404) {
        console.log('Adoption endpoint not found, trying pets endpoint...');
        await fetchAdoptionRequestsFromPets();
      }
    }
  };

  // Fallback: Fetch adoption requests from pets data
  const fetchAdoptionRequestsFromPets = async () => {
    try {
      const petsRes = await http.get("/pets");
      const allPets = Array.isArray(petsRes.data) ? petsRes.data : [];
      
      const userAdoptionRequests: AnyObj[] = [];
      const currentUserId = me?._id;
      
      allPets.forEach((pet: AnyObj) => {
        // Check if user is the adopter of this pet
        if (pet.adopter && (pet.adopter._id === currentUserId || pet.adopter === currentUserId)) {
          userAdoptionRequests.push({
            _id: `adoption-${pet._id}`,
            status: pet.status === 'Adopted' ? 'approved' : 'pending',
            submittedAt: pet.createdAt || new Date(),
            pet: {
              _id: pet._id,
              name: pet.name,
              images: pet.images,
              breed: pet.breed,
              age: pet.age,
              location: pet.location,
              status: pet.status,
              owner: pet.owner,
              description: pet.description
            },
            type: 'adoption'
          });
        }
      });
      
      setRequests(userAdoptionRequests);
    } catch (error) {
      console.error('Error fetching adoption requests from pets:', error);
    }
  };

  // Fetch ONLY foster requests that the current user has submitted (outgoing requests)
  const fetchUserFosterRequests = async () => {
    try {
      console.log('Fetching user foster requests...');
      
      // Get all pets and find ones where user has submitted foster requests
      const petsRes = await http.get("/pets");
      const allPets = Array.isArray(petsRes.data) ? petsRes.data : [];
      
      const userFosterRequests: AnyObj[] = [];
      const currentUserId = me?._id;
      
      console.log('Scanning', allPets.length, 'pets for user foster requests...');
      
      allPets.forEach((pet: AnyObj) => {
        // Skip if this pet belongs to the current user (we don't want requests TO user's own pets)
        const petOwnerId = pet.owner?._id || pet.owner;
        if (petOwnerId === currentUserId) {
          return; // Skip user's own pets
        }
        
        // Check foster requests array for requests made by current user
        if (pet.fosterRequests && Array.isArray(pet.fosterRequests)) {
          pet.fosterRequests.forEach((request: AnyObj) => {
            const requestUserId = request.user?._id || request.user;
            if (requestUserId === currentUserId) {
              console.log(`Found foster request by user for pet "${pet.name}":`, request.status);
              userFosterRequests.push({
                ...request,
                _id: request._id || `foster-${pet._id}-${requestUserId}`,
                pet: {
                  _id: pet._id,
                  name: pet.name,
                  images: pet.images,
                  breed: pet.breed,
                  age: pet.age,
                  gender: pet.gender,
                  location: pet.location,
                  status: pet.status,
                  owner: pet.owner,
                  description: pet.description,
                  listingType: pet.listingType
                },
                type: 'foster'
              });
            }
          });
        }
        
        // Also check if user is current foster of this pet (approved requests)
        if (pet.currentFoster && (pet.currentFoster._id === currentUserId || pet.currentFoster === currentUserId)) {
          console.log(`Found current foster assignment for pet "${pet.name}"`);
          userFosterRequests.push({
            _id: `current-foster-${pet._id}`,
            status: 'approved',
            submittedAt: pet.createdAt || new Date(),
            pet: {
              _id: pet._id,
              name: pet.name,
              images: pet.images,
              breed: pet.breed,
              age: pet.age,
              gender: pet.gender,
              location: pet.location,
              status: pet.status,
              owner: pet.owner,
              description: pet.description,
              listingType: pet.listingType
            },
            type: 'foster',
            isCurrentFoster: true
          });
        }
      });
      
      console.log('Total user foster requests found:', userFosterRequests.length);
      setFosterRequests(userFosterRequests);
    } catch (error: any) {
      console.error('Error fetching user foster requests:', error);
      setFosterRequests([]);
    }
  };

  // Add fetchMyListings function for refreshing listings
  const fetchMyListings = async () => {
    try {
      const myListRes = await safeGet(() => http.get("/pet-files/my-listings"));
      const listPayload = myListRes.data;
      const list = Array.isArray(listPayload?.listings)
        ? listPayload.listings
        : Array.isArray(listPayload)
        ? listPayload
        : [];
      setMyListings(list);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    }
  };

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
      await fetchAdoptionRequests();

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

      // 6) My personal listings (authoritative source)
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

      // 7) Fetch ONLY user's foster requests (requests user made to others)
      if (mounted && meData?._id) {
        await fetchUserFosterRequests();
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token]);

  // Refresh requests when tab changes
  useEffect(() => {
    if (me?._id && tab === 'requests') {
      fetchAdoptionRequests();
      fetchUserFosterRequests();
    }
  }, [me, tab]);

  const stats = useMemo(() => {
    const favCount = favorites.length;
    const reqCount = requests.length + fosterRequests.length;
    const memberSince = me?.createdAt ? new Date(me.createdAt) : null;
    return { favCount, reqCount, memberSince };
  }, [favorites, requests, fosterRequests, me]);

  const displayStatus = useMemo(() => {
    if (me?.adoptionStatus) return me.adoptionStatus;
    const allStatuses = [
      ...requests.map(r => String(r?.status || "").toLowerCase()),
      ...fosterRequests.map(r => String(r?.status || "").toLowerCase())
    ];
    if (allStatuses.includes("approved")) return "Approved — next steps";
    if (allStatuses.includes("meeting_scheduled")) return "Meeting scheduled";
    if (allStatuses.includes("in_discussion")) return "In discussion";
    if (allStatuses.length > 0) return "In progress";
    return "Active";
  }, [me, requests, fosterRequests]);

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
          <StatCard title="Total Requests" value={stats.reqCount} accent="text-green-600" />
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

        {/* ✅ My Listings with Full Fostering Flow */}
        {tab === "myListings" && me?.role === "adopter" && (
          <MyListings />
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
                <h2 className="text-xl font-semibold mb-4">My Requests</h2>
                <div className="space-y-4">
                  {/* Adoption Requests Section */}
                  <div className="border rounded-lg">
                    <button
                      onClick={() => setExpandedRequestTab(expandedRequestTab === 'adoption' ? null : 'adoption')}
                      className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-gray-50"
                    >
                      <span className="font-semibold">Adoption Requests ({requests.length})</span>
                      <svg 
                        className={`w-5 h-5 transform transition-transform ${
                          expandedRequestTab === 'adoption' ? 'rotate-180' : ''
                        }`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedRequestTab === 'adoption' && (
                      <div className="px-4 pb-4">
                        {requests.length ? (
                          <div className="grid sm:grid-cols-2 gap-4">
                            {requests.map((r) => (
                              <RequestCard key={r?._id || r?.id} req={r} type="adoption" />
                            ))}
                          </div>
                        ) : (
                          <Empty text="You have no adoption requests yet." />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Foster Requests Section */}
                  <div className="border rounded-lg">
                    <button
                      onClick={() => setExpandedRequestTab(expandedRequestTab === 'foster' ? null : 'foster')}
                      className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-gray-50"
                    >
                      <span className="font-semibold">My Foster Applications ({fosterRequests.length})</span>
                      <svg 
                        className={`w-5 h-5 transform transition-transform ${
                          expandedRequestTab === 'foster' ? 'rotate-180' : ''
                        }`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedRequestTab === 'foster' && (
                      <div className="px-4 pb-4">
                        {fosterRequests.length ? (
                          <div className="grid sm:grid-cols-2 gap-4">
                            {fosterRequests.map((r) => (
                              <RequestCard key={r?._id || r?.id} req={r} type="foster" />
                            ))}
                          </div>
                        ) : (
                          <Empty text="You haven't applied to foster any pets yet." />
                        )}
                      </div>
                    )}
                  </div>
                </div>
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
            <h2 className="text-xl font-semibold mb-4">My Applications</h2>
            <div className="space-y-6">
              {/* Adoption Requests */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Adoption Applications ({requests.length})</h3>
                {requests.length ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {requests.map((r) => (
                      <RequestCard key={r?._id || r?.id} req={r} type="adoption" />
                    ))}
                  </div>
                ) : (
                  <Empty text="You have no adoption applications yet." />
                )}
              </div>

              {/* Foster Requests */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Foster Applications ({fosterRequests.length})</h3>
                {fosterRequests.length ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {fosterRequests.map((r) => (
                      <RequestCard key={r?._id || r?.id} req={r} type="foster" />
                    ))}
                  </div>
                ) : (
                  <Empty text="You haven't applied to foster any pets yet." />
                )}
              </div>
            </div>
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

/* ========== UI bits ========== */
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

function RequestCard({ req, type = "adoption" }: { req: AnyObj; type?: "adoption" | "foster" }) {
  const pet = (req && req.pet) || {};
  
  // Handle different image formats
  let img = "/fallback.jpg";
  if (Array.isArray(pet?.images) && pet.images.length > 0) {
    const firstImage = pet.images[0];
    img = firstImage.url || firstImage;
  }
  
  const name = pet?.name || req?.petName || "Pet";
  const pid = pet?._id || pet?.id || "";
  const status = String(req?.status || "pending").toLowerCase();

  const getBadgeClass = (status: string) => {
    const baseClasses = "px-2 py-0.5 rounded-full text-xs font-medium";
    
    if (status === "approved") return `${baseClasses} bg-green-100 text-green-800`;
    if (status === "in_discussion") return `${baseClasses} bg-blue-100 text-blue-800`;
    if (status === "meeting_scheduled") return `${baseClasses} bg-purple-100 text-purple-800`;
    if (status === "pending") return `${baseClasses} bg-yellow-100 text-yellow-800`;
    if (status === "rejected") return `${baseClasses} bg-red-100 text-red-800`;
    return `${baseClasses} bg-gray-100 text-gray-800`;
  };

  const getTypeBadge = (type: string) => {
    const baseClasses = "px-2 py-0.5 rounded-full text-xs font-medium";
    return type === "foster" 
      ? `${baseClasses} bg-orange-100 text-orange-800` 
      : `${baseClasses} bg-indigo-100 text-indigo-800`;
  };

  const getStatusDisplay = (status: string) => {
    return status.replace(/_/g, ' ');
  };

  return (
    <div className="pc-card overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex gap-4 p-4">
        <img src={img} className="w-20 h-20 rounded-lg object-cover" alt={name} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-gray-900">{name}</p>
            <span className={getTypeBadge(type)}>
              {type}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Status: <span className={getBadgeClass(status)}>{getStatusDisplay(status)}</span>
          </p>
          {req?.submittedAt && (
            <p className="text-xs text-gray-500 mb-2">
              Applied: {new Date(req.submittedAt).toLocaleDateString()}
            </p>
          )}
          {req?.isCurrentFoster && (
            <p className="text-xs text-green-600 font-medium">
              ✓ Currently fostering this pet
            </p>
          )}
          <div className="mt-2">
            <Link to={`/pet/${pid}`} className="text-[var(--pc-primary)] hover:underline text-sm font-medium">
              View pet details
            </Link>
          </div>
        </div>
      </div>

      {status === "approved" && (
        <div className="px-4 pb-4">
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 font-medium">
            🎉 {type === 'foster' ? 'Foster Approved!' : 'Adoption Approved!'}
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
      : action === "foster_request_created"
      ? "Created Foster Request"
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