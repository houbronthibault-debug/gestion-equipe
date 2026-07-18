import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";

import { PageHeader } from "@/components/PageHeader";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { peutGererMembresEquipe } from "@/lib/permissions";

async function ajouterMembre(equipeId: string, formData: FormData) {
  "use server";

  const session = await auth();
  if (!session?.user || !(await peutGererMembresEquipe(session.user, equipeId))) {
    throw new Error("Non autorisé.");
  }

  const utilisateurId = String(formData.get("utilisateurId"));
  const roleValue = formData.get("role");

  if (roleValue !== "COACH" && roleValue !== "JOUEUR") {
    throw new Error("Rôle invalide.");
  }
  const role = roleValue as "COACH" | "JOUEUR";

  await prisma.appartenance.upsert({
    where: {
      utilisateurId_equipeId_role: { utilisateurId, equipeId, role },
    },
    update: {},
    create: { utilisateurId, equipeId, role },
  });

  const evenementsAVenir = await prisma.evenement.findMany({
    where: { equipeId, dateDebut: { gte: new Date() } },
    select: { id: true },
  });

  await Promise.all(
    evenementsAVenir.map((evenement) =>
      prisma.participation.upsert({
        where: {
          utilisateurId_evenementId: {
            utilisateurId,
            evenementId: evenement.id,
          },
        },
        update: {},
        create: { utilisateurId, evenementId: evenement.id },
      }),
    ),
  );

  revalidatePath(`/equipes/${equipeId}/gestion/membres`);
  revalidatePath(`/equipes/${equipeId}`);
}

async function retirerMembre(equipeId: string, formData: FormData) {
  "use server";

  const session = await auth();
  if (!session?.user || !(await peutGererMembresEquipe(session.user, equipeId))) {
    throw new Error("Non autorisé.");
  }

  const appartenanceId = String(formData.get("appartenanceId"));

  await prisma.appartenance.delete({ where: { id: appartenanceId } });

  revalidatePath(`/equipes/${equipeId}/gestion/membres`);
}

export default async function GestionMembresPage({
  params,
}: {
  params: Promise<{ equipeId: string }>;
}) {
  const { equipeId } = await params;

  const [equipe, appartenances, utilisateursValides] = await Promise.all([
    prisma.equipe.findUnique({ where: { id: equipeId } }),
    prisma.appartenance.findMany({
      where: { equipeId },
      include: { utilisateur: true },
      orderBy: [{ role: "asc" }, { utilisateur: { nomPrenom: "asc" } }],
    }),
    prisma.utilisateur.findMany({
      where: { statutInscription: "VALIDE" },
      orderBy: { nomPrenom: "asc" },
    }),
  ]);

  if (!equipe) {
    notFound();
  }

  const ajouter = ajouterMembre.bind(null, equipeId);
  const retirer = retirerMembre.bind(null, equipeId);

  return (
    <>
      <PageHeader
        title={`Membres — ${equipe.nom}`}
        description="Ajouter ou retirer un coach ou un joueur de l'équipe."
      />

      <section className="mb-8 rounded-lg border border-zinc-200 bg-card-background-formulaires p-4 dark:border-zinc-700">
        <h2 className="font-medium">Ajouter un membre</h2>
        {utilisateursValides.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Aucun compte validé disponible pour l&apos;instant.
          </p>
        ) : (
          <form action={ajouter} className="mt-3 flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="utilisateurId" className="text-sm font-medium">
                Utilisateur
              </label>
              <select
                id="utilisateurId"
                name="utilisateurId"
                required
                className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              >
                {utilisateursValides.map((utilisateur) => (
                  <option key={utilisateur.id} value={utilisateur.id}>
                    {utilisateur.nomPrenom} ({utilisateur.pseudo})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="role" className="text-sm font-medium">
                Rôle
              </label>
              <select
                id="role"
                name="role"
                required
                className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="JOUEUR">Joueur</option>
                <option value="COACH">Coach</option>
              </select>
            </div>
            <button
              type="submit"
              className="rounded bg-accent-formulaires px-4 py-2 text-sm font-medium text-white hover:bg-accent-formulaires-dark"
            >
              Ajouter
            </button>
          </form>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-medium">Membres actuels</h2>
        {appartenances.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Aucun membre pour l&apos;instant.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {appartenances.map((appartenance) => (
              <li
                key={appartenance.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-card-background-tableau-bord p-4 dark:border-zinc-700"
              >
                <div>
                  <p className="font-medium">
                    {appartenance.utilisateur.nomPrenom}{" "}
                    <span className="text-sm font-normal text-zinc-500">
                      ({appartenance.utilisateur.pseudo})
                    </span>
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {appartenance.role === "COACH" ? "Coach" : "Joueur"}
                  </p>
                </div>
                <form action={retirer}>
                  <input
                    type="hidden"
                    name="appartenanceId"
                    value={appartenance.id}
                  />
                  <button
                    type="submit"
                    className="rounded border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                  >
                    Retirer
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
