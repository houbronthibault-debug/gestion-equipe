import { revalidatePath } from "next/cache";

import { PageHeader } from "@/components/PageHeader";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { peutValiderInscription } from "@/lib/permissions";

async function traiterInscription(
  utilisateurId: string,
  statut: "VALIDE" | "REFUSE",
) {
  const session = await auth();
  if (!session?.user || !peutValiderInscription(session.user)) {
    throw new Error("Non autorisé.");
  }

  await prisma.utilisateur.update({
    where: { id: utilisateurId },
    data: { statutInscription: statut },
  });

  revalidatePath("/admin/inscriptions");
}

async function validerInscription(formData: FormData) {
  "use server";
  await traiterInscription(String(formData.get("utilisateurId")), "VALIDE");
}

async function refuserInscription(formData: FormData) {
  "use server";
  await traiterInscription(String(formData.get("utilisateurId")), "REFUSE");
}

export default async function ValidationInscriptionsPage() {
  const demandes = await prisma.utilisateur.findMany({
    where: { statutInscription: "EN_ATTENTE" },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Validation des inscriptions"
        description="Demandes d'inscription en attente de validation."
      />
      {demandes.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Aucune demande en attente.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {demandes.map((demande) => (
            <li
              key={demande.id}
              className="rounded-lg border border-zinc-200 bg-card-background-tableau-bord p-4 dark:border-zinc-700"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{demande.nomPrenom}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {demande.pseudo} — {demande.mail}
                    {demande.telephone && ` — ${demande.telephone}`}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Demande envoyée le{" "}
                    {demande.createdAt.toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={validerInscription}>
                    <input
                      type="hidden"
                      name="utilisateurId"
                      value={demande.id}
                    />
                    <button
                      type="submit"
                      className="rounded bg-accent-formulaires px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-formulaires-dark"
                    >
                      Valider
                    </button>
                  </form>
                  <form action={refuserInscription}>
                    <input
                      type="hidden"
                      name="utilisateurId"
                      value={demande.id}
                    />
                    <button
                      type="submit"
                      className="rounded border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                    >
                      Refuser
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
