import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { PageHeader } from "@/components/PageHeader";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const STATUTS = [
  { value: "EN_ATTENTE", label: "En attente" },
  { value: "VALIDE", label: "Validé" },
  { value: "REFUSE", label: "Refusé" },
] as const;

async function modifierStatut(formData: FormData) {
  "use server";

  const session = await auth();
  if (!session?.user.estAdmin) {
    throw new Error("Non autorisé.");
  }

  const utilisateurId = String(formData.get("utilisateurId"));
  const statut = formData.get("statutInscription");

  if (statut !== "EN_ATTENTE" && statut !== "VALIDE" && statut !== "REFUSE") {
    throw new Error("Statut invalide.");
  }

  if (utilisateurId === session.user.id && statut !== "VALIDE") {
    redirect("/admin/utilisateurs?error=auto_changement_statut");
  }

  await prisma.utilisateur.update({
    where: { id: utilisateurId },
    data: { statutInscription: statut },
  });

  revalidatePath("/admin/utilisateurs");
  redirect("/admin/utilisateurs");
}

export default async function GestionUtilisateursPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const utilisateurs = await prisma.utilisateur.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader
        title="Gestion des utilisateurs"
        description="Tous les comptes du club, quel que soit leur statut."
      />
      {error === "auto_changement_statut" && (
        <p className="mb-4 text-sm text-red-600">
          Tu ne peux pas changer ton propre statut d&apos;inscription.
        </p>
      )}
      <ul className="flex flex-col gap-3">
        {utilisateurs.map((utilisateur) => (
          <li
            key={utilisateur.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div>
              <p className="font-medium">
                {utilisateur.nomPrenom}{" "}
                <span className="text-sm font-normal text-zinc-500">
                  ({utilisateur.pseudo})
                </span>
                {utilisateur.estAdmin && (
                  <span className="ml-2 rounded bg-brand-violet px-2 py-0.5 text-xs font-medium text-white">
                    Admin
                  </span>
                )}
                {utilisateur.estMembreBureau && (
                  <span className="ml-2 rounded border border-zinc-300 px-2 py-0.5 text-xs font-medium dark:border-zinc-700">
                    Bureau
                  </span>
                )}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {utilisateur.mail}
                {utilisateur.telephone && ` — ${utilisateur.telephone}`}
              </p>
              <p className="text-xs text-zinc-500">
                Inscrit le {utilisateur.createdAt.toLocaleDateString("fr-FR")}
              </p>
            </div>
            <form action={modifierStatut} className="flex items-center gap-2">
              <input type="hidden" name="utilisateurId" value={utilisateur.id} />
              <select
                name="statutInscription"
                defaultValue={utilisateur.statutInscription}
                className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                {STATUTS.map((statut) => (
                  <option key={statut.value} value={statut.value}>
                    {statut.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded border border-zinc-300 px-3 py-1.5 text-sm font-medium dark:border-zinc-700"
              >
                Mettre à jour
              </button>
            </form>
          </li>
        ))}
      </ul>
    </>
  );
}
