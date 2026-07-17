import Link from "next/link";

import { PageHeader } from "@/components/PageHeader";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const LIBELLES_TYPE: Record<string, string> = {
  ENTRAINEMENT: "Entraînement",
  STAGE: "Stage",
  MATCH_AMICAL: "Match amical",
  CHAMPIONNAT: "Championnat",
  TOURNOI: "Tournoi",
};

export default async function TableauDeBordPage() {
  const session = await auth();
  const user = session!.user;

  const evenements = await prisma.evenement.findMany({
    where: {
      dateDebut: { gte: new Date() },
      participations: { some: { utilisateurId: user.id } },
    },
    include: { equipe: true },
    orderBy: { dateDebut: "asc" },
    take: 10,
  });

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description="Calendrier unifié toutes équipes confondues, actions en attente et notifications."
      />
      <div className="grid gap-6 sm:grid-cols-3">
        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="font-medium">Calendrier</h2>
          {evenements.length === 0 ? (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Aucun événement à venir.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {evenements.map((evenement) => (
                <li key={evenement.id}>
                  <Link
                    href={`/equipes/${evenement.equipeId}/evenements/${evenement.id}`}
                    className="block rounded border border-zinc-200 p-2 text-sm hover:border-brand-violet dark:border-zinc-800"
                  >
                    <p className="font-medium">
                      {LIBELLES_TYPE[evenement.type] ?? evenement.type} —{" "}
                      {evenement.equipe.nom}
                    </p>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      {evenement.dateDebut.toLocaleString("fr-FR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}{" "}
                      — {evenement.lieu}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="font-medium">Actions en attente</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Confirmations de présence et infos d&apos;intendance à compléter.
          </p>
        </section>
        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="font-medium">Notifications</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Nouveaux événements, ajouts et relances.
          </p>
        </section>
      </div>
    </>
  );
}
