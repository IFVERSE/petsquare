"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Dog, Cat, Bird, Fish, Rabbit } from "lucide-react";
import { addPet, deletePet } from "@/app/dashboard/pets/actions";

type Pet = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  gender: string | null;
  size: string | null;
  weight_kg: number | null;
  activity_level: string | null;
  allergies: string | null;
  photo_url: string | null;
};

const speciesIcon: Record<string, typeof Dog> = {
  dog: Dog, cat: Cat, bird: Bird, fish: Fish, exotic: Rabbit,
};

export default function PetManager({ initialPets }: { initialPets: Pet[] }) {
  const [pets, setPets] = useState(initialPets);
  const [showForm, setShowForm] = useState(initialPets.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAdd(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await addPet(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setPets((p) => [
          {
            id: crypto.randomUUID(),
            name: String(formData.get("name")),
            species: String(formData.get("species")),
            breed: String(formData.get("breed") || "") || null,
            gender: String(formData.get("gender") || "") || null,
            size: String(formData.get("size") || "") || null,
            weight_kg: formData.get("weight_kg") ? Number(formData.get("weight_kg")) : null,
            activity_level: String(formData.get("activity_level") || "") || null,
            allergies: String(formData.get("allergies") || "") || null,
            photo_url: null,
          },
          ...p,
        ]);
        setShowForm(false);
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deletePet(id);
      setPets((p) => p.filter((pet) => pet.id !== id));
    });
  }

  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pets.map((pet) => {
          const Icon = speciesIcon[pet.species] ?? Dog;
          return (
            <div key={pet.id} className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-card)]">
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sage-light text-sage">
                  <Icon className="h-5 w-5" />
                </span>
                <button
                  onClick={() => handleDelete(pet.id)}
                  disabled={pending}
                  className="text-navy/30 hover:text-coral disabled:opacity-50"
                  aria-label={`Remove ${pet.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <h3 className="mt-3 font-display text-lg text-navy">{pet.name}</h3>
              <p className="text-sm capitalize text-navy/50">
                {pet.breed ? `${pet.breed} · ` : ""}
                {pet.species}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-navy/60">
                {pet.size && <span className="rounded-full bg-paper px-2 py-0.5">{pet.size}</span>}
                {pet.gender && <span className="rounded-full bg-paper px-2 py-0.5">{pet.gender}</span>}
                {pet.weight_kg && <span className="rounded-full bg-paper px-2 py-0.5">{pet.weight_kg} kg</span>}
                {pet.activity_level && <span className="rounded-full bg-paper px-2 py-0.5">{pet.activity_level} activity</span>}
              </div>
              {pet.allergies && <p className="mt-2 text-xs text-coral">⚠️ Allergies: {pet.allergies}</p>}
            </div>
          );
        })}

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex min-h-[10rem] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-paper-dim text-navy/40 hover:border-tangerine hover:text-tangerine"
          >
            <Plus className="h-6 w-6" /> Add a Pet
          </button>
        )}
      </div>

      {showForm && (
        <form action={handleAdd} className="mt-6 grid grid-cols-1 gap-3 rounded-2xl bg-surface p-5 shadow-[var(--shadow-card)] sm:grid-cols-2">
          <input name="name" required placeholder="Pet name" className="rounded-xl border border-paper-dim px-3 py-2.5 text-sm" />
          <select name="species" required className="rounded-xl border border-paper-dim px-3 py-2.5 text-sm">
            <option value="">Species...</option>
            <option value="dog">Dog</option>
            <option value="cat">Cat</option>
            <option value="bird">Bird</option>
            <option value="fish">Fish</option>
            <option value="exotic">Small & Exotic</option>
          </select>
          <input name="breed" placeholder="Breed (optional)" className="rounded-xl border border-paper-dim px-3 py-2.5 text-sm" />
          <select name="gender" className="rounded-xl border border-paper-dim px-3 py-2.5 text-sm">
            <option value="">Gender (optional)</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <select name="size" className="rounded-xl border border-paper-dim px-3 py-2.5 text-sm">
            <option value="">Size (optional)</option>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
          <input name="weight_kg" type="number" step="0.1" placeholder="Weight (kg, optional)" className="rounded-xl border border-paper-dim px-3 py-2.5 text-sm" />
          <select name="activity_level" className="rounded-xl border border-paper-dim px-3 py-2.5 text-sm">
            <option value="">Activity level (optional)</option>
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
          </select>
          <input name="allergies" placeholder="Allergies/sensitivities (optional)" className="rounded-xl border border-paper-dim px-3 py-2.5 text-sm" />

          {error && <p className="text-sm text-coral sm:col-span-2">{error}</p>}

          <div className="flex gap-2 sm:col-span-2">
            <button disabled={pending} className="rounded-xl bg-tangerine px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              Save Pet
            </button>
            {pets.length > 0 && (
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-paper-dim px-5 py-2.5 text-sm font-medium text-navy/60">
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
