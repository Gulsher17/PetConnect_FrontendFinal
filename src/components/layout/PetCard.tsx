// src/components/PetCard.tsx
import { Link } from "react-router-dom";

type AnyObj = Record<string, any>;

function normalizeImage(input: any): string {
  if (!input) return "/fallback.jpg";
  if (typeof input === "string") return input;
  if (Array.isArray(input)) {
    const first = input[0];
    if (!first) return "/fallback.jpg";
    if (typeof first === "string") return first;
    if (first?.url) return first.url;
    return "/fallback.jpg";
  }
  if (typeof input === "object") {
    if (input.url) return input.url;
  }
  return "/fallback.jpg";
}

function posterLabel(pet: AnyObj): string {
  // Robust against both org/user list styles
  if (pet?.orgPostedBy || pet?.organization) return "Shelter";
  if (pet?.userPostedBy || pet?.owner) return "Individual";
  return "—";
}

function availabilityKind(pet: AnyObj): "adopt" | "foster" | "unknown" {
  const s = String(pet?.status || "").toLowerCase();
  const t = String(pet?.adoptionType || pet?.listingType || "").toLowerCase();

  if (t.includes("foster")) return "foster";
  if (t.includes("adopt")) return "adopt";

  if (s.includes("foster")) return "foster";
  if (s.includes("adopt")) return "adopt";

  return "unknown";
}

export default function PetCard({ pet }: { pet: AnyObj }) {
  const id = pet?._id || pet?.id || "";
  const img = normalizeImage(pet?.images);
  const name = pet?.name || "Unnamed";
  const breed = pet?.breed || "Unknown";
  const statusRaw = String(pet?.status || "").toLowerCase();

  const badgeClass =
    statusRaw.includes("available")
      ? "bg-green-100 text-green-800"
      : statusRaw.includes("pending")
      ? "bg-yellow-100 text-yellow-800"
      : statusRaw.includes("adopted")
      ? "bg-blue-100 text-blue-800"
      : "bg-gray-100 text-gray-800";

  const postedBy = posterLabel(pet);
  const kind = availabilityKind(pet);
  const cta =
    kind === "adopt" ? "Adopt" : kind === "foster" ? "Foster" : "View Details";

  return (
    <div className="pc-card hover:shadow-lg transition overflow-hidden">
      <Link to={`/pet/${id}`}>
        <img
          src={img}
          alt={name}
          className="w-full h-48 object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/fallback.jpg";
          }}
        />
      </Link>

      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold truncate">{name}</h3>
            <p className="text-sm text-gray-600 truncate">{breed}</p>
          </div>
          {pet?.status && (
            <span className={`pc-chip capitalize ${badgeClass}`}>
              {pet.status}
            </span>
          )}
        </div>

        <p className="text-xs text-gray-500">{postedBy}</p>

        <div className="pt-2">
          <Link
            to={`/pet/${id}`}
            className="pc-btn pc-btn-primary w-full text-center"
          >
            {cta}
          </Link>
        </div>
      </div>
    </div>
  );
}
