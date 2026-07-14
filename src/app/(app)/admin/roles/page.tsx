import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { PageHeader } from "@/components/PageHeader";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function definirRoleGlobal(formData: FormData) {
  "use server";

  const session = await auth();
  if (!session?.user.estAdmin) {
    throw new Error("Non autorisé.");
  }

  const utilisateurId = String(formData.get("utilisateurId"));
  const champ = formData.get("champ");
  const valeur = formData.get("valeur") === "true";

  if (champ !== "estAdmin" && champ !== "estMembreBureau") {
    throw new Error("Champ invalide.");
  }

  if (
    champ === "estAdmin" &&
    utilisateurId === session.user.id &&
    valeur === false
  ) {
    redirect("/admin/roles?error=auto_retrait_admin");
  }

  await prisma.utilisateur.update({
    where: { id: utilisateurId },
    data: { [champ]: valeur },
  });

  revalidatePath("/admin/roles");
  redirect("/admin/roles");
}

export default async function GestionRolesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const utilisateurs = await prisma.utilisateur.findMany({
    where: { statutInscription: "VALIDE" },
    orderBy: { nomPrenom: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Gestion globale des rôles"
        description="Administrateur et membre du bureau (portée globale). Coach/joueur se gèrent depuis chaque équipe, capitaine/intendant depuis chaque événement."
      />
      {error === "auto_retrait_admin" && (
        <p className="mb-4 text-sm text-red-600">
          Tu ne peux pas retirer ton propre statut d&apos;administrateur.
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
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {utilisateur.mail}
              </p>
            </div>
            <div className="flex gap-2">
              <form action={definirRoleGlobal}>
                <input type="hidden" name="utilisateurId" value={utilisateur.id} />
                <input type="hidden" name="champ" value="estAdmin" />
                <input
                  type="hidden"
                  name="valeur"
                  value={(!utilisateur.estAdmin).toString()}
                />
                <button
                  type="submit"
                  className={
                    utilisateur.estAdmin
                      ? "rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
                      : "rounded border border-zinc-300 px-3 py-1.5 text-sm font-medium dark:border-zinc-700"
                  }
                >
                  Admin
                </button>
              </form>
              <form action={definirRoleGlobal}>
                <input type="hidden" name="utilisateurId" value={utilisateur.id} />
                <input type="hidden" name="champ" value="estMembreBureau" />
                <input
                  type="hidden"
                  name="valeur"
                  value={(!utilisateur.estMembreBureau).toString()}
                />
                <button
                  type="submit"
                  className={
                    utilisateur.estMembreBureau
                      ? "rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
                      : "rounded border border-zinc-300 px-3 py-1.5 text-sm font-medium dark:border-zinc-700"
                  }
                >
                  Membre du bureau
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
