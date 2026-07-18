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

  const [evenements, participationsAVenir] = await Promise.all([
    prisma.evenement.findMany({
      where: {
        dateDebut: { gte: new Date() },
        participations: { some: { utilisateurId: user.id } },
      },
      include: { equipe: true },
      orderBy: { dateDebut: "asc" },
      take: 10,
    }),
    prisma.participation.findMany({
      where: {
        utilisateurId: user.id,
        evenement: { dateDebut: { gte: new Date() } },
      },
      include: {
        evenement: {
          include: {
            equipe: true,
            questionsIntendance: {
              include: { reponses: { where: { utilisateurId: user.id } } },
            },
          },
        },
      },
      orderBy: { evenement: { dateDebut: "asc" } },
    }),
  ]);

  const actionsEnAttente = participationsAVenir
    .map((participation) => {
      const actions: string[] = [];
      if (participation.statutPresence === "EN_ATTENTE") {
        actions.push("confirmer ta présence");
      }
      const { questionsIntendance } = participation.evenement;
      if (participation.evenement.type !== "ENTRAINEMENT" && questionsIntendance.length > 0) {
        const repondues = questionsIntendance.filter(
          (q) => q.reponses.length > 0,
        ).length;
        if (repondues < questionsIntendance.length) {
          actions.push("compléter tes infos d'intendance");
        }
      }
      return { participation, actions };
    })
    .filter((item) => item.actions.length > 0);

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description="Calendrier unifié toutes équipes confondues et actions en attente."
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 bg-card-background-tableau-bord p-4 dark:border-zinc-700">
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
                    className="block rounded border border-zinc-200 p-2 text-sm hover:border-accent-tableau-bord dark:border-zinc-700"
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
        <section className="rounded-lg border border-zinc-200 bg-card-background-tableau-bord p-4 dark:border-zinc-700">
          <h2 className="font-medium">Actions en attente</h2>
          {actionsEnAttente.length === 0 ? (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Rien en attente pour l&apos;instant.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {actionsEnAttente.map(({ participation, actions }) => (
                <li key={participation.id}>
                  <Link
                    href={`/equipes/${participation.evenement.equipeId}/evenements/${participation.evenement.id}`}
                    className="block rounded border border-zinc-200 p-2 text-sm hover:border-accent-tableau-bord dark:border-zinc-700"
                  >
                    <p className="font-medium">
                      {LIBELLES_TYPE[participation.evenement.type] ??
                        participation.evenement.type}{" "}
                      — {participation.evenement.equipe.nom}
                    </p>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      À faire : {actions.join(", ")}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
