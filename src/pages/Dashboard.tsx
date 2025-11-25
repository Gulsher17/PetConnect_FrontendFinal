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
  
  // State for expandable request tabs in Requests section
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

  // Fetch ALL foster requests that the current user has submitted to ANY pet
  const fetchUserFosterRequests = async (userId: string) => {
    try {
      console.log("🚀 Fetching foster requests from new endpoint for user:", userId);
      
      const response = await http.get(`/foster-requests/my-requests`);
      
      console.log("✅ Response from foster-requests endpoint:", response.data);
      
      if (response.data.success) {
        const results = response.data.data || [];
        console.log(`✅ Found ${results.length} foster requests`);
        setFosterRequests(results);
        return results;
      } else {
        console.error("❌ API returned error:", response.data.message);
        setFosterRequests([]);
        return [];
      }
    } catch (err: any) {
      console.error("❌ Failed to fetch foster requests:", err);
      
      // Fallback to old method
      try {
        console.log("🔄 Trying fallback method...");
        const petsRes = await http.get("/pets");
        const allPets = Array.isArray(petsRes.data) ? petsRes.data : [];
        
        const fallbackResults: AnyObj[] = [];
        allPets.forEach((pet: AnyObj) => {
          const fosterRequests = pet.fosterRequests || [];
          fosterRequests.forEach((req: AnyObj) => {
            const requestUserId = req.user?._id ? String(req.user._id) : String(req.user);
            if (requestUserId === userId) {
              fallbackResults.push({
                ...req,
                type: "foster",
                pet: {
                  _id: pet._id,
                  name: pet.name,
                  images: pet.images,
                  breed: pet.breed,
                  age: pet.age,
                  gender: pet.gender,
                  location: pet.location,
                  status: pet.status,
                  listingType: pet.listingType,
                  owner: pet.owner,
                },
              });
            }
          });
        });
        
        console.log("🔄 Fallback results:", fallbackResults.length);
        setFosterRequests(fallbackResults);
        return fallbackResults;
      } catch (fallbackErr) {
        console.error("❌ All methods failed:", fallbackErr);
        setFosterRequests([]);
        return [];
      }
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
        await fetchUserFosterRequests(String(meData._id));
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
      fetchUserFosterRequests(String(me._id));
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
              {/*<Link to="/blockchain-demo" className="pc-btn pc-btn-outline">
                Blockchain Demo
                </Link>*/}
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

        {/* Overview Tab - Removed My Requests section */}
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

        {/* Requests Tab - Updated with expandable sections and professional UI */}
        {tab === "requests" && (
          <section className="space-y-6">
            <div className="pc-card p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">My Applications</h2>
              <p className="text-gray-600 mb-6">Track the status of your adoption and foster applications</p>
              
              <div className="space-y-4">
                {/* Adoption Requests Section */}
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <button
                    onClick={() => setExpandedRequestTab(expandedRequestTab === 'adoption' ? null : 'adoption')}
                    className="w-full px-6 py-4 text-left flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">Adoption Applications</h3>
                        <p className="text-sm text-gray-600">{requests.length} application{requests.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        requests.length > 0 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {requests.length} {requests.length === 1 ? 'request' : 'requests'}
                      </span>
                      <svg 
                        className={`w-5 h-5 text-gray-500 transform transition-transform ${
                          expandedRequestTab === 'adoption' ? 'rotate-180' : ''
                        }`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  
                  {expandedRequestTab === 'adoption' && (
                    <div className="p-6 border-t border-gray-200">
                      {requests.length ? (
                        <div className="grid md:grid-cols-2 gap-4">
                          {requests.map((r) => (
                            <RequestCard key={r?._id || r?.id} req={r} type="adoption" />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Adoption Applications</h3>
                          <p className="text-gray-600 mb-4">You haven't submitted any adoption applications yet.</p>
                          <Link to="/browse" className="pc-btn pc-btn-primary">
                            Browse Available Pets
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Foster Requests Section */}
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <button
                    onClick={() => setExpandedRequestTab(expandedRequestTab === 'foster' ? null : 'foster')}
                    className="w-full px-6 py-4 text-left flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">Foster Applications</h3>
                        <p className="text-sm text-gray-600">{fosterRequests.length} application{fosterRequests.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        fosterRequests.length > 0 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {fosterRequests.length} {fosterRequests.length === 1 ? 'request' : 'requests'}
                      </span>
                      <svg 
                        className={`w-5 h-5 text-gray-500 transform transition-transform ${
                          expandedRequestTab === 'foster' ? 'rotate-180' : ''
                        }`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  
                  {expandedRequestTab === 'foster' && (
                    <div className="p-6 border-t border-gray-200">
                      {fosterRequests.length ? (
                        <div className="grid md:grid-cols-2 gap-4">
                          {fosterRequests.map((r) => (
                            <RequestCard key={r?._id || r?.id} req={r} type="foster" />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Foster Applications</h3>
                          <p className="text-gray-600 mb-4">You haven't submitted any foster applications yet.</p>
                          <Link to="/browse" className="pc-btn pc-btn-primary">
                            Browse Available Pets
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    
    if (status === "approved") return `${baseClasses} bg-green-100 text-green-800`;
    if (status === "in_discussion") return `${baseClasses} bg-blue-100 text-blue-800`;
    if (status === "meeting_scheduled") return `${baseClasses} bg-purple-100 text-purple-800`;
    if (status === "pending") return `${baseClasses} bg-yellow-100 text-yellow-800`;
    if (status === "rejected") return `${baseClasses} bg-red-100 text-red-800`;
    return `${baseClasses} bg-gray-100 text-gray-800`;
  };

  const getTypeBadge = (type: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    return type === "foster" 
      ? `${baseClasses} bg-orange-100 text-orange-800` 
      : `${baseClasses} bg-indigo-100 text-indigo-800`;
  };

  const getStatusDisplay = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex gap-4">
        <img src={img} className="w-20 h-20 rounded-lg object-cover" alt={name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <p className="font-semibold text-gray-900 truncate">{name}</p>
            <span className={getTypeBadge(type)}>
              {type}
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Status:</span>
              <span className={getBadgeClass(status)}>{getStatusDisplay(status)}</span>
            </div>
            
            {req?.submittedAt && (
              <p className="text-xs text-gray-500">
                Applied: {new Date(req.submittedAt).toLocaleDateString()}
              </p>
            )}
            
            {req?.isCurrentFoster && (
              <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Currently fostering this pet
              </p>
            )}
          </div>
          
          <div className="mt-3">
            <Link 
              to={`/pet/${pid}`} 
              className="inline-flex items-center gap-1 text-sm font-medium text-[var(--pc-primary)] hover:underline"
            >
              View pet details
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {status === "approved" && (
        <div className="mt-3 p-2 rounded-lg bg-green-50 border border-green-200">
          <div className="flex items-center gap-2 text-green-800">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">
              {type === 'foster' ? 'Foster Approved!' : 'Adoption Approved!'}
            </span>
          </div>
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