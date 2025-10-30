// src/features/pets/api.ts
import { http } from "../../lib/http";
import type { Pet } from "./types";

export async function listPets(): Promise<Pet[]> {
  const res = await http.get("/pets");
  return res.data;
}

export async function getPetById(id: string): Promise<Pet> {
  const res = await http.get(`/pets/${id}`);
  return res.data;
}

// Submit a foster request for a personal listing.
// We try pet-files route first; if the backend has a legacy /pets route, we fall back gracefully.
export async function submitFosterRequest(petId: string, message?: string) {
  try {
    const r = await http.post(`/pet-files/${petId}/foster-requests`, { message });
    return r.data;
  } catch (e) {
    // fallback for legacy route (won't throw if not present)
    const r2 = await http.post(`/pets/${petId}/foster-requests`, { message });
    return r2.data;
  }
}

// Get the current user's foster requests
export async function getMyFosterRequests() {
  const r = await http.get(`/pet-files/my-foster-requests`);
  // Normalize to array
  const list =
    Array.isArray(r.data) ? r.data :
    Array.isArray(r.data?.requests) ? r.data.requests : [];
  return list;
}

// Start chat on a foster request (uses your existing route)
export async function startFosterChat(petId: string, requestId: string) {
  const r = await http.post(`/pet-files/${petId}/foster-requests/${requestId}/start-chat`);
  return r.data;
}
