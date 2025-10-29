// src/pages/StaffDashboard.tsx
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

import NavBar from "../components/layout/NavBar";
import Footer from "../components/layout/Footer";
import { useAuth } from "../features/auth/useAuth";
import { http } from "../lib/http";

/* =========================
   Types (defensive, partial)
   ========================= */
type ImageObj = { url?: string; isPrimary?: boolean } | null | undefined;

export interface Pet {
  _id: string;
  name?: string;
  breed?: string;
  age?: number;
  gender?: string;
  status?: string;
  images?: ImageObj[];
  organization?: { name?: string };
}

export interface MeetingInfo {
  date?: string | Date;
  confirmed?: boolean;
  type?: "virtual" | "in-person";
  status?: "scheduled" | "completed";
  location?: string;
  startTime?: string;
  endTime?: string;
}

export interface Adopter {
  _id?: string;
  name?: string;
  email?: string;
  location?: string;
}

export interface AdoptionReq {
  _id: string;
  status:
    | "pending"
    | "approved"
    | "ignored"
    | "rejected"
    | "on_hold"
    | "finalized"
    | "meeting"
    | "chat"
    | "agreement_sent"
    | "agreement_signed"
    | "payment_pending"
    | "payment_completed"
    | "payment_failed";
  pet?: Pet | null;
  adopter?: Adopter | null;
  meeting?: MeetingInfo;
}

export interface AvailabilitySlot {
  day: string; // "Monday" etc
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  date?: string; // optional ISO
}

/* =========================
   Helpers
   ========================= */
const statusChip = (s?: string) => {
  const base = "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium";
  switch (s) {
    case "pending":
      return base + " bg-yellow-100 text-yellow-800";
    case "approved":
      return base + " bg-blue-100 text-blue-800";
    case "meeting":
      return base + " bg-indigo-100 text-indigo-800";
    case "finalized":
      return base + " bg-green-100 text-green-800";
    case "ignored":
    case "rejected":
      return base + " bg-red-100 text-red-800";
    case "on_hold":
      return base + " bg-gray-200 text-gray-700";
    case "chat":
      return base + " bg-purple-100 text-purple-800";
    case "agreement_sent":
    case "agreement_signed":
      return base + " bg-emerald-100 text-emerald-800";
    case "payment_pending":
      return base + " bg-orange-100 text-orange-800";
    case "payment_completed":
      return base + " bg-green-100 text-green-800";
    case "payment_failed":
      return base + " bg-red-100 text-red-800";
    default:
      return base + " bg-gray-100 text-gray-800";
  }
};

function getPrimaryImage(images?: ImageObj[]): string {
  if (!images || images.length === 0) return "/placeholder.jpg";
  const list = images.filter(Boolean) as { url?: string; isPrimary?: boolean }[];
  const primary = list.find((i) => i?.isPrimary && i?.url);
  return (primary?.url ?? list.find((i) => i?.url)?.url) || "/placeholder.jpg";
}

function title(s?: string) {
  if (!s) return "";
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/* =========================
   API Calls (exact endpoints)
   ========================= */
const fetchOrgPets = async (): Promise<Pet[]> => {
  const res = await http.get("/pets/organization");
  return res.data ?? [];
};

const fetchRequests = async (): Promise<AdoptionReq[]> => {
  const res = await http.get("/adoptions/requests");
  return res.data ?? [];
};

const fetchAvailability = async (): Promise<AvailabilitySlot[]> => {
  const res = await http.get("/auth/staff/availability");
  // Backend returns [] if none
  return res.data ?? [];
};

const postAvailability = async (slots: AvailabilitySlot[]) => {
  // availabilityService.setWeeklyAvailability expects array overwrite
  return http.post("/auth/staff/availability", { slots });
};

const patchRequestStatus = async (d: {
  id: string;
  status: AdoptionReq["status"];
  meetingDate?: string;
}) => {
  return http.patch(`/adoptions/${d.id}/status`, d);
};

const patchPetStatus = async (d: { id: string; status: string }) => {
  return http.patch(`/pets/${d.id}/status`, { status: d.status });
};

/* =========================
   Component
   ========================= */
export default function StaffDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  if (!user || user.role !== "staff") {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-600">
        Unauthorized
      </div>
    );
  }

  // Queries
  const petsQ = useQuery({ queryKey: ["orgPets"], queryFn: fetchOrgPets });
  const reqQ = useQuery({ queryKey: ["adoptionRequests"], queryFn: fetchRequests });
  const availQ = useQuery({ queryKey: ["staffAvailability"], queryFn: fetchAvailability });

  // Mutations
  const mUpdateReq = useMutation({
    mutationFn: patchRequestStatus,
    onSuccess: () => {
      toast.success("Request updated");
      qc.invalidateQueries({ queryKey: ["adoptionRequests"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.msg ?? "Failed to update request"),
  });

  const mPetStatus = useMutation({
    mutationFn: patchPetStatus,
    onSuccess: () => {
      toast.success("Pet status updated");
      qc.invalidateQueries({ queryKey: ["orgPets"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.msg ?? "Failed to update pet"),
  });

  const mAvailability = useMutation({
    mutationFn: (newSlot: AvailabilitySlot) => {
      const current = (availQ.data ?? []) as AvailabilitySlot[];
      const merged = [...current, newSlot];
      return postAvailability(merged);
    },
    onSuccess: () => {
      toast.success("Availability saved");
      qc.invalidateQueries({ queryKey: ["staffAvailability"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.msg ?? "Failed to save availability"),
  });

  // Local state for slot form
  const [slot, setSlot] = useState<AvailabilitySlot>({
    day: "Monday",
    startTime: "09:00",
    endTime: "17:00",
  });

  const pets = useMemo(() => (Array.isArray(petsQ.data) ? petsQ.data : []), [petsQ.data]);
  const requests = useMemo(
    () => (Array.isArray(reqQ.data) ? reqQ.data : []),
    [reqQ.data]
  );
  const availability = useMemo(
    () => (Array.isArray(availQ.data) ? availQ.data : []),
    [availQ.data]
  );

  /* ============ UI bits ============ */
  const Empty = ({ children }: { children: React.ReactNode }) => (
    <div className="text-sm text-gray-500">{children}</div>
  );

  const Section = ({ title, action, children }: any) => (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );

  const onApprove = (r: AdoptionReq) =>
    mUpdateReq.mutate({ id: r._id, status: "approved" });

  const onIgnore = (r: AdoptionReq) =>
    mUpdateReq.mutate({ id: r._id, status: "ignored" });

  const onMeeting = (r: AdoptionReq) => {
    const v = window.prompt(
      "Enter meeting date & time (ISO or YYYY-MM-DDTHH:mm). Example: 2025-11-05T14:00"
    );
    if (!v) return;
    // Backend expects meetingDate in body with status=meeting
    mUpdateReq.mutate({ id: r._id, status: "meeting", meetingDate: new Date(v).toISOString() });
  };

  const onFinalize = (r: AdoptionReq) =>
    mUpdateReq.mutate({ id: r._id, status: "finalized" });

  const RequestCard = ({ r }: { r: AdoptionReq }) => {
    const pet = r.pet;
    const adopter = r.adopter;

    return (
      <div className="rounded-xl border border-gray-100 p-4 hover:shadow-sm transition bg-white">
        <div className="flex gap-3">
          <img
            src={getPrimaryImage(pet?.images)}
            className="w-20 h-20 object-cover rounded-lg border"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">
                {(pet?.name || "Pet") + (pet?.breed ? ` • ${pet.breed}` : "")}
              </h3>
              <span className={statusChip(r.status)}>{r.status}</span>
            </div>
            <p className="text-xs text-gray-500">
              Adopter: {adopter?.name || "—"}
              {adopter?.email ? ` • ${adopter.email}` : ""}
              {adopter?.location ? ` • ${adopter.location}` : ""}
            </p>
            {r.meeting?.date && (
              <p className="text-xs text-indigo-700 mt-1">
                Meeting: {new Date(r.meeting.date).toLocaleString()}{" "}
                {r.meeting?.type ? `(${r.meeting.type})` : ""}
                {r.meeting?.confirmed ? " • Confirmed" : ""}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mt-3">
              {r.status === "pending" && (
                <>
                  <button
                    onClick={() => onApprove(r)}
                    className="px-3 py-1.5 rounded-md bg-green-600 text-white text-xs"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onIgnore(r)}
                    className="px-3 py-1.5 rounded-md border text-red-600 border-red-200 text-xs"
                  >
                    Ignore
                  </button>
                </>
              )}

              {["approved", "meeting"].includes(r.status) && (
                <button
                  onClick={() => onMeeting(r)}
                  className="px-3 py-1.5 rounded-md bg-yellow-500 text-white text-xs"
                >
                  Request Meeting
                </button>
              )}

              {r.status === "meeting" && (
                <button
                  onClick={() => onFinalize(r)}
                  className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-xs"
                >
                  Finalize Adoption
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PetCard = ({ p }: { p: Pet }) => {
    return (
      <div className="rounded-xl border border-gray-100 p-3 hover:shadow-sm transition bg-white">
        <img
          src={getPrimaryImage(p.images)}
          className="w-full h-36 object-cover rounded-lg border"
        />
        <div className="mt-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">{p.name || "Unnamed"}</h4>
            <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700">
              {p.status || "—"}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {p.breed ? title(p.breed) : "—"}
            {p.organization?.name ? ` • ${p.organization.name}` : ""}
          </p>

          <select
            className="mt-3 w-full border rounded-md text-sm p-2"
            defaultValue=""
            onChange={(e) =>
              e.target.value &&
              mPetStatus.mutate({ id: p._id, status: e.target.value })
            }
          >
            <option value="">Update Status…</option>
            <option value="Available">Available</option>
            <option value="Ready for Treatment">Ready for Treatment</option>
            <option value="In Treatment">In Treatment</option>
            <option value="Ready for Adoption">Ready for Adoption</option>
            <option value="In Training">In Training</option>
            <option value="Training Complete">Training Complete</option>
            <option value="Unavailable">Unavailable</option>
          </select>

          <Link
            to={`/pets/${p._id}`}
            className="mt-2 inline-flex text-xs text-indigo-600 hover:underline"
          >
            View profile →
          </Link>
        </div>
      </div>
    );
  };

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slot.day || !slot.startTime || !slot.endTime) return;
    if (slot.startTime >= slot.endTime) {
      toast.error("Start time must be before end time");
      return;
    }
    mAvailability.mutate(slot);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold">Staff Dashboard</h1>
          <div className="text-sm text-gray-600">
            Signed in as <span className="font-medium">{user.name}</span> · Role:{" "}
            <span className="font-medium">{user.role}</span>
          </div>
        </header>

        {/* Availability */}
        <Section
          title="My Availability"
          action={
            <form onSubmit={handleAddSlot} className="flex items-center gap-2">
              <select
                className="border rounded-md text-sm p-2"
                value={slot.day}
                onChange={(e) => setSlot((s) => ({ ...s, day: e.target.value }))}
              >
                {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <input
                type="time"
                className="border rounded-md text-sm p-2"
                value={slot.startTime}
                onChange={(e) => setSlot((s) => ({ ...s, startTime: e.target.value }))}
                required
              />
              <input
                type="time"
                className="border rounded-md text-sm p-2"
                value={slot.endTime}
                onChange={(e) => setSlot((s) => ({ ...s, endTime: e.target.value }))}
                required
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-md bg-indigo-600 text-white text-sm"
              >
                Add Slot
              </button>
            </form>
          }
        >
          {availability.length === 0 ? (
            <Empty>No availability set yet.</Empty>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {availability.map((a, idx) => (
                <div
                  key={`${a.day}-${a.startTime}-${a.endTime}-${idx}`}
                  className="rounded-lg border border-gray-100 p-3 text-sm bg-white"
                >
                  <div className="font-medium">{a.day}</div>
                  <div className="text-gray-600">
                    {a.startTime} – {a.endTime}
                    {a.date ? ` • ${new Date(a.date).toLocaleDateString()}` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Adoption Requests */}
        <Section title="Adoption Requests">
          {requests.length === 0 ? (
            <Empty>No adoption requests for your organization.</Empty>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <RequestCard key={r._id} r={r} />
              ))}
            </div>
          )}
        </Section>

        {/* Pets */}
        <Section title="My Shelter Pets">
          {pets.length === 0 ? (
            <Empty>No pets under your organization yet.</Empty>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pets.map((p) => (
                <PetCard key={p._id} p={p} />
              ))}
            </div>
          )}
        </Section>
      </main>
      <Footer />
    </div>
  );
}
