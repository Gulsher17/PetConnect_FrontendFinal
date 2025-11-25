// ✅ Updated: src/pages/PetProfile.tsx
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import NavBar from "../components/layout/NavBar";
import Footer from "../components/layout/Footer";
import { http } from "../lib/http";
import { useAuth } from "../features/auth/useAuth";
import { useState, useEffect } from "react";

const base = import.meta.env.VITE_FILE_BASE_URL;

type AnyObj = Record<string, any>;

function normalizeImages(images: any): string[] {
  if (!images) return ["/fallback.jpg"];
  if (typeof images === "string") return [images];
  if (Array.isArray(images)) {
    const out: string[] = [];
    for (const i of images) {
      if (!i) continue;
      if (typeof i === "string") out.push(i);
      else if (typeof i === "object" && i.url) out.push(i.url);
    }
    return out.length ? out : ["/fallback.jpg"];
  }
  if (typeof images === "object" && images.url) return [images.url];
  return ["/fallback.jpg"];
}

// ✅ CORRECTED: Determine poster based on status
function posterLabel(pet: AnyObj): string {
  const status = String(pet?.status || "").toLowerCase();
  
  // Available status = Shelter
  if (status === "available") return "Shelter";
  
  // available_fostering status = Individual
  if (status === "available_fostering") return "Individual";
  
  // Fallback to existing logic if status doesn't match
  if (pet?.orgPostedBy || pet?.organization) return "Shelter";
  if (pet?.userPostedBy || pet?.owner || pet?.isPersonalListing) return "Individual";
  
  return "—";
}

export default function PetProfile() {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [adoptionRequests, setAdoptionRequests] = useState<AnyObj[]>([]);
  const [fosterRequests, setFosterRequests] = useState<AnyObj[]>([]);

  // Fetch user's adoption requests
  const fetchAdoptionRequests = async () => {
    try {
      const response = await fetch(`${base}/adoptions/my-requests`, {
        headers: {
          "x-auth-token": token!,
        },
      });
      const result = await response.json();
      
      let adoptionRequests: AnyObj[] = [];
      
      if (Array.isArray(result)) {
        adoptionRequests = result;
      } else if (Array.isArray(result?.requests)) {
        adoptionRequests = result.requests;
      } else if (Array.isArray(result?.adoptions)) {
        adoptionRequests = result.adoptions;
      }
      
      setAdoptionRequests(adoptionRequests.filter(r => r && (r.pet || r.status)));
    } catch (error: any) {
      console.error('Error fetching adoption requests:', error);
      setAdoptionRequests([]);
    }
  };

  // Fetch user's foster requests
  const fetchUserFosterRequests = async () => {
    try {
      const response = await fetch(`${base}/foster-requests/my-requests`, {
        headers: {
          "x-auth-token": token!,
        },
      });
      const result = await response.json();
      
      if (result.success) {
        setFosterRequests(result.data || []);
      } else {
        console.error("API returned error:", result.message);
        setFosterRequests([]);
      }
    } catch (err: any) {
      console.error("Failed to fetch foster requests:", err);
      setFosterRequests([]);
    }
  };

  // Load user requests when component mounts
  useEffect(() => {
    if (token) {
      fetchAdoptionRequests();
      fetchUserFosterRequests();
    }
  }, [token]);

  const { data, isLoading, error } = useQuery<AnyObj>({
    queryKey: ["pet", id],
    queryFn: async () => {
      const res = await http.get(`/pets/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  // Check if user has already requested this pet
  const hasUserRequestedAdoption = adoptionRequests.some(request => 
    request.pet && (request.pet._id === id || request.petId === id)
  );

  const hasUserRequestedFoster = fosterRequests.some(request => 
    request.pet && (request.pet._id === id || request.petId === id)
  );

  const hasUserRequested = hasUserRequestedAdoption || hasUserRequestedFoster;

  // Action handlers
  const adoptPet = async () => {
    if (!confirm('Are you sure you want to adopt this pet?')) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch(`${base}/pets/${id}/adopt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token!
        }
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('Adoption request submitted successfully!');
        await fetchAdoptionRequests();
        window.location.reload();
      } else {
        alert(result.msg || 'Failed to submit adoption request');
      }
    } catch (error) {
      console.error('Adoption error:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const fosterPet = async () => {
    const fosterMessage = prompt("Why would you like to foster this pet? (Optional)");
    
    setIsProcessing(true);
    try {
      const response = await fetch(`${base}/pets/${id}/foster`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token!
        },
        body: JSON.stringify({ message: fosterMessage })
      });

      const result = await response.json();
      
      if (response.ok) {
        alert(result.msg || 'Foster request submitted successfully!');
        await fetchUserFosterRequests();
        window.location.reload();
      } else {
        alert(result.msg || 'Failed to submit foster request');
      }
    } catch (error) {
      console.error('Foster error:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const addToFavorites = async () => {
    try {
      const response = await fetch(`${base}/users/favorites/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token!
        }
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('Added to favorites!');
      } else {
        alert(result.msg || 'Failed to add to favorites');
      }
    } catch (error) {
      console.error('Favorite error:', error);
      alert('Network error. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        Failed to load pet.
      </div>
    );
  }

  const pet = data;
  const photos = normalizeImages(pet?.images);

  // ✅ ownership check
  const ownerId = typeof pet?.owner === "object" ? pet.owner?._id : pet?.owner;
  const isMine = ownerId && user?._id && ownerId === user._id;

  // ✅ foster duration for personal listings
  const duration = pet?.duration
    ? String(pet.duration)
        .replace("short_term", "1–2 weeks")
        .replace("medium_term", "3–4 weeks")
        .replace("long_term", "1+ months")
    : null;

  const name = pet?.name || "Unnamed";
  const breed = pet?.breed || "Unknown";
  const age = pet?.age ?? "—";
  const size = pet?.size ?? "—";
  const color = pet?.color ?? "—";
  const sex = pet?.sex ?? pet?.gender ?? "—";
  
  const status = pet?.status ? String(pet.status) : "";
  // ✅ CORRECTED: Poster label based on status
  const postedBy = status.toLowerCase() === "available" ? "Shelter" : 
                   status.toLowerCase() === "available_fostering" ? "Individual" : 
                   "—";

  // ✅ CORRECTED: Determine correct button based on status
  const getActionButton = () => {
    // If user owns the pet or has already requested
    if (isMine || hasUserRequested) {
      return (
        <button
          disabled
          className="pc-btn pc-btn-primary opacity-40 cursor-not-allowed"
        >
          {isMine ? "Your Listing" : "Request Submitted"}
        </button>
      );
    }

    // If pet is not available
    if (!status.toLowerCase().includes("available")) {
      return (
        <button
          disabled
          className="pc-btn pc-btn-primary opacity-40 cursor-not-allowed"
        >
          Not Available
        </button>
      );
    }

    // ✅ Available status = Shelter posting -> Adoption
    if (status.toLowerCase() === "available") {
      return (
        <button 
          onClick={adoptPet}
          disabled={isProcessing}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition duration-200 disabled:opacity-50 font-medium"
        >
          {isProcessing ? "Processing..." : "Start Adoption Process"}
        </button>
      );
    }

    // ✅ available_fostering status = Individual posting -> Foster
    if (status.toLowerCase() === "available_fostering") {
      return (
        <button 
          onClick={fosterPet}
          disabled={isProcessing}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-200 disabled:opacity-50 font-medium"
        >
          {isProcessing ? "Processing..." : "Offer to Foster"}
        </button>
      );
    }

    // Fallback - no valid available status
    return (
      <button
        disabled
        className="pc-btn pc-btn-primary opacity-40 cursor-not-allowed"
      >
        Not Available
      </button>
    );
  };

  const statusBadge =
    status.toLowerCase().includes("available")
      ? "bg-green-100 text-green-800"
      : status.toLowerCase().includes("pending")
      ? "bg-yellow-100 text-yellow-800"
      : status.toLowerCase().includes("adopted") || status.toLowerCase().includes("fostered")
      ? "bg-blue-100 text-blue-800"
      : "bg-gray-100 text-gray-800";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />

      <main className="max-w-6xl mx-auto w-full p-6 space-y-8">
        {/* HEADER */}
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold" style={{ color: "var(--pc-primary)" }}>
              {name}
            </h1>
            <p className="text-gray-600">
              {breed} • Age: {age} {duration && `• Duration: ${duration}`}
            </p>
            <div className="mt-3 flex items-center gap-2">
              {status && <span className={`pc-chip ${statusBadge}`}>{status}</span>}
              <span className="pc-chip bg-purple-100 text-purple-800">{postedBy}</span>
              {hasUserRequested && (
                <span className="pc-chip bg-yellow-100 text-yellow-800">
                  Request Submitted
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <Link to="/browse" className="pc-btn pc-btn-outline">Back to Browse</Link>

            {/* ✅ Dynamic Action Button */}
            {getActionButton()}

            {/* Favorite Button */}
            {!isMine && (
              <button 
                onClick={addToFavorites}
                className="bg-gray-200 text-gray-700 p-2 rounded-lg hover:bg-gray-300 transition duration-200"
                title="Add to favorites"
              >
                ♡
              </button>
            )}
          </div>
        </div>

        {/* GALLERY */}
        <section className="pc-card p-5">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <img
                src={photos[0]}
                className="w-full h-96 object-cover rounded-xl"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/fallback.jpg";
                }}
              />
            </div>
            <div className="grid grid-cols-3 md:grid-cols-1 gap-4">
              {photos.slice(1, 4).map((src, i) => (
                <img
                  key={i}
                  src={src}
                  className="w-full h-28 object-cover rounded-xl"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/fallback.jpg";
                  }}
                />
              ))}
            </div>
          </div>
        </section>

        {/* DETAILS */}
        <section className="grid md:grid-cols-3 gap-6">
          <div className="pc-card p-5 md:col-span-2">
            <h2 className="text-xl font-semibold mb-3">About {name}</h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {pet?.description || "No description provided."}
            </p>

            {/* Additional Details */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Health & Care</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li><b>Vaccinated:</b> {pet?.vaccinated ? 'Yes' : 'No'}</li>
                  <li><b>Neutered/Spayed:</b> {pet?.neutered ? 'Yes' : 'No'}</li>
                  <li><b>Health Notes:</b> {pet?.healthNotes || 'None'}</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Behavior</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li><b>Good with Kids:</b> {pet?.goodWithKids ? 'Yes' : 'No'}</li>
                  <li><b>Good with Pets:</b> {pet?.goodWithPets ? 'Yes' : 'No'}</li>
                  <li><b>Activity Level:</b> {pet?.activityLevel || 'Moderate'}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* QUICK FACTS */}
          <aside className="pc-card p-5">
            <h3 className="text-lg font-semibold mb-3">Pet Details</h3>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex justify-between">
                <span className="font-medium">Breed:</span>
                <span>{breed}</span>
              </li>
              <li className="flex justify-between">
                <span className="font-medium">Age:</span>
                <span>{age}</span>
              </li>
              <li className="flex justify-between">
                <span className="font-medium">Sex:</span>
                <span>{sex}</span>
              </li>
              <li className="flex justify-between">
                <span className="font-medium">Size:</span>
                <span>{size}</span>
              </li>
              <li className="flex justify-between">
                <span className="font-medium">Color:</span>
                <span>{color}</span>
              </li>
              
              {/* ✅ Show foster duration only for Individual postings */}
              {postedBy === "Individual" && duration && (
                <li className="flex justify-between">
                  <span className="font-medium">Foster Duration:</span>
                  <span>{duration}</span>
                </li>
              )}
            </ul>

            {/* Status Information */}
            <div className="mt-6 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-1">Current Status</h4>
              <p className="text-sm text-blue-700">
                {status === 'Available' && 'This pet is available for adoption from a shelter.'}
                {status === 'available_fostering' && 'This pet is available for fostering from an individual.'}
                {status.includes('Pending') && 'This pet has pending applications.'}
                {(status === 'Adopted' || status === 'Fostered') && 'This pet has found a home!'}
                {hasUserRequested && 'You have already submitted a request for this pet.'}
              </p>
            </div>
          </aside>
        </section>

        {/* POSTED BY SECTION */}
        <section className="pc-card p-5">
          <h2 className="text-xl font-semibold mb-3">Posted By</h2>

          <div className="flex items-center gap-4">
            {/* Avatar bubble */}
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
              {(pet?.organization?.name ||
                pet?.owner?.name ||
                postedBy ||
                "P")[0]}
            </div>

            {/* Text */}
            <div>
              {/* If posted by Individual */}
              {postedBy === "Individual" ? (
                <>
                  <p className="font-medium">
                    {pet?.owner?.name || "Individual"}
                  </p>
                  {pet?.contactInfo && (
                    <p className="text-sm text-gray-600">{pet.contactInfo}</p>
                  )}
                </>
              ) : (
                // Shelter listing
                <>
                  <p className="font-medium">
                    {pet?.organization?.name || "Shelter"}
                  </p>
                  {pet?.organization?.email && (
                    <p className="text-sm text-gray-600">{pet.organization.email}</p>
                  )}
                  {pet?.organization?.phone && (
                    <p className="text-sm text-gray-600">{pet.organization.phone}</p>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}