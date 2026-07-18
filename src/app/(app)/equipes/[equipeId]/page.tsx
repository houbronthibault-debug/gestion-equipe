import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/PageHeader";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { peutConsulterEspaceEquipe } from "@/lib/permissions";

const LIBELLES_TYPE: Record<string, string> = {
  ENTRAINEMENT: "Entraînement",
  STAGE: "Stage",
  MATCH_AMICAL: "Match amical",
  CHAMPIONNAT: "Championnat",
  TOURNOI: "Tournoi",
};

export default async function EquipeVueEnsemblePage({
  params,
}: {
  params: Promise<{ equipeId: string }>;
}) {
  const { equipeId } = await params;
  const session = await auth();

  if (!(await peutConsulterEspaceEquipe(session!.user, equipeId))) {
    redirect("/mes-equipes");
  }

  const [evenements, appartenances] = await Promise.all([
    prisma.evenement.findMany({
      where: { equipeId },
      orderBy: { dateDebut: "asc" },
    }),
    prisma.appartenance.findMany({
      where: { equipeId },
      include: { utilisateur: true },
      orderBy: [{ role: "asc" }, { utilisateur: { nomPrenom: "asc" } }],
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Vue d'ensemble"
        description="Calendrier de l'équipe et liste des membres."
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 bg-card-background-tableau-bord p-4 dark:border-zinc-700">
          <h2 className="font-medium">Calendrier de l&apos;équipe</h2>
          {evenements.length === 0 ? (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Aucun événement pour l&apos;instant.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {evenements.map((evenement) => (
                <li key={evenement.id}>
                  <Link
                    href={`/equipes/${equipeId}/evenements/${evenement.id}`}
                    className="block rounded border border-zinc-200 bg-sous-element-tableau-bord p-2 text-sm hover:border-accent-tableau-bord dark:border-zinc-700"
                  >
                    <p className="font-medium">
                      {LIBELLES_TYPE[evenement.type] ?? evenement.type} —{" "}
                      {evenement.lieu}
                    </p>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      {evenement.dateDebut.toLocaleString("fr-FR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-lg border border-zinc-200 bg-card-background-tableau-bord p-4 dark:border-zinc-700">
          <h2 className="font-medium">Membres</h2>
          {appartenances.length === 0 ? (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Aucun membre pour l&apos;instant.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-1 text-sm">
              {appartenances.map((appartenance) => (
                <li
                  key={appartenance.id}
                  className="rounded bg-sous-element-tableau-bord px-2 py-1.5"
                >
                  {appartenance.utilisateur.nomPrenom}{" "}
                  <span className="text-zinc-500">
                    ({appartenance.role === "COACH" ? "Coach" : "Joueur"})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
