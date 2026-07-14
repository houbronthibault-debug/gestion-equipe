import Link from "next/link";

import { PageHeader } from "@/components/PageHeader";

export default async function GestionEquipePage({
  params,
}: {
  params: Promise<{ equipeId: string }>;
}) {
  const { equipeId } = await params;

  return (
    <>
      <PageHeader
        title="Gestion de l'équipe"
        description="Réservé aux coachs de l'équipe et aux administrateurs."
      />
      <div className="flex flex-col gap-4">
        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
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
        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
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
        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
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
      </div>
    </>
  );
}
