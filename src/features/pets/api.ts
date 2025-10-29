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
