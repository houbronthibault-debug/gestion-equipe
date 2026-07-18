import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";

import { PageHeader } from "@/components/PageHeader";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { peutDesignerRoles } from "@/lib/permissions";

async function designerRole(
  equipeId: string,
  evenementId: string,
  formData: FormData,
) {
  "use server";

  const session = await auth();
  if (!session?.user || !(await peutDesignerRoles(session.user, equipeId))) {
    throw new Error("Non autorisé.");
  }

  const utilisateurId = String(formData.get("utilisateurId"));
  const roleValue = formData.get("role");

  if (roleValue !== "CAPITAINE" && roleValue !== "INTENDANT") {
    throw new Error("Rôle invalide.");
  }
  const role = roleValue as "CAPITAINE" | "INTENDANT";

  const estMembreEquipe = await prisma.appartenance.findFirst({
    where: { utilisateurId, equipeId },
  });
  if (!estMembreEquipe) {
    throw new Error(
      "La personne désignée doit être membre de l'équipe organisatrice.",
    );
  }

  await prisma.assignationEvenement.upsert({
    where: {
      utilisateurId_evenementId_role: { utilisateurId, evenementId, role },
    },
    update: {},
    create: { utilisateurId, evenementId, role },
  });

  revalidatePath(
    `/equipes/${equipeId}/gestion/evenements/${evenementId}/roles`,
  );
}

async function retirerRole(
  equipeId: string,
  evenementId: string,
  formData: FormData,
) {
  "use server";

  const session = await auth();
  if (!session?.user || !(await peutDesignerRoles(session.user, equipeId))) {
    throw new Error("Non autorisé.");
  }

  const assignationId = String(formData.get("assignationId"));

  await prisma.assignationEvenement.delete({ where: { id: assignationId } });

  revalidatePath(
    `/equipes/${equipeId}/gestion/evenements/${evenementId}/roles`,
  );
}

export default async function DesignationRolesPage({
  params,
}: {
  params: Promise<{ equipeId: string; evenementId: string }>;
}) {
  const { equipeId, evenementId } = await params;

  const [evenement, membres, assignations] = await Promise.all([
    prisma.evenement.findUnique({ where: { id: evenementId } }),
    prisma.appartenance.findMany({
      where: { equipeId },
      include: { utilisateur: true },
      distinct: ["utilisateurId"],
      orderBy: { utilisateur: { nomPrenom: "asc" } },
    }),
    prisma.assignationEvenement.findMany({
      where: { evenementId },
      include: { utilisateur: true },
      orderBy: [{ role: "asc" }, { utilisateur: { nomPrenom: "asc" } }],
    }),
  ]);

  if (!evenement || evenement.equipeId !== equipeId) {
    notFound();
  }

  const designer = designerRole.bind(null, equipeId, evenementId);
  const retirer = retirerRole.bind(null, equipeId, evenementId);

  return (
    <>
      <PageHeader
        title="Désignation capitaine / intendant"
        description={`Événement : ${evenement.lieu}. Les personnes désignées doivent être membres de l'équipe organisatrice.`}
      />

      <section className="mb-8 rounded-lg border border-zinc-200 bg-card-background p-4 dark:border-zinc-700">
        <h2 className="font-medium">Désigner</h2>
        {membres.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Aucun membre dans cette équipe pour l&apos;instant.
          </p>
        ) : (
          <form
            action={designer}
            className="mt-3 flex flex-wrap items-end gap-3"
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="utilisateurId" className="text-sm font-medium">
                Membre
              </label>
              <select
                id="utilisateurId"
                name="utilisateurId"
                required
                className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              >
                {membres.map((membre) => (
                  <option
                    key={membre.utilisateurId}
                    value={membre.utilisateurId}
                  >
                    {membre.utilisateur.nomPrenom} ({membre.utilisateur.pseudo})
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
                <option value="CAPITAINE">Capitaine</option>
                <option value="INTENDANT">Intendant</option>
              </select>
            </div>
            <button
              type="submit"
              className="rounded bg-accent-formulaires px-4 py-2 text-sm font-medium text-white hover:bg-accent-formulaires-dark"
            >
              Désigner
            </button>
          </form>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-medium">Désignations actuelles</h2>
        {assignations.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Aucune désignation pour l&apos;instant.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {assignations.map((assignation) => (
              <li
                key={assignation.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-card-background p-4 dark:border-zinc-700"
              >
                <div>
                  <p className="font-medium">
                    {assignation.utilisateur.nomPrenom}{" "}
                    <span className="text-sm font-normal text-zinc-500">
                      ({assignation.utilisateur.pseudo})
                    </span>
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {assignation.role === "CAPITAINE" ? "Capitaine" : "Intendant"}
                  </p>
                </div>
                <form action={retirer}>
                  <input
                    type="hidden"
                    name="assignationId"
                    value={assignation.id}
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
