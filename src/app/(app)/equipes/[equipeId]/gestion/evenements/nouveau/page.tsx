import { redirect } from "next/navigation";

import { PageHeader } from "@/components/PageHeader";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { peutCreerEvenement } from "@/lib/permissions";

const TYPES_EVENEMENT = [
  { value: "ENTRAINEMENT", label: "Entraînement" },
  { value: "STAGE", label: "Stage" },
  { value: "MATCH_AMICAL", label: "Match amical" },
  { value: "CHAMPIONNAT", label: "Championnat" },
  { value: "TOURNOI", label: "Tournoi" },
] as const;

type TypeEvenement = (typeof TYPES_EVENEMENT)[number]["value"];

function estTypeEvenementValide(value: unknown): value is TypeEvenement {
  return (
    typeof value === "string" &&
    TYPES_EVENEMENT.some((type) => type.value === value)
  );
}

async function creerEvenement(equipeId: string, formData: FormData) {
  "use server";

  const session = await auth();
  if (!session?.user || !(await peutCreerEvenement(session.user, equipeId))) {
    throw new Error("Non autorisé.");
  }

  const typeValue = formData.get("type");
  const lieu = String(formData.get("lieu") ?? "").trim();
  const dateDebutValue = String(formData.get("dateDebut") ?? "");
  const duree = String(formData.get("duree") ?? "").trim();
  const programme = String(formData.get("programme") ?? "").trim();
  const objectif = String(formData.get("objectif") ?? "").trim();

  if (!estTypeEvenementValide(typeValue) || !lieu || !dateDebutValue) {
    redirect(
      `/equipes/${equipeId}/gestion/evenements/nouveau?error=champs_requis`,
    );
  }

  const evenement = await prisma.evenement.create({
    data: {
      equipeId,
      type: typeValue,
      lieu,
      dateDebut: new Date(dateDebutValue),
      duree: duree || null,
      programme: programme || null,
      objectif: objectif || null,
    },
  });

  const appartenances = await prisma.appartenance.findMany({
    where: { equipeId },
    distinct: ["utilisateurId"],
  });

  if (appartenances.length > 0) {
    await prisma.participation.createMany({
      data: appartenances.map((appartenance) => ({
        utilisateurId: appartenance.utilisateurId,
        evenementId: evenement.id,
      })),
      skipDuplicates: true,
    });
  }

  redirect(`/equipes/${equipeId}/evenements/${evenement.id}`);
}

export default async function CreationEvenementPage({
  params,
  searchParams,
}: {
  params: Promise<{ equipeId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { equipeId } = await params;
  const { error } = await searchParams;
  const creer = creerEvenement.bind(null, equipeId);

  return (
    <>
      <PageHeader
        title="Créer un événement"
        description="Type, lieu, durée, programme et objectif. Les membres de l'équipe seront invités par défaut (le récapitulatif par email suit le jour d'envoi configuré dans Gestion de l'équipe)."
      />
      <form action={creer} className="flex max-w-lg flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="type" className="text-sm font-medium">
            Type
          </label>
          <select
            id="type"
            name="type"
            required
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          >
            {TYPES_EVENEMENT.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="dateDebut" className="text-sm font-medium">
            Date et heure
          </label>
          <input
            id="dateDebut"
            name="dateDebut"
            type="datetime-local"
            required
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="lieu" className="text-sm font-medium">
            Lieu
          </label>
          <input
            id="lieu"
            name="lieu"
            type="text"
            required
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="duree" className="text-sm font-medium">
            Durée (optionnel)
          </label>
          <input
            id="duree"
            name="duree"
            type="text"
            placeholder="ex. 2h, week-end"
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="programme" className="text-sm font-medium">
            Programme (optionnel)
          </label>
          <textarea
            id="programme"
            name="programme"
            rows={3}
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="objectif" className="text-sm font-medium">
            Objectif (optionnel)
          </label>
          <textarea
            id="objectif"
            name="objectif"
            rows={3}
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        {error === "champs_requis" && (
          <p className="text-sm text-red-600">
            Merci de remplir le type, la date et le lieu.
          </p>
        )}
        <button
          type="submit"
          className="mt-2 self-start rounded bg-accent-formulaires px-4 py-2 text-sm font-medium text-white hover:bg-accent-formulaires-dark"
        >
          Créer l&apos;événement
        </button>
      </form>
    </>
  );
}
