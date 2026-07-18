import Link from "next/link";
import { revalidatePath } from "next/cache";

import { PageHeader } from "@/components/PageHeader";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { peutCreerEvenement } from "@/lib/permissions";
import type { JourSemaine } from "@prisma/client";

const JOURS_SEMAINE = [
  { value: "LUNDI", label: "Lundi" },
  { value: "MARDI", label: "Mardi" },
  { value: "MERCREDI", label: "Mercredi" },
  { value: "JEUDI", label: "Jeudi" },
  { value: "VENDREDI", label: "Vendredi" },
  { value: "SAMEDI", label: "Samedi" },
  { value: "DIMANCHE", label: "Dimanche" },
] as const satisfies readonly { value: JourSemaine; label: string }[];

function estJourSemaineValide(value: unknown): value is JourSemaine {
  return (
    typeof value === "string" &&
    JOURS_SEMAINE.some((jour) => jour.value === value)
  );
}

async function definirJourEnvoiMail(equipeId: string, formData: FormData) {
  "use server";

  const session = await auth();
  if (!session?.user || !(await peutCreerEvenement(session.user, equipeId))) {
    throw new Error("Non autorisé.");
  }

  const jour = formData.get("jour");

  await prisma.equipe.update({
    where: { id: equipeId },
    data: {
      jourEnvoiMailEvenements: estJourSemaineValide(jour) ? jour : null,
    },
  });

  revalidatePath(`/equipes/${equipeId}/gestion`);
}

export default async function GestionEquipePage({
  params,
}: {
  params: Promise<{ equipeId: string }>;
}) {
  const { equipeId } = await params;
  const equipe = await prisma.equipe.findUnique({ where: { id: equipeId } });
  const definir = definirJourEnvoiMail.bind(null, equipeId);

  return (
    <>
      <PageHeader
        title="Gestion de l'équipe"
        description="Réservé aux coachs de l'équipe et aux administrateurs."
      />
      <div className="flex flex-col gap-4">
        <section className="rounded-lg border border-zinc-200 bg-card-background-tableau-bord p-4 dark:border-zinc-700">
          <h2 className="font-medium">Membres</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Ajout et retrait de joueurs de l&apos;équipe.
          </p>
          <Link
            href={`/equipes/${equipeId}/gestion/membres`}
            className="mt-3 inline-block text-sm font-medium underline"
          >
            Gérer les membres
          </Link>
        </section>
        <section className="rounded-lg border border-zinc-200 bg-card-background-tableau-bord p-4 dark:border-zinc-700">
          <h2 className="font-medium">Événements</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Créer un événement ou désigner capitaine/intendant sur un
            événement existant.
          </p>
          <Link
            href={`/equipes/${equipeId}/gestion/evenements/nouveau`}
            className="mt-3 inline-block text-sm font-medium underline"
          >
            Créer un événement
          </Link>
        </section>
        <section className="rounded-lg border border-zinc-200 bg-card-background-tableau-bord p-4 dark:border-zinc-700">
          <h2 className="font-medium">Documents</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Déposer un document d&apos;équipe ou visible club.
          </p>
          <Link
            href={`/equipes/${equipeId}/gestion/documents`}
            className="mt-3 inline-block text-sm font-medium underline"
          >
            Déposer un document
          </Link>
        </section>
        <section className="rounded-lg border border-zinc-200 bg-card-background-formulaires p-4 dark:border-zinc-700">
          <h2 className="font-medium">Notifications</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Un email récapitulatif des événements créés dans les 7 derniers
            jours est envoyé à tous les membres de l&apos;équipe le jour
            choisi ci-dessous. Aucun email n&apos;est envoyé immédiatement à
            la création d&apos;un événement.
          </p>
          <form
            action={definir}
            className="mt-3 flex flex-wrap items-end gap-3"
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="jour" className="text-sm font-medium">
                Jour d&apos;envoi
              </label>
              <select
                id="jour"
                name="jour"
                defaultValue={equipe?.jourEnvoiMailEvenements ?? ""}
                className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="">Désactivé</option>
                {JOURS_SEMAINE.map((jour) => (
                  <option key={jour.value} value={jour.value}>
                    {jour.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="rounded bg-accent-formulaires px-4 py-2 text-sm font-medium text-white hover:bg-accent-formulaires-dark"
            >
              Enregistrer
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
