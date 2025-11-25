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

function availabilityKind(pet: AnyObj, postedBy: string): "adopt" | "foster" | "unknown" {
  const status = String(pet?.status || "").toLowerCase();
  
  if (postedBy === "Shelter" && status === "available") return "adopt";
  if (postedBy === "Individual" && status === "available_fostering") return "foster";
  
  return "unknown";
}

// ✅ Professional PetCard with consistent sizing
export default function PetCard({ pet, isRequested, postedBy }: { pet: AnyObj; isRequested?: boolean; postedBy?: string }) {
  const id = pet?._id || pet?.id || "";
  const img = normalizeImage(pet?.images);
  const name = pet?.name || "Unnamed";
  const breed = pet?.breed || "Unknown";
  const age = pet?.age || "N/A";
  const location = pet?.location || "Location not specified";
  const statusRaw = String(pet?.status || "").toLowerCase();

  // Status badge styling
  const getStatusBadge = () => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    
    if (statusRaw.includes("available")) {
      return `${baseClasses} bg-green-100 text-green-800 border border-green-200`;
    } else if (statusRaw.includes("pending")) {
      return `${baseClasses} bg-yellow-100 text-yellow-800 border border-yellow-200`;
    } else if (statusRaw.includes("adopted") || statusRaw.includes("fostered")) {
      return `${baseClasses} bg-blue-100 text-blue-800 border border-blue-200`;
    } else {
      return `${baseClasses} bg-gray-100 text-gray-800 border border-gray-200`;
    }
  };

  // Use the postedBy prop passed from parent, or fallback to status-based logic
  const displayPostedBy = postedBy || (statusRaw === "available" ? "Shelter" : statusRaw === "available_fostering" ? "Individual" : "—");
  
  // Determine availability kind and button styling
  const kind = availabilityKind(pet, displayPostedBy);
  
  let cta = "View Details";
  let buttonClass = "bg-gray-600 hover:bg-gray-700 text-white";
  
  if (isRequested) {
    cta = "Request Submitted";
    buttonClass = "bg-gray-400 cursor-not-allowed text-white";
  } else if (kind === "adopt") {
    cta = "Adopt Now";
    buttonClass = "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md";
  } else if (kind === "foster") {
    cta = "Offer to Foster";
    buttonClass = "bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md";
  }

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full group">
      {/* Image Container with Fixed Aspect Ratio */}
      <div className="relative overflow-hidden bg-gray-100">
        <Link to={`/pet/${id}`} className="block">
          <img
            src={img}
            alt={name}
            className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/fallback.jpg";
            }}
          />
        </Link>
        
        {/* Status Badge positioned on image */}
        <div className="absolute top-3 left-3">
          <span className={getStatusBadge()}>
            {pet?.status || "Available"}
          </span>
        </div>
        
        {/* Poster Type Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
            displayPostedBy === "Shelter" 
              ? "bg-blue-100 text-blue-800 border-blue-200" 
              : "bg-purple-100 text-purple-800 border-purple-200"
          }`}>
            {displayPostedBy === "Shelter" ? "🏠 Shelter" : "👤 Individual"}
          </span>
        </div>
      </div>

      {/* Content Container */}
      <div className="p-5 flex flex-col flex-grow">
        {/* Pet Name and Breed */}
        <div className="mb-3">
          <Link to={`/pet/${id}`} className="group-hover:text-indigo-600 transition-colors">
            <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-1">{name}</h3>
          </Link>
          <p className="text-gray-600 font-medium">{breed}</p>
        </div>

        {/* Pet Details */}
        <div className="space-y-2 mb-4 flex-grow">
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{age} years old</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="line-clamp-1">{location}</span>
          </div>
        </div>

        {/* Description Preview */}
        {pet?.description && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
              {pet.description}
            </p>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-auto pt-3">
          <Link
            to={isRequested ? "#" : `/pet/${id}`}
            className={`w-full block text-center py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200 ${
              isRequested ? "cursor-not-allowed opacity-80" : "hover:shadow-lg transform hover:-translate-y-0.5"
            } ${buttonClass}`}
            onClick={(e) => isRequested && e.preventDefault()}
          >
            {cta}
          </Link>
        </div>

        {/* Quick Stats (if available) */}
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
          {pet?.vaccinated && (
            <span className="flex items-center">
              <svg className="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Vaccinated
            </span>
          )}
          
          {pet?.neutered && (
            <span className="flex items-center">
              <svg className="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Neutered
            </span>
          )}
        </div>
      </div>
    </div>
  );
}