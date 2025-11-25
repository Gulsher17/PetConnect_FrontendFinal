import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { listPets } from "../features/pets/api";
import type { Pet } from "../features/pets/types";
import { Link } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";
import PetCard from "../components/layout/PetCard";
import NavBar from "../components/layout/NavBar";
import Footer from "../components/layout/Footer";

const base = import.meta.env.VITE_FILE_BASE_URL;

async function listPersonalPets(token: string) {
  const res = await fetch(`${base}/pet-files/listings`, {
    headers: {
      "x-auth-token": token,
    },
  });
  const result = await res.json();
  return Array.isArray(result.listings) ? result.listings : [];
}

async function fetchAdoptionRequests(token: string) {
  try {
    const response = await fetch(`${base}/adoptions/my-requests`, {
      headers: {
        "x-auth-token": token,
      },
    });
    const result = await response.json();
    
    let adoptionRequests: any[] = [];
    
    if (Array.isArray(result)) {
      adoptionRequests = result;
    } else if (Array.isArray(result?.requests)) {
      adoptionRequests = result.requests;
    } else if (Array.isArray(result?.adoptions)) {
      adoptionRequests = result.adoptions;
    }
    
    return adoptionRequests.filter(r => r && (r.pet || r.status));
  } catch (error: any) {
    console.error('Error fetching adoption requests:', error);
    return [];
  }
}

async function fetchUserFosterRequests(token: string, userId: string) {
  try {
    const response = await fetch(`${base}/foster-requests/my-requests`, {
      headers: {
        "x-auth-token": token,
      },
    });
    const result = await response.json();
    
    if (result.success) {
      return result.data || [];
    } else {
      console.error("API returned error:", result.message);
      return [];
    }
  } catch (err: any) {
    console.error("Failed to fetch foster requests:", err);
    return [];
  }
}

export default function Browse() {
  const { token, user } = useAuth();
  const [userRequests, setUserRequests] = useState<any[]>([]);

  const shelterQ = useQuery<Pet[]>({
    queryKey: ["shelterPets"],
    queryFn: listPets,
    enabled: !!token,
  });

  const personalQ = useQuery<any[]>({
    queryKey: ["personalPets"],
    queryFn: () => listPersonalPets(token!),
    enabled: !!token,
  });

  useEffect(() => {
    const loadUserRequests = async () => {
      if (!token || !user?._id) return;
      
      try {
        const [adoptionReqs, fosterReqs] = await Promise.all([
          fetchAdoptionRequests(token),
          fetchUserFosterRequests(token, user._id)
        ]);
        
        const allRequests = [...adoptionReqs, ...fosterReqs];
        setUserRequests(allRequests);
      } catch (error) {
        console.error("Error loading user requests:", error);
      }
    };

    loadUserRequests();
  }, [token, user]);

  const isLoading = shelterQ.isLoading || personalQ.isLoading;
  const error = shelterQ.error || personalQ.error;

  const shelterPets = shelterQ.data ?? [];
  const personalPets = personalQ.data ?? [];

  const visiblePersonalPets = personalPets.filter(p => {
    const owner = (p as any)?.owner;
    const ownerId = typeof owner === "object" ? owner?._id : owner;
    return ownerId !== user?._id;
  });

  const combined = [...shelterPets, ...visiblePersonalPets]
    .map(pet => {
      const status = String(pet?.status || "").toLowerCase();
      const postedBy = status === "available" ? "Shelter" : 
                       status === "available_fostering" ? "Individual" : 
                       "—";
      
      const isRequestedByCurrentUser = userRequests.some(request => {
        const requestPetId = request.pet?._id || request.petId;
        return requestPetId === pet._id || requestPetId === pet.id;
      });
      
      return {
        ...pet,
        postedBy,
        isRequestedByCurrentUser 
      };
    })
    .filter(pet => !pet.isRequestedByCurrentUser);

  return (
    <div>
      <NavBar />

      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-1" style={{ color: "var(--pc-deep)" }}>
              Browse Pets
            </h1>
            <p className="text-gray-600">Find your perfect companion</p>
          </div>

          {/* ✅ Only adopters can list pets */}
          {user?.role === "adopter" && (
            <Link to="/create-listing-new" className="pc-btn pc-btn-primary text-sm">
              + List a Pet for Foster
            </Link>
          )}
        </div>

        {isLoading && <BrowseSkeleton />}
        {error && <div className="text-red-600">Failed to load pets.</div>}

        {/* Results Count */}
        {!isLoading && (
          <div className="mb-6 text-gray-600">
            Showing {combined.length} available pet{combined.length !== 1 ? 's' : ''}
            {userRequests.length > 0 && (
              <span className="text-sm text-gray-500 ml-2">
                (You have {userRequests.length} active request{userRequests.length !== 1 ? 's' : ''})
              </span>
            )}
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {combined.map((pet: any) => (
            <PetCard 
              key={pet._id || pet.id} 
              pet={pet} 
              postedBy={pet.postedBy}
            />
          ))}
        </div>

        {!isLoading && combined.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {userRequests.length > 0 ? "All Available Pets Requested" : "No Pets Available"}
            </h3>
            <p className="text-gray-600 mb-4">
              {userRequests.length > 0 
                ? "You've requested all available pets. Check your dashboard for request status."
                : "There are no pets available at the moment. Please check back later."
              }
            </p>
            {user?.role === "adopter" && (
              <Link to="/create-listing-new" className="pc-btn pc-btn-primary">
                List a Pet for Foster
              </Link>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function BrowseSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
          <div className="w-full h-40 bg-gray-200" />
          <div className="p-4">
            <div className="flex justify-between mb-3">
              <div className="h-4 w-20 bg-gray-200 rounded" />
              <div className="h-4 w-16 bg-gray-200 rounded" />
            </div>
            <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-1/2 bg-gray-200 rounded mb-3" />
            <div className="space-y-2 mb-4">
              <div className="h-3 w-full bg-gray-200 rounded" />
              <div className="h-3 w-4/5 bg-gray-200 rounded" />
            </div>
            <div className="h-10 w-full bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}