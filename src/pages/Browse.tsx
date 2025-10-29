// ✅ src/pages/Browse.tsx
import NavBar from "../components/layout/NavBar";
import Footer from "../components/layout/Footer";
import { useQuery } from "@tanstack/react-query";
import { listPets } from "../features/pets/api";
import type { Pet } from "../features/pets/types";
import { Link } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";
import PetCard from "../components/layout/PetCard";

const base = import.meta.env.VITE_FILE_BASE_URL;

// ✅ Correct personal listings fetch wrapper
async function listPersonalPets(token: string) {
  const res = await fetch(`${base}/pet-files/listings`, {
    headers: {
      "x-auth-token": token,
    },
  });
  const result = await res.json();
  return Array.isArray(result.listings) ? result.listings : []; // ✅ ALWAYS return array
}

export default function Browse() {
  const { token, user } = useAuth();

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

  const isLoading = shelterQ.isLoading || personalQ.isLoading;
  const error = shelterQ.error || personalQ.error;

  const shelterPets = shelterQ.data ?? [];
  const personalPets = personalQ.data ?? []; // ✅ guaranteed to be []

  // ✅ Hide logged-in user's own listings
  const visiblePersonalPets = personalPets.filter(p => {
    const owner = (p as any)?.owner;
    const ownerId = typeof owner === "object" ? owner?._id : owner;
    return ownerId !== user?._id;
  });

  // ✅ Shelter pets first → then personal foster listings
  const combined = [...shelterPets, ...visiblePersonalPets];

  return (
    <div>
      <NavBar />

      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-1" style={{ color: "var(--pc-deep)" }}>
              Browse Pets
            </h1>
            <p className="text-gray-600">Find your new companion!</p>
          </div>

          {/* ✅ Only adopters can list pets */}
          {user?.role === "adopter" && (
            <Link to="/create-listing" className="pc-btn pc-btn-primary text-sm">
              + List a Pet for Foster
            </Link>
          )}
        </div>

        {isLoading && <BrowseSkeleton />}
        {error && <div className="text-red-600">Failed to load pets.</div>}

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {combined.map((pet: any) => (
            <PetCard key={pet._id || pet.id} pet={pet} />
          ))}
        </div>

        {!isLoading && combined.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            No pets available right now.
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function BrowseSkeleton() {
  return (
    <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="pc-card p-4 animate-pulse">
          <div className="bg-gray-200 h-64 w-full rounded-md" />
          <div className="h-5 w-1/2 bg-gray-200 mt-4" />
        </div>
      ))}
    </div>
  );
}
