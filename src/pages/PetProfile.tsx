// ✅ Updated: src/pages/PetProfile.tsx
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import NavBar from "../components/layout/NavBar";
import Footer from "../components/layout/Footer";
import { http } from "../lib/http";
import { useAuth } from "../features/auth/useAuth"; // ✅ added to check current user

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

function posterLabel(pet: AnyObj): string {
  if (pet?.orgPostedBy || pet?.organization) return "Shelter";
  if (pet?.userPostedBy || pet?.owner || pet?.isPersonalListing) return "Individual";
  return "—";
}

export default function PetProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth(); // ✅ get logged-in user

  const { data, isLoading, error } = useQuery<AnyObj>({
    queryKey: ["pet", id],
    queryFn: async () => {
      const res = await http.get(`/pets/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">Loading…</div>
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

  // ✅ ownership check — works with both string & object owner ref
  const ownerId =
    typeof pet?.owner === "object" ? pet.owner?._id : pet?.owner;

  const isMine = ownerId && user?._id && ownerId === user._id;

  // ✅ foster duration for personal listings
  const duration =
    pet?.duration
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
  const postedBy = posterLabel(pet);

  const status = pet?.status ? String(pet.status) : "";
  const statusBadge =
    status.toLowerCase().includes("available")
      ? "bg-green-100 text-green-800"
      : status.toLowerCase().includes("pending")
      ? "bg-yellow-100 text-yellow-800"
      : status.toLowerCase().includes("adopted")
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
              {breed} • Age: {age} • Duration: {duration}
            </p>
            <div className="mt-3 flex items-center gap-2">
              {status && <span className={`pc-chip ${statusBadge}`}>{status}</span>}
              <span className="pc-chip bg-purple-100 text-purple-800">{postedBy}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Link to="/browse" className="pc-btn pc-btn-outline">Back to Browse</Link>

            {/* ✅ Disable same-user adoption button */}
            {isMine ? (
              <button
                disabled
                title="You cannot adopt your own pet."
                className="pc-btn pc-btn-primary opacity-40 cursor-not-allowed"
              >
                Your Listing
              </button>
            ) : (
              <Link
                to={`/adopt/${pet?._id || pet?.id || ""}`}
                className="pc-btn pc-btn-primary"
              >
                Start Process
              </Link>
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
            <h2 className="text-xl font-semibold mb-3">About</h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {pet?.description || "No description provided."}
            </p>

          </div>

          {/* QUICK FACTS */}
          <aside className="pc-card p-5">
            <h3 className="text-lg font-semibold mb-3">Pet Details</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li><b>Breed:</b> {breed}</li>
              <li><b>Age:</b> {age}</li>
              <li><b>Sex:</b> {sex}</li>

              {/* ✅ Show foster duration only for personal listings */}
              {pet?.isPersonalListing && duration && (
                <li><b>Foster Duration:</b> {duration}</li>
              )}
            </ul>
          </aside>
        </section>

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
      {/* If posted by personal adopter */}
      {pet?.isPersonalListing || pet?.listingType === "personal" ? (
        <>
          <p className="font-medium">
            {pet?.owner?.name || "Individual"}
          </p>
          {pet?.contactInfo && (
            <p className="text-sm text-gray-600">{pet.contactInfo}</p>
          )}
        </>
      ) : (
        // Shelter listing fallback
        <>
          <p className="font-medium">
            {pet?.organization?.name || postedBy}
          </p>
          {pet?.organization?.email && (
            <p className="text-sm text-gray-600">{pet.organization.email}</p>
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
