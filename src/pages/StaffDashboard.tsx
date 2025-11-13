import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import NavBar from "../components/layout/NavBar";
import Footer from "../components/layout/Footer";
import { useAuth } from "../features/auth/useAuth";
import { http } from "../lib/http";

type ImageObj = { url?: string; isPrimary?: boolean } | null | undefined;

export interface Pet {
  _id: string;
  name?: string;
  breed?: string;
  age?: number;
  gender?: string;
  fosterDuration?: string;
  description?: string;
  careInstructions?: string;
  location?: string;
  contact?: string;
  status?: string;
  images?: ImageObj[];
  organization?: { name?: string };
  trainer?: { _id: string; name?: string };
  vet?: { _id: string; name?: string };
}

export interface Trainer { _id: string; name: string; specialization?: string }
export interface Vet { _id: string; name: string }
export interface AdoptionReq {
  _id: string;
  status: string;
  pet?: Pet | null;
  adopter?: { name?: string; email?: string; location?: string } | null;
  meeting?: { date?: string | Date; confirmed?: boolean; type?: string; status?: string; location?: string; }
}
export interface ProfessionalTrainer { _id: string; name: string }
export interface TrainingProgram {
  _id: string;
  name?: string;
  goals: string[];
  duration?: string;
  notes?: string;
  trainer?: { name?: string };
  pet?: { name?: string };
  status?: string;
  startedAt?: string;
}
export interface AvailabilitySlot {
  day: string;
  startTime: string;
  endTime: string;
  date: string; // Made required
  _id?: string;
}

const statusChip = (s?: string) => {
  const base = "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200";
  switch (s) {
    case "pending": return base + " bg-amber-50 text-amber-700 border border-amber-200 shadow-sm";
    case "approved": return base + " bg-blue-50 text-blue-700 border border-blue-200 shadow-sm";
    case "meeting": return base + " bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm";
    case "finalized": case "payment_completed": return base + " bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm";
    case "ignored": case "rejected": case "payment_failed": return base + " bg-red-50 text-red-700 border border-red-200 shadow-sm";
    default: return base + " bg-gray-50 text-gray-700 border border-gray-200 shadow-sm";
  }
};

const getPrimaryImage = (images?: ImageObj[]) =>
  (!images || images.length === 0) ? "/placeholder.jpg"
    : (images.filter(Boolean).find(img => img?.isPrimary && img?.url)?.url
      || images.filter(Boolean).find(img => img?.url)?.url
      || "/placeholder.jpg");

const title = (s?: string) =>
  (!s ? "" : s.toLowerCase().split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "));

const programOpts = [
  { value: "4weeks", label: "4 Weeks - Basic Obedience", goals: ["basicobedience", "leashtraining"] },
  { value: "6weeks", label: "6 Weeks - Behavior Modification", goals: ["behavior", "socialization"] },
  { value: "8weeks", label: "8 Weeks - Advanced Training", goals: ["advancedcommands"] }
];

// Custom DateTimePicker Component
const DateTimePicker = ({
  value,
  onChange,
  min,
  max,
  required = false,
  className = "",
  label,
  id
}: {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  className?: string;
  label?: string;
  id?: string;
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        type="datetime-local"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        required={required}
        className={`w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${className}`}
      />
    </div>
  );
};

// Custom DatePicker Component
const DatePicker = ({
  value,
  onChange,
  min,
  max,
  required = false,
  className = "",
  label,
  id
}: {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  className?: string;
  label?: string;
  id?: string;
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        type="date"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        required={required}
        className={`w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${className}`}
      />
    </div>
  );
};

// Custom TimePicker Component
const TimePicker = ({
  value,
  onChange,
  required = false,
  className = "",
  label,
  id
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  label?: string;
  id?: string;
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        type="time"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={`w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${className}`}
      />
    </div>
  );
};

// Section Component
const Section = ({ title, action, children, className = "" }: any) => (
  <section className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 transition-all duration-200 hover:shadow-md ${className}`}>
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600 mt-1">Manage and monitor your {title.toLowerCase()}</p>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
    {children}
  </section>
);

// Empty State Component
const Empty = ({ children }: { children: React.ReactNode }) => (
  <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
    <div className="text-4xl mb-3">📊</div>
    {children}
  </div>
);

// StatCard Component
const StatCard = ({ title, value, icon, color = "blue" }: { title: string; value: string | number; icon: string; color?: string }) => {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-600",
    green: "bg-emerald-50 border-emerald-200 text-emerald-600",
    amber: "bg-amber-50 border-amber-200 text-amber-600",
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-600"
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className="text-2xl">{icon}</div>
      </div>
    </div>
  );
};

// RequestCard Component
const RequestCard = ({ r, onApprove, onIgnore, onMeeting, onFinalize }: {
  r: AdoptionReq;
  onApprove: (r: AdoptionReq) => void;
  onIgnore: (r: AdoptionReq) => void;
  onMeeting: (r: AdoptionReq) => void;
  onFinalize: (r: AdoptionReq) => void;
}) => {
  const pet = r.pet;
  const adopter = r.adopter;

  return (
    <div className="rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all bg-white">
      <div className="flex gap-4">
        <img
          src={getPrimaryImage(pet?.images)}
          className="w-24 h-24 object-cover rounded-xl border-2 border-gray-100 shadow-xs"
          alt="pet"
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <h3 className="font-bold text-gray-900 text-lg truncate">
              {pet?.name || "Pet"}
              {pet?.breed && <span className="text-gray-600 font-normal"> • {pet.breed}</span>}
            </h3>
            <span className={statusChip(r.status)}>{r.status}</span>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Adopter:</span>
              <span>{adopter?.name || "—"}</span>
              {adopter?.email && <span>• {adopter.email}</span>}
            </div>
            {adopter?.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">Location:</span>
                <span>{adopter.location}</span>
              </div>
            )}
          </div>

          {r.meeting?.date && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-indigo-800 font-medium">
                <span>📅 Meeting Scheduled</span>
              </div>
              <div className="text-xs text-indigo-700 mt-1">
                {new Date(r.meeting.date).toLocaleString()}
                {r.meeting?.type && ` • ${r.meeting.type}`}
                {r.meeting?.confirmed && " • ✅ Confirmed"}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {r.status === "pending" && (
              <>
                <button
                  onClick={() => onApprove(r)}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors shadow-xs"
                >
                  Approve
                </button>
                <button
                  onClick={() => onIgnore(r)}
                  className="px-4 py-2 rounded-lg border border-red-300 text-red-600 bg-white text-sm font-medium hover:bg-red-50 transition-colors shadow-xs"
                >
                  Ignore
                </button>
              </>
            )}
            {["approved", "meeting"].includes(r.status) && (
              <button
                onClick={() => onMeeting(r)}
                className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors shadow-xs"
              >
                Request Meeting
              </button>
            )}
            {r.status === "meeting" && (
              <button
                onClick={() => onFinalize(r)}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-xs"
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

// AllPetsSection Component
function AllPetsSection({
  allPetsQ,
  trainersQ,
  vetsQ,
  tempAssignments,
  setTab,
  mPetStatus,
  mDelPet,
  mAssignTrainer, // Add this prop
  mAssignVet, // Add this prop
  handleTempAssignmentChange,
  handleSaveAssignment
}: any) {
  const pets = useMemo(() => {
    const petsData = allPetsQ.data;
    return Array.isArray(petsData) ? petsData : [];
  }, [allPetsQ.data]);

  const trainers = useMemo(() => {
    const trainersData = trainersQ.data;
    return Array.isArray(trainersData) ? trainersData : [];
  }, [trainersQ.data]);

  const vets = useMemo(() => {
    const vetsData = vetsQ.data;
    return Array.isArray(vetsData) ? vetsData : [];
  }, [vetsQ.data]);

  // Check if there are any changes to save for a specific pet
  const hasChangesToSave = useCallback((petId: string) => {
    const assignment = tempAssignments[petId];
    if (!assignment) return false;

    const pet = pets.find(p => p._id === petId);
    if (!pet) return false;

    const hasTrainerChange = assignment.trainerId !== undefined && assignment.trainerId !== pet.trainer?._id;
    const hasVetChange = assignment.vetId !== undefined && assignment.vetId !== pet.vet?._id;

    return hasTrainerChange || hasVetChange;
  }, [tempAssignments, pets]);

  // Save both trainer and vet assignments
  const handleSaveBothAssignments = useCallback((petId: string) => {
    const assignment = tempAssignments[petId];
    if (!assignment) return;

    const pet = pets.find(p => p._id === petId);
    if (!pet) return;

    // Save trainer if changed
    if (assignment.trainerId !== undefined && assignment.trainerId !== pet.trainer?._id) {
      mAssignTrainer.mutate({
        petId,
        trainerId: assignment.trainerId,
        notes: ""
      });
    }

    // Save vet if changed
    if (assignment.vetId !== undefined && assignment.vetId !== pet.vet?._id) {
      mAssignVet.mutate({
        petId,
        vetId: assignment.vetId
      });
    }
  }, [tempAssignments, pets, mAssignTrainer, mAssignVet]);

  return (
    <Section
      title="Pet Management"
      action={
        <button
          onClick={() => setTab('addpet')}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 group"
        >
          <span className="text-lg group-hover:scale-110 transition-transform duration-200">✨</span>
          Add New Pet
        </button>
      }
    >
      {/* Aura Stats Cards */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl border border-blue-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Pets</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{pets.length}</p>
              </div>
              <div className="text-3xl text-blue-500 group-hover:scale-110 transition-transform duration-200">🐕</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-2xl border border-indigo-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-700">In Training</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{pets.filter(p => p.status === 'In Training').length}</p>
              </div>
              <div className="text-3xl text-indigo-500 group-hover:scale-110 transition-transform duration-200">🎓</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl border border-emerald-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700">Available</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{pets.filter(p => p.status === 'Available').length}</p>
              </div>
              <div className="text-3xl text-emerald-500 group-hover:scale-110 transition-transform duration-200">✅</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl border border-amber-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">In Treatment</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{pets.filter(p => p.status === 'In Treatment').length}</p>
              </div>
              <div className="text-3xl text-amber-500 group-hover:scale-110 transition-transform duration-200">🏥</div>
            </div>
          </div>
        </div>
      </div>

      {/* Aura Table */}
      <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border border-blue-100 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-blue-200/50">
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider border-b border-blue-200">
                  <div className="flex items-center gap-2">
                    <span>🐕</span>
                    Pet
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider border-b border-blue-200">
                  <div className="flex items-center gap-2">
                    <span>📋</span>
                    Details
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider border-b border-blue-200">
                  <div className="flex items-center gap-2">
                    <span>🔄</span>
                    Status
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider border-b border-blue-200">
                  <div className="flex items-center gap-2">
                    <span>🎓</span>
                    Trainer
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider border-b border-blue-200">
                  <div className="flex items-center gap-2">
                    <span>🏥</span>
                    Vet
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider border-b border-blue-200">
                  <div className="flex items-center gap-2">
                    <span>⚡</span>
                    Actions
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-blue-100/50">
              {pets.map(p => (
                <tr
                  key={p._id}
                  className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 transition-all duration-300 group"
                >
                  {/* Pet Column */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="relative flex-shrink-0 h-14 w-14">
                        <img
                          className="h-14 w-14 rounded-xl object-cover border-2 border-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                          src={getPrimaryImage(p.images)}
                          alt={p.name}
                        />
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300"></div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-gray-900 group-hover:text-blue-900 transition-colors">{p.name}</div>
                        <div className="text-sm text-gray-500">{p.breed || "—"}</div>
                      </div>
                    </div>
                  </td>

                  {/* Details Column */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{p.age || "—"} yrs</div>
                    <div className="text-sm text-gray-500">{p.gender || "—"}</div>
                  </td>

                  {/* Status Column */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      className="w-full bg-gradient-to-br from-gray-50 to-white border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md"
                      value={p.status}
                      onChange={e => mPetStatus.mutate({ id: p._id, status: e.target.value })}
                    >
                      {["Available", "In Treatment", "Ready for Adoption", "In Training", "Training Complete", "Unavailable"].map(opt =>
                        <option key={opt} value={opt}>{opt}</option>
                      )}
                    </select>
                  </td>

                  {/* Trainer Column */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      className="w-full bg-gradient-to-br from-gray-50 to-white border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md"
                      value={tempAssignments[p._id]?.trainerId ?? p.trainer?._id ?? ""}
                      onChange={e => handleTempAssignmentChange(p._id, 'trainer', e.target.value)}
                    >
                      <option value="">Select Trainer</option>
                      {trainers.map(t => (
                        <option key={t._id} value={t._id}>
                          {t.name} {t.specialization ? `- ${t.specialization}` : ''}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Vet Column */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      className="w-full bg-gradient-to-br from-gray-50 to-white border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md"
                      value={tempAssignments[p._id]?.vetId ?? p.vet?._id ?? ""}
                      onChange={e => handleTempAssignmentChange(p._id, 'vet', e.target.value)}
                    >
                      <option value="">Select Vet</option>
                      {vets.map(v => (
                        <option key={v._id} value={v._id}>{v.name}</option>
                      ))}
                    </select>
                  </td>

                  {/* Actions Column */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-2">
                      {/* Single Save Button */}
                      <button
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-2 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 text-xs font-semibold shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 flex items-center justify-center gap-1"
                        onClick={() => handleSaveBothAssignments(p._id)}
                        disabled={!hasChangesToSave(p._id)}
                        title="Save all assignments"
                      >
                        <span>💾</span>
                        Save Changes
                      </button>

                      {/* Delete Button */}
                      <button
                        className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white px-3 py-2 rounded-lg hover:from-red-600 hover:to-pink-700 transition-all duration-300 text-xs font-semibold shadow-sm hover:shadow-md transform hover:scale-105 flex items-center justify-center gap-1"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete ${p.name}?`)) {
                            mDelPet.mutate(p._id);
                          }
                        }}
                      >
                        <span>🗑️</span>
                        Delete Pet
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State with Aura */}
        {pets.length === 0 && (
          <div className="text-center py-16 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded-b-2xl">
            <div className="text-6xl mb-4">🌟</div>
            <p className="text-2xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              No Pets Found
            </p>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start building your pet management system by adding your first furry friend!
            </p>
            <button
              onClick={() => setTab('addpet')}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 mx-auto"
            >
              <span className="text-lg">✨</span>
              Add Your First Pet
            </button>
          </div>
        )}
      </div>
    </Section>
  );
}

// AddPetSection Component
function AddPetSection({
  petForm,
  setPetForm,
  petFiles,
  setPetFiles,
  submitting,
  setTab,
  mAddPet,
  validateForm
}: any) {

  const handleInputChange = useCallback((field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setPetForm((f: any) => ({ ...f, [field]: e.target.value }));
  }, [setPetForm]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setPetFiles(files.slice(0, 8));
  }, [setPetFiles]);

  const removeFile = useCallback((index: number) => {
    setPetFiles((files: File[]) => files.filter((_, i) => i !== index));
  }, [setPetFiles]);

  const resetForm = useCallback(() => {
    setPetForm({ name: "", breed: "", age: "", gender: "", fosterDuration: "", description: "", careInstructions: "", location: "", contact: "" });
    setPetFiles([]);
  }, [setPetForm, setPetFiles]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) { toast.error("Complete all required fields."); return; }
    if (petFiles.length === 0) { toast.error("Please add photos."); return; }
    if (petFiles.length > 8) { toast.error("Max 8 photos allowed."); return; }
    const fd = new FormData();
    Object.entries(petForm).forEach(([k, v]) => fd.append(k, v as string));
    petFiles.forEach(f => fd.append("images", f));
    mAddPet.mutate(fd);
  }, [petForm, petFiles, validateForm, mAddPet]);

  return (
    <Section
      title="Add New Pet"
      action={
        <button
          onClick={() => setTab('allpets')}
          className="bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 px-6 py-3 rounded-xl hover:from-gray-200 hover:to-gray-100 transition-all duration-200 font-semibold border border-gray-300 shadow-sm hover:shadow-md flex items-center gap-2 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
          Back to Pets
        </button>
      }
      className="w-full"
    >
      <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border border-blue-100 p-1 w-full">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 w-full">
          {/* Pet Name */}
          <div className="space-y-3 group">
            <label className="block font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-blue-600 text-lg">🐕</span>
              Pet Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border-2 border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/80 hover:border-blue-300 shadow-sm hover:shadow-md"
              value={petForm.name}
              required
              onChange={handleInputChange('name')}
              placeholder="Enter pet's name..."
            />
          </div>

          {/* Breed */}
          <div className="space-y-3 group">
            <label className="block font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-amber-600 text-lg">🏷️</span>
              Breed
            </label>
            <input
              type="text"
              className="w-full border-2 border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/80 hover:border-blue-300 shadow-sm hover:shadow-md"
              value={petForm.breed}
              onChange={handleInputChange('breed')}
              placeholder="e.g., Golden Retriever"
            />
          </div>

          {/* Age */}
          <div className="space-y-3 group">
            <label className="block font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-green-600 text-lg">🎂</span>
              Age (years)
            </label>
            <input
              type="number"
              className="w-full border-2 border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/80 hover:border-blue-300 shadow-sm hover:shadow-md"
              min={0}
              max={30}
              value={petForm.age}
              onChange={handleInputChange('age')}
              placeholder="0"
            />
          </div>

          {/* Gender */}
          <div className="space-y-3 group">
            <label className="block font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-purple-600 text-lg">⚧️</span>
              Gender <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border-2 border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/80 hover:border-blue-300 shadow-sm hover:shadow-md appearance-none cursor-pointer"
              value={petForm.gender}
              required
              onChange={handleInputChange('gender')}
            >
              <option value="" className="text-gray-400">Select Gender</option>
              <option value="Male" className="text-gray-700">Male</option>
              <option value="Female" className="text-gray-700">Female</option>
            </select>
          </div>

          {/* Foster Duration 
          <div className="space-y-3 group">
            <label className="block font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-indigo-600 text-lg">⏰</span>
              Foster Duration <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border-2 border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/80 hover:border-blue-300 shadow-sm hover:shadow-md appearance-none cursor-pointer"
              value={petForm.fosterDuration}
              required
              onChange={handleInputChange('fosterDuration')}
            >
              <option value="" className="text-gray-400">Select Duration</option>
              <option value="1-2 weeks" className="text-gray-700">1–2 weeks</option>
              <option value="3-4 weeks" className="text-gray-700">3–4 weeks</option>
              <option value="1+ months" className="text-gray-700">1+ months</option>
            </select>
          </div>*/}

          {/* Location */}
          <div className="space-y-3 group">
            <label className="block font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-red-600 text-lg">📍</span>
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border-2 border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/80 hover:border-blue-300 shadow-sm hover:shadow-md"
              value={petForm.location}
              required
              onChange={handleInputChange('location')}
              placeholder="City, State"
            />
          </div>

          {/* Contact Info */}
          <div className="space-y-3 group">
            <label className="block font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-teal-600 text-lg">📞</span>
              Contact Info <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border-2 border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/80 hover:border-blue-300 shadow-sm hover:shadow-md"
              value={petForm.contact}
              required
              onChange={handleInputChange('contact')}
              placeholder="Phone or email"
            />
          </div>

          {/* Description */}
          <div className="col-span-1 md:col-span-2 space-y-3 group">
            <label className="block font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-blue-600 text-lg">📝</span>
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full border-2 border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/80 hover:border-blue-300 shadow-sm hover:shadow-md resize-vertical"
              rows={4}
              value={petForm.description}
              required
              onChange={handleInputChange('description')}
              placeholder="Tell us about this pet's personality, history, and special qualities..."
            />
          </div>

          {/* Care Instructions */}
          <div className="col-span-1 md:col-span-2 space-y-3 group">
            <label className="block font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-green-600 text-lg">❤️</span>
              Care Instructions
            </label>
            <textarea
              className="w-full border-2 border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/80 hover:border-blue-300 shadow-sm hover:shadow-md resize-vertical"
              rows={3}
              value={petForm.careInstructions}
              onChange={handleInputChange('careInstructions')}
              placeholder="Special care needs, dietary requirements, exercise routine..."
            />
          </div>

          {/* Photos Upload */}
          <div className="col-span-1 md:col-span-2 space-y-4 group">
            <label className="block font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-purple-600 text-lg">📸</span>
              Photos <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <input
                type="file"
                id="pet-images"
                accept="image/png,image/jpeg,image/gif,image/webp"
                multiple
                required
                className="hidden"
                onChange={handleFileChange}
              />
              <label
                htmlFor="pet-images"
                className="block border-2 border-dashed border-blue-200 rounded-2xl p-8 text-center transition-all duration-300 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer group/upload"
              >
                <div className="text-4xl mb-3 text-blue-400 group-hover/upload:text-blue-500 transition-colors duration-200">📤</div>
                <p className="text-gray-700 font-medium mb-1">Click to upload images</p>
                <p className="text-sm text-gray-500">PNG, JPG, GIF, WEBP up to 15MB each • Max 8 photos</p>
                <p className="text-xs text-blue-500 mt-2 font-medium">Click anywhere in this area to select files</p>
              </label>
            </div>

            {/* Image Previews */}
            {petFiles.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  Selected Photos ({petFiles.length}/8)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {petFiles.map((f: File, index: number) => (
                    <div key={f.name} className="relative group/preview animate-in fade-in duration-300">
                      <img
                        src={URL.createObjectURL(f)}
                        className="w-full h-24 object-cover rounded-xl border-2 border-gray-200 shadow-sm group-hover/preview:shadow-md transition-all duration-200"
                        alt="preview"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-all duration-200 shadow-lg hover:scale-110 transform"
                      >
                        ×
                      </button>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover/preview:bg-opacity-20 rounded-xl transition-all duration-200 flex items-center justify-center">
                        <span className="opacity-0 group-hover/preview:opacity-100 text-white text-xs font-medium transition-opacity duration-200">
                          Click to remove
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="col-span-1 md:col-span-2 flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              className="flex-1 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 rounded-xl px-6 py-4 hover:from-gray-200 hover:to-gray-100 transition-all duration-200 font-semibold border-2 border-gray-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={submitting}
              onClick={resetForm}
            >
              <span>🗑️</span>
              Clear Form
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl px-6 py-4 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-[1.02]"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Pet Profile...
                </>
              ) : (
                <>
                  <span className="text-lg">✨</span>
                  Create Pet Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Section>
  );
}

// TrainerSection Component with Enhanced Dropdowns
// TrainerSection Component with Enhanced Dropdowns and Auto Form Clearing
// TrainerSection Component with Enhanced Dropdowns, Auto Form Clearing, and Debugging
function TrainerSection({
  allPetsQ,
  trainersQ,
  assign,
  setAssign,
  mAssignTrainer,
  mRemoveTrainer
}: any) {
  const pets = useMemo(() => Array.isArray(allPetsQ.data) ? allPetsQ.data : [], [allPetsQ.data]);
  const trainerMap = useMemo(() => {
    const map: { [key: string]: Trainer } = {};
    trainersQ.data?.forEach((trainer: Trainer) => {
      map[trainer._id] = trainer;
    });
    return map;
  }, [trainersQ.data]);
  
  // Get current assignments from allPets (pets that have trainers assigned)
  const assignments = useMemo(() => {
    return pets
      .filter(p => p.trainer && p.status === 'In Training')
      .map(pet => {
        // If trainer is just an ID string, look up the trainer object
        let trainerObj = pet.trainer;
        
        if (typeof pet.trainer === 'string') {
          // Trainer is just an ID, look it up in the trainer map
          trainerObj = trainerMap[pet.trainer];
        } else if (pet.trainer && !pet.trainer.name) {
          // Trainer is an object but missing name, try to enrich it
          trainerObj = { ...pet.trainer, ...trainerMap[pet.trainer._id] };
        }
        
        return {
          ...pet,
          trainer: trainerObj
        };
      });
  }, [pets, trainerMap]);

  const handleAssignTrainer = useCallback(() => {
    console.log('🎯 Attempting to assign trainer:', {
      petId: assign.petId,
      trainerId: assign.trainerId,
      notes: assign.notes
    });

    if (assign.petId && assign.trainerId) {
      mAssignTrainer.mutate({ 
        petId: assign.petId, 
        trainerId: assign.trainerId, 
        notes: assign.notes || "" 
      });
    } else {
      toast.error("Select pet & trainer to assign.");
    }
  }, [assign, mAssignTrainer]);

  // Effect to clear form when mutation is successful
  useEffect(() => {
    if (mAssignTrainer.isSuccess) {
      console.log('✅ Assignment successful, clearing form');
      setAssign({
        petId: "",
        trainerId: "", 
        notes: ""
      });
    }
  }, [mAssignTrainer.isSuccess, setAssign]);

  // Get available pets (pets without trainers or not in training)
  const availablePets = pets.filter(p => !p.trainer || p.status !== 'In Training');

  return (
    <Section title="Trainer Management">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Assignment Form & Current Assignments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Aura Assignment Form */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white text-lg">
                🎯
              </div>
              <div>
                <h3 className="font-bold text-xl text-gray-900">Assign New Trainer</h3>
                <p className="text-sm text-gray-600">Connect pets with expert trainers</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              {/* Enhanced Pet Dropdown */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <span className="text-blue-600">🐕</span>
                  Select Pet
                </label>
                <div className="relative group">
                  <select
                    className="w-full bg-gradient-to-br from-white to-blue-50/50 border-2 border-blue-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md hover:border-blue-300 appearance-none cursor-pointer pr-10"
                    value={assign.petId || ""}
                    onChange={e => setAssign((a: any) => ({ ...a, petId: e.target.value }))}
                  >
                    <option value="" className="text-gray-400">Choose a pet...</option>
                    {availablePets.map(p => (
                      <option key={p._id} value={p._id} className="text-gray-700 py-2">
                        {p.name} - {p.breed} ({p.status})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <div className="text-blue-500 transform group-hover:scale-110 transition-transform duration-200">
                      ▼
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"></div>
                </div>
                <div className="text-xs text-gray-500">
                  {availablePets.length} pets available for training
                </div>
              </div>

              {/* Enhanced Trainer Dropdown */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <span className="text-green-600">👤</span>
                  Select Trainer
                </label>
                <div className="relative group">
                  <select
                    className="w-full bg-gradient-to-br from-white to-green-50/50 border-2 border-green-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 shadow-sm hover:shadow-md hover:border-green-300 appearance-none cursor-pointer pr-10"
                    value={assign.trainerId || ""}
                    onChange={e => setAssign((a: any) => ({ ...a, trainerId: e.target.value }))}
                  >
                    <option value="" className="text-gray-400">Choose a trainer...</option>
                    {trainersQ.data?.map((tr: Trainer) => (
                      <option key={tr._id} value={tr._id} className="text-gray-700 py-2">
                        {tr.name} {tr.specialization ? `- ${tr.specialization}` : ''}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <div className="text-green-500 transform group-hover:scale-110 transition-transform duration-200">
                      ▼
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"></div>
                </div>
                <div className="text-xs text-gray-500">
                  {trainersQ.data?.length || 0} trainers available
                </div>
              </div>

              {/* Assign Button */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 opacity-0">
                  Action
                </label>
                <button
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 group"
                  onClick={handleAssignTrainer}
                  disabled={!assign.petId || !assign.trainerId || mAssignTrainer.isPending}
                >
                  {mAssignTrainer.isPending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Assigning...
                    </>
                  ) : (
                    <>
                      <span className="text-lg group-hover:scale-110 transition-transform duration-200">✨</span>
                      Assign Trainer
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Training Notes */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="text-purple-600">📝</span>
                Training Notes (Optional)
              </label>
              <div className="relative group">
                <input
                  className="w-full bg-gradient-to-br from-white to-purple-50/50 border-2 border-purple-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 shadow-sm hover:shadow-md hover:border-purple-300"
                  placeholder="Special instructions, behavior notes, or training focus..."
                  value={assign.notes || ""}
                  onChange={e => setAssign((a: any) => ({ ...a, notes: e.target.value }))}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>
          </div>

          {/* Current Assignments with Aura */}
          <div className="bg-gradient-to-br from-white to-amber-50/30 rounded-2xl border border-amber-100 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center text-white text-lg">
                  📋
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-900">Current Trainer Assignments</h3>
                  <p className="text-sm text-gray-600">Active training relationships</p>
                </div>
              </div>
              <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-semibold">
                {assignments.length} active
              </span>
            </div>

            <div className="grid gap-4">
              {assignments.length === 0 ? (
                <div className="text-center py-12 bg-gradient-to-br from-amber-50/50 to-orange-50/30 rounded-2xl border-2 border-dashed border-amber-200">
                  <div className="text-6xl mb-4">🎓</div>
                  <p className="text-xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    No Active Assignments
                  </p>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Start by assigning a trainer to one of your pets above!
                  </p>
                </div>
              ) : assignments.map(p => (
                <div
                  key={p._id}
                  className="bg-gradient-to-br from-white to-blue-50/50 rounded-2xl border border-blue-200 p-5 hover:shadow-xl transition-all duration-300 hover:border-blue-300 group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100 rounded-full -translate-y-10 translate-x-10 opacity-50 group-hover:opacity-70 transition-opacity"></div>

                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative flex-shrink-0">
                          <img
                            src={getPrimaryImage(p.images)}
                            className="w-14 h-14 object-cover rounded-xl border-2 border-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                            alt={p.name}
                          />
                          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300"></div>
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-lg group-hover:text-blue-900 transition-colors">
                            {p.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            Trainer: <span className="font-semibold text-green-600">
                              {p.trainer?.name || "No trainer assigned"}
                            </span>
                          </div>
                          {p.trainer?.specialization && (
                            <div className="text-xs text-blue-600 mt-1 bg-blue-50 px-2 py-1 rounded-full inline-block">
                              {p.trainer.specialization}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            Status: {p.status}
                          </div>
                        </div>
                      </div>
                      <button
                        className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors bg-red-50 px-3 py-1 rounded-lg border border-red-200 hover:bg-red-100"
                        onClick={() => {
                          if (window.confirm(`Remove trainer from ${p.name}?`)) {
                            mRemoveTrainer.mutate(p._id);
                          }
                        }}
                        disabled={mRemoveTrainer.isPending}
                      >
                        {mRemoveTrainer.isPending ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Available Trainers with Aura */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6 shadow-lg h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white text-lg">
              ⭐
            </div>
            <div>
              <h3 className="font-bold text-xl text-gray-900">Available Trainers</h3>
              <p className="text-sm text-gray-600">Expert professionals</p>
            </div>
          </div>

          <div className="space-y-4">
            {trainersQ.data?.map((trainer: Trainer) => (
              <div
                key={trainer._id}
                className="bg-gradient-to-br from-white to-green-50/50 rounded-2xl border border-green-200 p-4 hover:shadow-lg transition-all duration-300 hover:border-green-300 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-12 h-12 bg-green-100 rounded-full -translate-y-6 translate-x-6 opacity-50 group-hover:opacity-70 transition-opacity"></div>

                <div className="relative z-10">
                  <div className="font-bold text-gray-900 text-lg mb-2 group-hover:text-green-900 transition-colors">
                    {trainer.name}
                  </div>
                  {trainer.specialization && (
                    <div className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-xl border border-green-100 mb-3">
                      <span className="font-semibold">Specialization:</span> {trainer.specialization}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded-lg">Professional Trainer</span>
                    <span className="text-green-600 font-semibold">Available</span>
                  </div>
                </div>
              </div>
            ))}

            {(!trainersQ.data || trainersQ.data.length === 0) && (
              <div className="text-center py-8 bg-gradient-to-br from-gray-50 to-green-50/30 rounded-2xl border-2 border-dashed border-gray-300">
                <div className="text-4xl mb-3">😔</div>
                <p className="text-lg font-semibold text-gray-900 mb-2">No Trainers Available</p>
                <p className="text-gray-600 text-sm">Check back later for available trainers</p>
              </div>
            )}
          </div>

          {/* Stats Summary */}
          <div className="mt-6 pt-4 border-t border-green-200">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center bg-white rounded-xl p-3 border border-green-100 shadow-sm">
                <div className="text-lg font-bold text-green-600">{trainersQ.data?.length || 0}</div>
                <div className="text-xs text-gray-600">Total Trainers</div>
              </div>
              <div className="text-center bg-white rounded-xl p-3 border border-green-100 shadow-sm">
                <div className="text-lg font-bold text-blue-600">{assignments.length}</div>
                <div className="text-xs text-gray-600">Active Assignments</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

// ProTrainSection Component
function ProTrainSection({
  allPetsQ,
  proTQ,
  orgTrainQ,
  proTrain,
  setProTrain,
  trainingStartDate,
  setTrainingStartDate,
  mAssignProTrain,
  mRemoveTrainer // Add this prop
}: any) {
  const pets = useMemo(() => Array.isArray(allPetsQ.data) ? allPetsQ.data : [], [allPetsQ.data]);

  // Filter available pets for shelter training
  const availablePets = useMemo(() => 
    pets.filter(pet => 
      (pet.status === 'Available' || pet.status === 'Ready for Adoption') && !pet.trainer
    ), [pets]);

  // Handle shelter training submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (proTrain.petId && proTrain.proTrainerId && proTrain.program && proTrain.goals) {
      const trainingData = {
        petId: proTrain.petId,
        trainerId: proTrain.proTrainerId,
        trainingDuration: getDurationFromProgram(proTrain.program),
        trainingGoals: proTrain.goals,
        trainingNotes: proTrain.notes || ""
      };
      mAssignProTrain.mutate(trainingData);
    } else {
      toast.error("Fill all required fields.");
    }
  }, [proTrain, mAssignProTrain]);

  // Clear form after successful submission
  useEffect(() => {
    if (mAssignProTrain.isSuccess) {
      setProTrain({
        petId: "",
        proTrainerId: "",
        program: "",
        goals: [],
        notes: ""
      });
      setTrainingStartDate("");
    }
  }, [mAssignProTrain.isSuccess, setProTrain, setTrainingStartDate]);

  // Complete training program
  const completeTrainingProgram = async (petId: string) => {
    const finalNotes = prompt('Enter final training notes and achievements:');
    if (!finalNotes) return;

    try {
      await http.patch(`/training/shelter-training/${petId}/complete`, {
        finalNotes,
        achievements: ['basic_obedience', 'socialization']
      });
      toast.success('Training program completed successfully');
      orgTrainQ.refetch(); // Refresh active programs
    } catch (error) {
      console.error('Error completing training:', error);
      toast.error('Failed to complete training program');
    }
  };

  // Remove trainer from pet
  const removeTrainer = async (petId: string) => {
    if (!confirm('Are you sure you want to remove the trainer from this pet?')) return;
    
    try {
      mRemoveTrainer.mutate(petId);
    } catch (error) {
      console.error('Error removing trainer:', error);
      toast.error('Failed to remove trainer');
    }
  };

  // Helper function to get duration from program
  const getDurationFromProgram = (program: string) => {
    const durations: { [key: string]: string } = {
      '4weeks': '4 weeks',
      '6weeks': '6 weeks',
      '8weeks': '8 weeks'
    };
    return durations[program] || '4 weeks';
  };

  return (
    <Section title="🎯 Professional Training Management">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Aura Form Section */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-100 p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center text-white text-lg">
                ⭐
              </div>
              <div>
                <h3 className="font-bold text-xl text-gray-900">Start New Training Program</h3>
                <p className="text-sm text-gray-600">Advanced professional training programs</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Pet Selection */}
                <div className="space-y-2 group">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="text-blue-600">🐕</span>
                    Select Pet <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      className="w-full bg-gradient-to-br from-white to-blue-50/50 border-2 border-blue-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md hover:border-blue-300 appearance-none cursor-pointer"
                      value={proTrain.petId || ""}
                      onChange={e => setProTrain((d: any) => ({ ...d, petId: e.target.value }))}
                      required
                    >
                      <option value="" className="text-gray-400">Choose a pet...</option>
                      {availablePets.map(p => (
                        <option key={p._id} value={p._id} className="text-gray-700 py-2">
                          {p.name} - {p.breed} ({p.status})
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <div className="text-blue-500">▼</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {availablePets.length} pets available for training
                  </div>
                </div>

                {/* Trainer Selection */}
                <div className="space-y-2 group">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="text-green-600">👤</span>
                    Select Trainer <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      className="w-full bg-gradient-to-br from-white to-green-50/50 border-2 border-green-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 shadow-sm hover:shadow-md hover:border-green-300 appearance-none cursor-pointer"
                      value={proTrain.proTrainerId || ""}
                      onChange={e => setProTrain((d: any) => ({ ...d, proTrainerId: e.target.value }))}
                      required
                    >
                      <option value="" className="text-gray-400">Choose a trainer...</option>
                      {proTQ.data?.map((t: ProfessionalTrainer) => (
                        <option key={t._id} value={t._id} className="text-gray-700 py-2">
                          {t.name} - {t.specialization || 'General Trainer'}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <div className="text-green-500">▼</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {proTQ.data?.length || 0} trainers available
                  </div>
                </div>

                {/* Program Selection */}
                <div className="space-y-2 group">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="text-purple-600">📚</span>
                    Training Program <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      className="w-full bg-gradient-to-br from-white to-purple-50/50 border-2 border-purple-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 shadow-sm hover:shadow-md hover:border-purple-300 appearance-none cursor-pointer"
                      value={proTrain.program || ""}
                      onChange={e => {
                        setProTrain((d: any) => ({ 
                          ...d, 
                          program: e.target.value, 
                          goals: programOpts.find(opt => opt.value === e.target.value)?.goals 
                        }));
                      }}
                      required
                    >
                      <option value="" className="text-gray-400">Select program...</option>
                      {programOpts.map(opt => (
                        <option key={opt.value} value={opt.value} className="text-gray-700 py-2">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <div className="text-purple-500">▼</div>
                    </div>
                  </div>
                </div>

                {/* Training Goals */}
                <div className="space-y-2 group">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="text-indigo-600">🎯</span>
                    Training Goals <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      multiple
                      className="w-full bg-gradient-to-br from-white to-indigo-50/50 border-2 border-indigo-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm hover:shadow-md hover:border-indigo-300 h-32 appearance-none cursor-pointer"
                      value={proTrain.goals || []}
                      onChange={e => {
                        const selectedGoals = Array.from(e.target.selectedOptions, option => option.value);
                        setProTrain((d: any) => ({ ...d, goals: selectedGoals }));
                      }}
                      required
                    >
                      <option value="basic_obedience" className="text-gray-700 p-2">Basic Obedience</option>
                      <option value="leash_training" className="text-gray-700 p-2">Leash Training</option>
                      <option value="behavior_modification" className="text-gray-700 p-2">Behavior Modification</option>
                      <option value="socialization" className="text-gray-700 p-2">Socialization</option>
                      <option value="advanced_commands" className="text-gray-700 p-2">Advanced Commands</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <div className="text-indigo-500">▼</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <span className="text-blue-500">💡</span>
                    Hold Ctrl/Cmd to select multiple goals
                  </p>
                </div>
              </div>

              {/* Training Notes */}
              <div className="space-y-2 group">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <span className="text-teal-600">📝</span>
                  Training Notes & Special Instructions
                </label>
                <div className="relative">
                  <textarea
                    className="w-full bg-gradient-to-br from-white to-teal-50/50 border-2 border-teal-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300 shadow-sm hover:shadow-md hover:border-teal-300 resize-vertical"
                    placeholder="Behavior observations, special needs, or specific training focus areas..."
                    value={proTrain.notes || ""}
                    onChange={e => setProTrain((d: any) => ({ ...d, notes: e.target.value }))}
                    rows={3}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 group"
                  disabled={!proTrain.petId || !proTrain.proTrainerId || !proTrain.program || !proTrain.goals?.length || mAssignProTrain.isPending}
                >
                  {mAssignProTrain.isPending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Starting Program...
                    </>
                  ) : (
                    <>
                      <span className="text-xl group-hover:scale-110 transition-transform duration-200">🎯</span>
                      Start Professional Training Program
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Active Training Programs with Aura */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-100 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white text-lg">
                  ⚡
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-900">Active Training Programs</h3>
                  <p className="text-sm text-gray-600">Currently running training sessions</p>
                </div>
              </div>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                {orgTrainQ.data?.length || 0} active
              </span>
            </div>

            <div className="grid gap-4">
              {orgTrainQ.data?.length === 0 ? (
                <div className="text-center py-12 bg-gradient-to-br from-blue-50/50 to-cyan-50/30 rounded-2xl border-2 border-dashed border-blue-200">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    No Active Programs
                  </p>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Start a new professional training program to see it here!
                  </p>
                </div>
              ) : orgTrainQ.data?.map((pet: Pet) => (
                <div 
                  key={pet._id} 
                  className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border border-blue-200 p-5 hover:shadow-xl transition-all duration-300 hover:border-blue-300 group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100 rounded-full -translate-y-10 translate-x-10 opacity-50 group-hover:opacity-70 transition-opacity"></div>
                  
                  <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-lg">
                          🐕
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-lg">{pet.name}</div>
                          <div className="text-sm text-gray-600">
                            by <span className="font-semibold text-green-600">{pet.trainer?.name}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={statusChip(pet.status) + " transform hover:scale-105 transition-transform duration-200"}>
                          {pet.status || "Active"}
                        </span>
                        <button
                          onClick={() => removeTrainer(pet._id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-1"
                          disabled={mRemoveTrainer.isPending}
                        >
                          {mRemoveTrainer.isPending ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <>🗑️ Remove</>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-white rounded-xl p-3 border border-blue-100 shadow-sm">
                        <div className="text-sm font-semibold text-gray-900 mb-1">Training Program</div>
                        <div className="text-xs text-blue-600 font-medium">
                          {pet.trainingDuration || '4 weeks'} • {pet.trainingType || 'Professional Training'}
                        </div>
                      </div>
                      
                      {pet.trainingStartDate && (
                        <div className="bg-white rounded-xl p-3 border border-green-100 shadow-sm">
                          <div className="text-xs text-gray-600 mb-1">Started</div>
                          <div className="text-sm font-semibold text-gray-900">
                            {new Date(pet.trainingStartDate).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {pet.trainingGoals && pet.trainingGoals.length > 0 && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 border border-green-200 mb-3">
                        <div className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                          <span>🎯</span>
                          Training Goals
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {pet.trainingGoals.map((goal: string) => (
                            <span key={goal} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                              {goal.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {pet.trainingNotes && (
                      <div className="bg-white rounded-xl p-3 border border-gray-200">
                        <div className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                          <span>📋</span>
                          Trainer Notes
                        </div>
                        <div className="text-sm text-gray-600">
                          {pet.trainingNotes}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => completeTrainingProgram(pet._id)}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <span>✅</span>
                        Complete Training
                      </button>
                      <button
                        onClick={() => {/* View progress implementation */}}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <span>📊</span>
                        View Progress
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Training Programs Info */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-6 shadow-lg h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-lg">
              📚
            </div>
            <div>
              <h3 className="font-bold text-xl text-gray-900">Training Programs</h3>
              <p className="text-sm text-gray-600">Available program options</p>
            </div>
          </div>

          <div className="space-y-4">
            {programOpts.map(program => (
              <div 
                key={program.value} 
                className="bg-gradient-to-br from-white to-indigo-50/30 rounded-2xl border border-indigo-200 p-4 hover:shadow-lg transition-all duration-300 hover:border-indigo-300 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-100 rounded-full -translate-y-6 translate-x-6 opacity-50 group-hover:opacity-70 transition-opacity"></div>
                
                <div className="relative z-10">
                  <div className="font-bold text-gray-900 text-lg mb-2 group-hover:text-indigo-900 transition-colors">
                    {program.label}
                  </div>
                  <div className="text-sm text-indigo-700 bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-100">
                    <span className="font-semibold">Goals:</span> {program.goals.map(g => 
                      g.replace(/([A-Z])/g, ' $1').trim()
                    ).join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats Summary */}
          <div className="mt-6 pt-4 border-t border-indigo-200">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center bg-white rounded-xl p-3 border border-indigo-100 shadow-sm">
                <div className="text-lg font-bold text-indigo-600">{programOpts.length}</div>
                <div className="text-xs text-gray-600">Programs</div>
              </div>
              <div className="text-center bg-white rounded-xl p-3 border border-indigo-100 shadow-sm">
                <div className="text-lg font-bold text-green-600">{orgTrainQ.data?.length || 0}</div>
                <div className="text-xs text-gray-600">Active</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

// AvailabilitySection Component
function AvailabilitySection({
  user,
  availQ,
  availabilitySlot,
  setAvailabilitySlot,
  mAvailability,
  mDeleteAvailability
}: any) {

  const handleAddAvailability = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!availabilitySlot.startTime || !availabilitySlot.endTime || !availabilitySlot.date) {
      toast.error("Please select date and both start and end times");
      return;
    }

    if (availabilitySlot.startTime >= availabilitySlot.endTime) {
      toast.error("Start time must be before end time");
      return;
    }

    // Check for overlapping slots
    const currentSlots = Array.isArray(availQ.data) ? availQ.data : [];
    const hasOverlap = currentSlots.some(slot =>
      slot.day === availabilitySlot.day &&
      slot.date === availabilitySlot.date &&
      ((availabilitySlot.startTime >= slot.startTime && availabilitySlot.startTime < slot.endTime) ||
        (availabilitySlot.endTime > slot.startTime && availabilitySlot.endTime <= slot.endTime) ||
        (availabilitySlot.startTime <= slot.startTime && availabilitySlot.endTime >= slot.endTime))
    );

    if (hasOverlap) {
      toast.error("This time slot overlaps with an existing availability slot");
      return;
    }

    const slotToAdd: AvailabilitySlot = {
      day: availabilitySlot.day,
      startTime: availabilitySlot.startTime,
      endTime: availabilitySlot.endTime,
      date: availabilitySlot.date
    };

    console.log("Adding availability slot:", slotToAdd);
    mAvailability.mutate(slotToAdd);
  }, [availabilitySlot, availQ.data, mAvailability]);

  return (
    <Section
      title="My Availability"
      action={
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
          <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-blue-600">📅</span>
            Add New Time Slot
          </h3>
          <form onSubmit={handleAddAvailability} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Date Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-blue-500">📅</span>
                  Select Date
                </label>
                <input
                  type="date"
                  value={availabilitySlot.date}
                  onChange={(e) => {
                    const dateString = e.target.value;
                    if (dateString) {
                      const date = new Date(dateString + 'T12:00:00');
                      const dayName = date.toLocaleDateString('en-US', {
                        weekday: 'long',
                        timeZone: 'UTC'
                      });
                      setAvailabilitySlot((a: any) => ({
                        ...a,
                        date: dateString,
                        day: dayName
                      }));
                    }
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-blue-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-blue-300 shadow-sm"
                  required
                />
              </div>

              {/* Start Time Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-green-500">⏰</span>
                  Start Time
                </label>
                <input
                  type="time"
                  value={availabilitySlot.startTime}
                  onChange={(e) => setAvailabilitySlot((a: any) => ({ ...a, startTime: e.target.value }))}
                  className="w-full border border-blue-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-blue-300 shadow-sm"
                  required
                />
              </div>

              {/* End Time Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-red-500">⏰</span>
                  End Time
                </label>
                <input
                  type="time"
                  value={availabilitySlot.endTime}
                  onChange={(e) => setAvailabilitySlot((a: any) => ({ ...a, endTime: e.target.value }))}
                  className="w-full border border-blue-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-blue-300 shadow-sm"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const todayString = today.toISOString().split('T')[0];
                  const todayDay = today.toLocaleDateString('en-US', { weekday: 'long' });
                  setAvailabilitySlot({
                    day: todayDay,
                    startTime: "",
                    endTime: "",
                    date: todayString
                  });
                }}
                className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold border border-gray-300 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              >
                <span>🗑️</span>
                Clear Form
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={mAvailability.isPending || !availabilitySlot.date || !availabilitySlot.startTime || !availabilitySlot.endTime}
              >
                {mAvailability.isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Adding Slot...
                  </>
                ) : (
                  <>
                    <span>+</span>
                    Add Time Slot
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      }
    >
      {availQ.isLoading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your availability...</p>
          <p className="text-sm text-gray-500 mt-1">Please wait while we fetch your schedule</p>
        </div>
      ) : availQ.isError ? (
        <div className="text-center py-12 bg-red-50 rounded-2xl border border-red-200">
          <div className="text-4xl mb-4">😕</div>
          <p className="text-lg font-semibold text-red-700 mb-2">Error loading availability</p>
          <p className="text-red-600 mb-4">There was a problem loading your availability slots</p>
          <button
            onClick={() => availQ.refetch()}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      ) : !availQ.data || (Array.isArray(availQ.data) && availQ.data.length === 0) ? (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-300">
          <div className="text-6xl mb-4">🕒</div>
          <p className="text-2xl font-bold text-gray-900 mb-3">No availability set yet</p>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            Start by adding your available time slots above. These will be used to schedule meetings with potential adopters.
          </p>
        </div>
      ) : Array.isArray(availQ.data) ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-blue-600">📋</span>
              Your Available Time Slots
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                {availQ.data.length} slots
              </span>
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortAvailabilityByDate(availQ.data).map((a, idx) => {
              let displayDate = "No date set";
              let actualDay = a.day;

              if (a.date) {
                try {
                  if (a.date.includes('T')) {
                    const datePart = a.date.split('T')[0];
                    const [year, month, day] = datePart.split('-').map(Number);
                    const dateObj = new Date(year, month - 1, day);
                    displayDate = dateObj.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    });
                    actualDay = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                  } else {
                    const [year, month, day] = a.date.split('-').map(Number);
                    const dateObj = new Date(year, month - 1, day);
                    displayDate = dateObj.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    });
                    actualDay = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                  }
                } catch (error) {
                  console.error('Error parsing date:', a.date, error);
                  displayDate = "Invalid date format";
                }
              }

              return (
                <div
                  key={a._id || `${a.day}-${a.startTime}-${a.endTime}-${idx}`}
                  className="bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-blue-200 p-5 hover:shadow-lg transition-all duration-300 hover:border-blue-300 group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100 rounded-full -translate-y-10 translate-x-10 opacity-50 group-hover:opacity-70 transition-opacity"></div>

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <div className="font-bold text-gray-900 text-lg">{actualDay || "No day set"}</div>
                      </div>
                      <button
                        className="opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-200 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs hover:bg-red-600 hover:scale-110 shadow-lg"
                        onClick={() => mDeleteAvailability.mutate(a)}
                        disabled={mDeleteAvailability.isPending}
                        title="Remove this time slot"
                      >
                        {mDeleteAvailability.isPending ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          "×"
                        )}
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
                        <div className="text-blue-500 text-lg">🕒</div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-700">Time Slot</div>
                          <div className="text-lg font-bold text-gray-900">
                            {a.startTime || "Not set"} – {a.endTime || "Not set"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
                        <div className="text-green-500 text-lg">📅</div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-700">Date</div>
                          <div className="text-sm font-semibold text-gray-900">
                            {displayDate}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500 flex items-center justify-between">
                        <span>Duration: {calculateDuration(a.startTime, a.endTime)}</span>
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                          Available
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Stats */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200 mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{availQ.data.length}</div>
                <div className="text-sm text-gray-600">Total Slots</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Array.from(new Set(availQ.data.map(s => {
                    if (s.date) {
                      try {
                        const datePart = s.date.includes('T') ? s.date.split('T')[0] : s.date;
                        const [year, month, day] = datePart.split('-').map(Number);
                        const dateObj = new Date(year, month - 1, day);
                        return dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                      } catch (error) {
                        return s.day || "Unknown";
                      }
                    }
                    return s.day || "Unknown";
                  }))).length}
                </div>
                <div className="text-sm text-gray-600">Days Covered</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {calculateTotalHours(availQ.data)}
                </div>
                <div className="text-sm text-gray-600">Total Hours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {getMostFrequentDay(availQ.data)}
                </div>
                <div className="text-sm text-gray-600">Most Available</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-red-50 rounded-2xl border border-red-200">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-lg font-semibold text-red-700 mb-2">Invalid data format</p>
          <p className="text-red-600 mb-4">Received unexpected data format from server</p>
        </div>
      )}
    </Section>
  );
}

// AdoptionsSection Component
function AdoptionsSection({
  reqQ,
  setMeetingModal,
  setMeetingDateTime,
  mUpdateReq,
  testAvailabilityAPI
}: any) {

  const onMeeting = useCallback((r: AdoptionReq) => {
    setMeetingModal({ open: true, req: r });
    const defaultDateTime = new Date();
    defaultDateTime.setDate(defaultDateTime.getDate() + 1);
    setMeetingDateTime(defaultDateTime.toISOString().slice(0, 16));
  }, [setMeetingModal, setMeetingDateTime]);

  const onApprove = useCallback((r: AdoptionReq) => mUpdateReq.mutate({ id: r._id, status: "approved" }), [mUpdateReq]);
  const onIgnore = useCallback((r: AdoptionReq) => mUpdateReq.mutate({ id: r._id, status: "ignored" }), [mUpdateReq]);
  const onFinalize = useCallback((r: AdoptionReq) => mUpdateReq.mutate({ id: r._id, status: "finalized" }), [mUpdateReq]);

  return (
    <Section
      title="Adoption Requests"
      action={
        <div className="flex items-center gap-2 text-sm">
          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
            {reqQ.data?.length || 0} total
          </span>
          <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
            {reqQ.data?.filter(r => r.status === 'pending').length || 0} pending
          </span>
          <button
            onClick={testAvailabilityAPI}
            className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-medium hover:bg-yellow-600 transition-colors"
          >
            Test API
          </button>
        </div>
      }
    >
      {reqQ.data?.length === 0 ?
        <Empty>
          <p className="text-lg font-medium text-gray-900 mb-2">No adoption requests</p>
          <p className="text-gray-600">When users submit adoption requests, they will appear here</p>
        </Empty>
        :
        <div className="space-y-4">
          {reqQ.data?.map((r: AdoptionReq) => (
            <RequestCard
              key={r._id}
              r={r}
              onApprove={onApprove}
              onIgnore={onIgnore}
              onMeeting={onMeeting}
              onFinalize={onFinalize}
            />
          ))}
        </div>
      }
    </Section>
  );
}

// Helper functions
const calculateDuration = (startTime: string, endTime: string): string => {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  const hours = Math.floor(diff);
  const minutes = Math.round((diff - hours) * 60);
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
};

const calculateTotalHours = (slots: AvailabilitySlot[]): string => {
  const totalMinutes = slots.reduce((total, slot) => {
    const start = new Date(`2000-01-01T${slot.startTime}`);
    const end = new Date(`2000-01-01T${slot.endTime}`);
    return total + (end.getTime() - start.getTime()) / (1000 * 60);
  }, 0);

  const hours = Math.floor(totalMinutes / 60);
  return `${hours}h`;
};

const getMostFrequentDay = (slots: AvailabilitySlot[]): string => {
  const dayHours: { [key: string]: number } = {};

  slots.forEach(slot => {
    const start = new Date(`2000-01-01T${slot.startTime}`);
    const end = new Date(`2000-01-01T${slot.endTime}`);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    if (dayHours[slot.day]) {
      dayHours[slot.day] += duration;
    } else {
      dayHours[slot.day] = duration;
    }
  });

  const mostAvailable = Object.entries(dayHours).reduce((max, [day, hours]) =>
    hours > max.hours ? { day, hours } : max,
    { day: "None", hours: 0 }
  );

  return mostAvailable.day;
};

const sortAvailabilityByDate = (slots: AvailabilitySlot[]): AvailabilitySlot[] => {
  return [...slots].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    const dateA = new Date(a.date.includes('T') ? a.date : `${a.date}T12:00:00`);
    const dateB = new Date(b.date.includes('T') ? b.date : `${b.date}T12:00:00`);

    return dateA.getTime() - dateB.getTime();
  });
};

// UPDATED API CALLS with proper availability endpoints
const fetchOrgPets = async (): Promise<Pet[]> => {
  const response = await http.get("/pets/management/available-for-training");
  return response.data.pets ?? [];
};

const fetchAllPets = async (): Promise<Pet[]> => {
  const response = await http.get("/pets");
  return response.data ?? [];
};

const fetchRequests = async (): Promise<AdoptionReq[]> => {
  const response = await http.get("/adoptions/requests");
  return response.data ?? [];
};

const fetchAvailability = async (userId: string): Promise<AvailabilitySlot[]> => {
  try {
    console.log("Fetching availability for user:", userId);
    const response = await http.get(`/availability/${userId}`);
    console.log("Availability GET response:", response.data);

    if (response.data && response.data.slots) {
      return response.data.slots;
    } else if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && typeof response.data === 'object') {
      const possibleArrays = ['slots', 'availability', 'data', 'availableSlots', 'timeslots'];
      for (const prop of possibleArrays) {
        if (Array.isArray(response.data[prop])) {
          return response.data[prop];
        }
      }
    }

    console.warn("Unexpected availability response structure:", response.data);
    return [];
  } catch (error: any) {
    console.error("Error fetching availability:", error);
    if (error.response) {
      console.error("Error response:", error.response.data);
    }
    toast.error("Failed to load availability");
    return [];
  }
};

const postAvailability = async (userId: string, slots: AvailabilitySlot[]) => {
  try {
    console.log("Sending availability data:", {
      userId,
      slots,
      role: "staff"
    });

    const response = await http.post(`/availability/${userId}`, {
      role: "staff",
      slots
    });

    console.log("Availability POST response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Error posting availability:", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
    throw error;
  }
};

const deleteAvailability = async (userId: string, slotId?: string, day?: string) => {
  try {
    let url = `/availability/${userId}`;
    const params = new URLSearchParams();

    if (slotId) {
      params.append('slotId', slotId);
    }
    if (day) {
      params.append('day', day);
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await http.delete(url);
    return response.data;
  } catch (error: any) {
    console.error("Error deleting availability:", error);
    throw error;
  }
};

const patchRequestStatus = async (d: { id: string; status: string; meetingDate?: string }) =>
  http.patch(`/adoptions/${d.id}/status`, d);

const patchPetStatus = async (d: { id: string; status: string }) =>
  http.patch(`/pets/${d.id}/status`, { status: d.status });

const fetchTrainers = async (): Promise<Trainer[]> => {
  const response = await http.get("/pets/management/trainers");
  return response.data.trainers ?? [];
};

const assignTrainer = async (d: { petId: string; trainerId: string; notes: string }) =>
  http.patch(`/pets/${d.petId}/assign-trainer`, {
    trainerId: d.trainerId,
    trainingNotes: d.notes
  });

const fetchVets = async (): Promise<Vet[]> => {
  const response = await http.get("/users/vets");
  return response.data ?? [];
};

const assignVet = async (d: { petId: string; vetId: string }) =>
  http.patch(`/pets/${d.petId}/assign-vet`, { vetId: d.vetId });

const fetchProfessionalTrainers = async (): Promise<ProfessionalTrainer[]> => {
  const response = await http.get("/pets/management/trainers");
  return response.data.trainers ?? [];
};

const assignProfessionalTraining = async (d: { petId: string; proTrainerId: string; program: string; goals: string[]; notes: string; }) =>
  http.post(`/training/shelter-training/${d.petId}/assign`, d);

const fetchOrgTraining = async (): Promise<TrainingProgram[]> => {
  const response = await http.get("/pets/management/assigned-trainers");
  return response.data.pets?.filter((pet: Pet) => pet.status === 'In Training') ?? [];
};

const addPet = async (fd: FormData) =>
  http.post("/pets", fd, { headers: { "Content-Type": "multipart/form-data" } });

const deletePet = async (id: string) =>
  http.delete(`/pets/${id}`);

// Main StaffDashboard Component
export default function StaffDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'allpets' | 'addpet' | 'availability' | 'adoptions' | 'trainer' | 'protrain'>('allpets');
  const [meetingModal, setMeetingModal] = useState<{ open: boolean; req?: AdoptionReq } | null>(null);
  const [meetingDateTime, setMeetingDateTime] = useState("");

  // For Add Pet
  const [petForm, setPetForm] = useState({
    name: "",
    breed: "",
    age: "",
    gender: "",
    //fosterDuration: "",
    description: "",
    careInstructions: "",
    location: "",
    contact: "",
  });
  const [petFiles, setPetFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // For Trainer
  const [assign, setAssign] = useState<{ petId?: string; trainerId?: string; notes?: string }>({});
  const [vetAssign, setVetAssign] = useState<{ petId?: string; vetId?: string }>({});
  const [proTrain, setProTrain] = useState<{ petId?: string; proTrainerId?: string; program?: string; goals?: string[]; notes?: string }>({});

  // For Availability
  const [availabilitySlot, setAvailabilitySlot] = useState<{
    day: string;
    startTime: string;
    endTime: string;
    date: string;
  }>({
    day: "Monday",
    startTime: "",
    endTime: "",
    date: new Date().toISOString().split('T')[0]
  });

  // For Training Program
  const [trainingStartDate, setTrainingStartDate] = useState("");

  // State for temporary trainer/vet assignments in the table
  const [tempAssignments, setTempAssignments] = useState<{
    [petId: string]: {
      trainerId?: string;
      vetId?: string;
    }
  }>({});

  // Queries
  const petsQ = useQuery({
    queryKey: ["orgPets"],
    queryFn: fetchOrgPets
  });

  const allPetsQ = useQuery({
    queryKey: ["allPets"],
    queryFn: fetchAllPets
  });

  const reqQ = useQuery({
    queryKey: ["adoptionRequests"],
    queryFn: fetchRequests
  });

  const availQ = useQuery({
    queryKey: ["staffAvailability", user?._id],
    queryFn: () => {
      if (!user?._id) {
        throw new Error("User ID not available");
      }
      return fetchAvailability(user._id);
    },
    enabled: !!user?._id,
    onError: (error) => {
      console.error('Error loading availability:', error);
      toast.error('Failed to load availability slots');
    }
  });

  const trainersQ = useQuery({
    queryKey: ["staffTrainers"],
    queryFn: fetchTrainers,
    onSuccess: (data) => {
      console.log('Trainers loaded:', data);
    },
    onError: (error) => {
      console.error('Error loading trainers:', error);
      toast.error('Failed to load trainers');
    }
  });

  const vetsQ = useQuery({
    queryKey: ["vets"],
    queryFn: fetchVets,
    onSuccess: (data) => {
      console.log('Vets loaded:', data);
    },
    onError: (error) => {
      console.error('Error loading vets:', error);
      toast.error('Failed to load vets');
    }
  });

  const proTQ = useQuery({
    queryKey: ["proT"],
    queryFn: fetchProfessionalTrainers
  });

  const orgTrainQ = useQuery({
    queryKey: ["orgTraining"],
    queryFn: fetchOrgTraining
  });

  // Mutations
  const mAddPet = useMutation({
    mutationFn: addPet,
    onSuccess: () => {
      toast.success("Pet added!");
      qc.invalidateQueries({ queryKey: ["allPets"] });
      setPetForm({ name: "", breed: "", age: "", gender: "", fosterDuration: "", description: "", careInstructions: "", location: "", contact: "" });
      setPetFiles([]);
      setSubmitting(false);
    },
    onError: () => { setSubmitting(false); }
  });

  const mDelPet = useMutation({
    mutationFn: deletePet,
    onSuccess: () => {
      toast.success("Pet deleted!");
      qc.invalidateQueries({ queryKey: ["allPets"] });
    }
  });

  const mAssignTrainer = useMutation({
    mutationFn: assignTrainer,
    onSuccess: () => {
      toast.success("Trainer assigned!");
      qc.invalidateQueries({ queryKey: ["allPets"] });
      qc.invalidateQueries({ queryKey: ["orgTraining"] });
    }
  });

  const mRemoveTrainer = useMutation({
    mutationFn: (petId: string) =>
      http.patch(`/pets/${petId}/remove-trainer`),
    onSuccess: () => {
      toast.success("Trainer removed!");
      qc.invalidateQueries({ queryKey: ["allPets"] });
      qc.invalidateQueries({ queryKey: ["orgTraining"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.msg || "Failed to remove trainer");
    }
  });

  const mAssignVet = useMutation({
    mutationFn: assignVet,
    onSuccess: () => {
      toast.success("Vet assigned!");
      qc.invalidateQueries({ queryKey: ["allPets"] });
    }
  });

  const mAssignProTrain = useMutation({
    mutationFn: assignProfessionalTraining,
    onSuccess: () => {
      toast.success("Professional training started!");
      qc.invalidateQueries({ queryKey: ["orgTraining"] });
    }
  });

  const mUpdateReq = useMutation({
    mutationFn: patchRequestStatus,
    onSuccess: () => {
      toast.success("Request updated");
      qc.invalidateQueries({ queryKey: ["adoptionRequests"] });
      setMeetingModal(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.msg ?? "Failed to update request")
  });

  const mPetStatus = useMutation({
    mutationFn: patchPetStatus,
    onSuccess: () => {
      toast.success("Pet status updated");
      qc.invalidateQueries({ queryKey: ["allPets"] });
    }
  });

  const mAvailability = useMutation({
    mutationFn: (newSlot: AvailabilitySlot) => {
      if (!user?._id) {
        throw new Error("User ID not available");
      }

      const currentSlots = Array.isArray(availQ.data) ? availQ.data : [];
      const mergedSlots = [...currentSlots, newSlot];

      console.log("Merged slots to send:", mergedSlots);

      return postAvailability(user._id, mergedSlots);
    },
    onSuccess: (data) => {
      console.log("Availability saved successfully:", data);
      toast.success("Availability saved successfully!");
      qc.invalidateQueries({ queryKey: ["staffAvailability", user?._id] });
      setAvailabilitySlot({ day: "Monday", startTime: "", endTime: "", date: new Date().toISOString().split('T')[0] });
    },
    onError: (error: any) => {
      console.error("Availability save error:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to save availability";
      toast.error(errorMessage);
    }
  });

  const mDeleteAvailability = useMutation({
    mutationFn: (slotToDelete: AvailabilitySlot) => {
      if (!user?._id) {
        throw new Error("User ID not available");
      }
      return deleteAvailability(user._id, slotToDelete._id, slotToDelete.day);
    },
    onSuccess: () => {
      toast.success("Availability slot removed");
      qc.invalidateQueries({ queryKey: ["staffAvailability"] });
    },
    onError: (error: any) => {
      console.error("Delete availability error:", error);
      toast.error("Failed to remove availability slot");
    }
  });

  // Statistics data
  const statsData = useMemo(() => ({
    totalPets: allPetsQ.data?.length || 0,
    pendingRequests: reqQ.data?.filter(req => req.status === 'pending').length || 0,
    activeTrainings: orgTrainQ.data?.length || 0,
    availableSlots: (Array.isArray(availQ.data) ? availQ.data.length : 0) || 0
  }), [allPetsQ.data, reqQ.data, orgTrainQ.data, availQ.data]);

  // Validate New Pet Form
  const validateForm = useCallback(() => {
    const required = ["name", "gender", "description", "location", "contact"];
    return required.every(field => (petForm as any)[field]);
  }, [petForm]);

  // Handler for temporary assignment changes
  const handleTempAssignmentChange = useCallback((petId: string, type: 'trainer' | 'vet', value: string) => {
    setTempAssignments(prev => ({
      ...prev,
      [petId]: {
        ...prev[petId],
        [type === 'trainer' ? 'trainerId' : 'vetId']: value
      }
    }));
  }, []);

  // Handler for saving assignments
  const handleSaveAssignment = useCallback((petId: string, type: 'trainer' | 'vet') => {
    const assignment = tempAssignments[petId];
    if (!assignment) return;

    if (type === 'trainer' && assignment.trainerId !== undefined) {
      mAssignTrainer.mutate({
        petId,
        trainerId: assignment.trainerId,
        notes: ""
      });
    } else if (type === 'vet' && assignment.vetId !== undefined) {
      mAssignVet.mutate({
        petId,
        vetId: assignment.vetId
      });
    }
  }, [tempAssignments, mAssignTrainer, mAssignVet]);

  // Add this function to test the API
  const testAvailabilityAPI = async () => {
    if (!user?._id) return;

    try {
      console.log("=== Testing Availability API ===");

      // Test GET first
      console.log("Testing GET /availability/" + user._id);
      const getResponse = await http.get(`/availability/${user._id}`);
      console.log("GET Response:", getResponse.data);

      // Test POST with proper data structure
      const testSlot = {
        day: "Monday",
        startTime: "09:00",
        endTime: "10:00",
        date: new Date().toISOString().split('T')[0]
      };

      console.log("Testing POST /availability/" + user._id);
      const postResponse = await http.post(`/availability/${user._id}`, {
        role: "staff",
        slots: [testSlot]
      });
      console.log("POST Response:", postResponse.data);

      toast.success("API test completed - check console");
    } catch (error: any) {
      console.error("API test failed:", error);
      if (error.response) {
        console.error("Error response:", error.response.data);
      }
      toast.error("API test failed - check console");
    }
  };

  // Render the current tab
  const renderCurrentTab = () => {
    switch (tab) {
      case 'allpets':
        return (
          <AllPetsSection
            allPetsQ={allPetsQ}
            trainersQ={trainersQ}
            vetsQ={vetsQ}
            tempAssignments={tempAssignments}
            setTab={setTab}
            mPetStatus={mPetStatus}
            mAssignTrainer={mAssignTrainer}
            mAssignVet={mAssignVet}
            mDelPet={mDelPet}
            handleTempAssignmentChange={handleTempAssignmentChange}
            handleSaveAssignment={handleSaveAssignment}
          />
        );
      case 'addpet':
        return (
          <AddPetSection
            petForm={petForm}
            setPetForm={setPetForm}
            petFiles={petFiles}
            setPetFiles={setPetFiles}
            submitting={submitting}
            setTab={setTab}
            mAddPet={mAddPet}
            validateForm={validateForm}
          />
        );
      case 'trainer':
        return (
          <TrainerSection
            allPetsQ={allPetsQ}
            trainersQ={trainersQ}
            assign={assign}
            setAssign={setAssign}
            mAssignTrainer={mAssignTrainer}
            mRemoveTrainer={mRemoveTrainer}
          />
        );
      case 'protrain':
        return (
          <ProTrainSection
            allPetsQ={allPetsQ}
            proTQ={proTQ}
            orgTrainQ={orgTrainQ}
            proTrain={proTrain}
            setProTrain={setProTrain}
            trainingStartDate={trainingStartDate}
            setTrainingStartDate={setTrainingStartDate}
            mAssignProTrain={mAssignProTrain}
            mRemoveTrainer={mRemoveTrainer}
          />
        );
      case 'adoptions':
        return (
          <AdoptionsSection
            reqQ={reqQ}
            setMeetingModal={setMeetingModal}
            setMeetingDateTime={setMeetingDateTime}
            mUpdateReq={mUpdateReq}
            testAvailabilityAPI={testAvailabilityAPI}
          />
        );
      case 'availability':
        return (
          <AvailabilitySection
            user={user}
            availQ={availQ}
            availabilitySlot={availabilitySlot}
            setAvailabilitySlot={setAvailabilitySlot}
            mAvailability={mAvailability}
            mDeleteAvailability={mDeleteAvailability}
          />
        );
      default:
        return (
          <AllPetsSection
            allPetsQ={allPetsQ}
            trainersQ={trainersQ}
            vetsQ={vetsQ}
            tempAssignments={tempAssignments}
            setTab={setTab}
            mPetStatus={mPetStatus}
            mDelPet={mDelPet}
            handleTempAssignmentChange={handleTempAssignmentChange}
            handleSaveAssignment={handleSaveAssignment}
          />
        );
    }
  };

  // Main render with enhanced design
  if (!user || user.role !== "staff") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md mx-4">
          <div className="text-6xl mb-4">🚫</div>
          <div className="text-2xl font-bold text-gray-900 mb-2">Access Denied</div>
          <div className="text-gray-600">You don't have permission to access this page.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
      <NavBar />
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Enhanced Header */}
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Staff Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Manage pets, trainers, and adoption requests efficiently</p>
          </div>
          <div className="bg-white rounded-xl px-6 py-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                <div className="text-xs text-gray-500 capitalize">{user.role} • PetConnect</div>
              </div>
            </div>
          </div>
        </header>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Pets" value={statsData.totalPets} icon="🐕" color="blue" />
          <StatCard title="Pending Requests" value={statsData.pendingRequests} icon="📋" color="amber" />
          <StatCard title="Active Training" value={statsData.activeTrainings} icon="🎓" color="indigo" />
          <StatCard title="Available Slots" value={statsData.availableSlots} icon="🕒" color="green" />
        </div>

        {/* Enhanced Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 p-2 mb-8 shadow-sm">
          <div className="flex overflow-x-auto scrollbar-hide">
            {[
              { key: "allpets", label: "Pet Management", icon: "🐕", desc: "Manage all pets" },
              { key: "addpet", label: "Add New Pet", icon: "➕", desc: "Create new listing" },
              { key: "trainer", label: "Trainer Management", icon: "🎓", desc: "Assign trainers" },
              { key: "protrain", label: "Professional Training", icon: "⭐", desc: "Advanced programs" },
              { key: "adoptions", label: "Adoption Requests", icon: "🏠", desc: "Manage requests" },
              { key: "availability", label: "Availability", icon: "📅", desc: "Time slots" }
            ].map(tabItem => (
              <button
                key={tabItem.key}
                onClick={() => setTab(tabItem.key as typeof tab)}
                className={`flex flex-col items-center text-center py-3 px-4 rounded-lg font-medium transition-all duration-200 whitespace-nowrap min-w-[120px] ${tab === tabItem.key
                  ? "bg-blue-50 text-blue-700 border-2 border-blue-200 shadow-xs"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-2 border-transparent"
                  }`}
              >
                <span className="text-xl mb-1">{tabItem.icon}</span>
                <span className="text-sm font-semibold">{tabItem.label}</span>
                <span className="text-xs text-gray-500 mt-1 hidden sm:block">{tabItem.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        {renderCurrentTab()}

        {/* Enhanced Meeting Modal */}
        {meetingModal?.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Schedule Meeting</h2>
                <button
                  onClick={() => setMeetingModal(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-600 mb-6">Schedule a meeting for {meetingModal.req?.pet?.name}'s adoption process</p>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (!meetingDateTime) {
                    toast.error("Select meeting date and time");
                    return;
                  }
                  const iso = new Date(meetingDateTime).toISOString();
                  mUpdateReq.mutate({ id: meetingModal.req!._id, status: "meeting", meetingDate: iso });
                }}
              >
                <div className="space-y-4">
                  <DateTimePicker
                    label="Meeting Date & Time"
                    value={meetingDateTime}
                    onChange={setMeetingDateTime}
                    min={new Date().toISOString().slice(0, 16)}
                    required
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setMeetingModal(null)}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium shadow-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-xs"
                  >
                    Schedule Meeting
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}