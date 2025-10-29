import React from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import NavBar from "../components/layout/NavBar";
import Footer from "../components/layout/Footer";
import { useAuth } from "../features/auth/useAuth";
import { http } from "../lib/http";

/** ---- Types kept minimal & resilient ---- */
type Gender = "Male" | "Female";
type Duration = "short_term" | "medium_term" | "long_term";

export default function CreateListing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Only logged-in adopters can list; others blocked politely
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Please log in to list a pet.</div>
      </div>
    );
  }

  // --- Form state ---
  const [name, setName] = React.useState("");
  const [breed, setBreed] = React.useState("");
  const [age, setAge] = React.useState<number | "">("");
  const [gender, setGender] = React.useState<Gender | "">("");
  const [duration, setDuration] = React.useState<Duration | "">("");
  const [description, setDescription] = React.useState("");
  const [careInstructions, setCareInstructions] = React.useState("");
  const [location, setLocation] = React.useState(user?.location || "");
  const [contactInfo, setContactInfo] = React.useState(user?.email || "");
  const [files, setFiles] = React.useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState(false);

  // image selection
  const onPickFiles: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const picked = Array.from(e.target.files || []);
    const total = files.length + picked.length;
    if (total > 8) {
      toast.error("You can upload up to 8 photos.");
      return;
    }
    const next = [...files, ...picked];
    setFiles(next);
    setPreviewUrls(next.map((f) => URL.createObjectURL(f)));
  };

  const removeImage = (idx: number) => {
    const next = files.filter((_, i) => i !== idx);
    setFiles(next);
    setPreviewUrls(next.map((f) => URL.createObjectURL(f)));
  };

  // react-query mutation
  const createListing = useMutation({
    mutationFn: async (fd: FormData) => {
      // NOTE: axios will set proper multipart boundaries for FormData
      const res = await http.post("/pet-files/user-pet/upload", fd);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success("Listing created!");
      // Safe fallback route if you already have a listings page
      navigate("/my-listings", { replace: true });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.msg ||
        err?.message ||
        "Failed to create listing. Please try again.";
      toast.error(msg);
    },
  });

  // client-side validation without new deps
  const validate = () => {
    if (!name.trim()) return "Pet name is required";
    if (!gender) return "Gender is required";
    if (!duration) return "Foster duration is required";
    if (!description.trim()) return "Description is required";
    if (!location.trim()) return "Location is required";
    if (!contactInfo.trim()) return "Contact info is required";
    if (files.length === 0) return "Add at least one photo";
    return null;
  };

  const onSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      toast.error(problem);
      return;
    }

    try {
      setSubmitting(true);
      const fd = new FormData();
      // required/public fields
      fd.append("name", name.trim());
      if (breed) fd.append("breed", breed.trim());
      if (age !== "" && !Number.isNaN(Number(age))) fd.append("age", String(age));
      if (gender) fd.append("gender", gender);
      if (duration) fd.append("duration", duration); // backend can store as string
      fd.append("description", description.trim());
      if (careInstructions) fd.append("careInstructions", careInstructions.trim());
      fd.append("location", location.trim());
      fd.append("contactInfo", contactInfo.trim());

      // ensure these flags are respected by backend controller
      fd.append("listingType", "personal");
      fd.append("isPersonalListing", "true");
      // server will set status to 'available_fostering' (if not, you can also append it)
      fd.append("status", "available_fostering");

      files.forEach((f) => fd.append("images", f));

      createListing.mutate(fd);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />
      <main className="max-w-5xl mx-auto w-full p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">List Your Pet for Fostering</h1>
          <p className="text-gray-600 mt-1">
            Help your pet find a temporary loving home while you’re away.
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-4 mb-6">
          {["Pet Details", "Photos", "Review"].map((label, i) => (
            <div key={label} className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white grid place-items-center text-sm">
                {i + 1}
              </div>
              <span className="ml-2 mr-4 text-sm font-medium text-gray-700">
                {label}
              </span>
              {i < 2 && <div className="h-px w-8 bg-gray-300" />}
            </div>
          ))}
        </div>

        <form onSubmit={onSubmit} className="grid md:grid-cols-2 gap-6">
          {/* Left column */}
          <section className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
              <h2 className="font-semibold text-lg">Basic Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Pet Name *</label>
                  <input
                    className="pc-input w-full"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Coco"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Breed</label>
                  <input
                    className="pc-input w-full"
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    placeholder="e.g., Golden Retriever, Mixed"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Age (years)</label>
                  <input
                    type="number"
                    min={0}
                    className="pc-input w-full"
                    value={age}
                    onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g., 2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Gender *</label>
                  <select
                    className="pc-input w-full"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Foster Duration *</label>
                  <select
                    className="pc-input w-full"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value as Duration)}
                  >
                    <option value="">Select Duration</option>
                    <option value="short_term">1–2 weeks</option>
                    <option value="medium_term">3–4 weeks</option>
                    <option value="long_term">1+ months</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
              <h2 className="font-semibold text-lg">Description & Care</h2>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Description *</label>
                <textarea
                  className="pc-input w-full min-h-[110px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell potential fosters about your pet’s personality, likes, dislikes, etc."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Care Instructions</label>
                <textarea
                  className="pc-input w-full min-h-[110px]"
                  value={careInstructions}
                  onChange={(e) => setCareInstructions(e.target.value)}
                  placeholder="Feeding schedule, exercise needs, medication, special care requirements..."
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
              <h2 className="font-semibold text-lg">Location & Contact</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Location *</label>
                  <input
                    className="pc-input w-full"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, State/Province"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Contact Info *</label>
                  <input
                    className="pc-input w-full"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    placeholder="Phone number or email"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Right column */}
          <section className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h2 className="font-semibold text-lg mb-3">Photos *</h2>

              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={onPickFiles}
                  className="hidden"
                />
                <label
                  htmlFor="images"
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700"
                >
                  Click to upload photos
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  PNG, JPG, GIF up to 15MB each — max 8 photos
                </p>
              </div>

              {previewUrls.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {previewUrls.map((src, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={src}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h2 className="font-semibold text-lg mb-3">Review & Submit</h2>
              <ul className="text-sm text-gray-600 list-disc ml-5 space-y-1">
                <li>Listings are visible to other users for fostering.</li>
                <li>You won’t see your own personal listing in “Browse”.</li>
                <li>You can manage images and requests from “My Listings”.</li>
              </ul>

              <div className="flex justify-end gap-3 mt-5">
                <button
                  type="button"
                  className="pc-btn pc-btn-outline"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </button>
                <button
                type="submit"
                disabled={submitting || createListing.isPending}
                className="pc-btn pc-btn-primary disabled:opacity-60"
                >
                {submitting || createListing.isPending ? "Creating..." : "Create Listing"}
                </button>
              </div>
            </div>
          </section>
        </form>
      </main>
      <Footer />
    </div>
  );
}

/** Simple input style helper — relies on your Tailwind + component styles */
declare global {
  interface HTMLInputElement {
    files: FileList | null;
  }
}
