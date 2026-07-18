import Link from "next/link";

import { PageHeader } from "@/components/PageHeader";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function MesEquipesPage() {
  const session = await auth();
  const user = session!.user;

  const equipes = user.estAdmin
    ? await prisma.equipe.findMany({ orderBy: { nom: "asc" } }).then((liste) =>
        liste.map((equipe) => ({ equipe, roles: ["Admin"] })),
      )
    : await prisma.appartenance
        .findMany({
          where: { utilisateurId: user.id },
          include: { equipe: true },
          orderBy: { equipe: { nom: "asc" } },
        })
        .then((appartenances) => {
          const parEquipe = new Map<
            string,
            { equipe: (typeof appartenances)[number]["equipe"]; roles: string[] }
          >();
          for (const appartenance of appartenances) {
            const entree = parEquipe.get(appartenance.equipeId) ?? {
              equipe: appartenance.equipe,
              roles: [],
            };
            entree.roles.push(
              appartenance.role === "COACH" ? "Coach" : "Joueur",
            );
            parEquipe.set(appartenance.equipeId, entree);
          }
          return [...parEquipe.values()];
        });

  return (
    <>
      <PageHeader
        title="Mes équipes"
        description={
          user.estAdmin
            ? "Toutes les équipes du club (accès admin)."
            : "Les équipes auxquelles tu appartiens."
        }
      />
      {equipes.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Tu n&apos;appartiens à aucune équipe pour l&apos;instant.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {equipes.map(({ equipe, roles }) => (
            <li key={equipe.id}>
              <Link
                href={`/equipes/${equipe.id}`}
                className="block rounded-lg border border-zinc-200 bg-card-background p-4 hover:border-accent-tableau-bord dark:border-zinc-700"
              >
                <p className="font-medium">{equipe.nom}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {roles.join(", ")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
