import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { PageHeader } from "@/components/PageHeader";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function creerEquipe(formData: FormData) {
  "use server";

  const session = await auth();
  if (!session?.user.estAdmin) {
    throw new Error("Non autorisé.");
  }

  const nom = String(formData.get("nom") ?? "").trim();
  if (!nom) {
    redirect("/admin/equipes?error=nom_requis");
  }

  try {
    await prisma.equipe.create({ data: { nom } });
  } catch {
    redirect("/admin/equipes?error=nom_deja_utilise");
  }

  revalidatePath("/admin/equipes");
  redirect("/admin/equipes");
}

async function renommerEquipe(formData: FormData) {
  "use server";

  const session = await auth();
  if (!session?.user.estAdmin) {
    throw new Error("Non autorisé.");
  }

  const equipeId = String(formData.get("equipeId"));
  const nom = String(formData.get("nom") ?? "").trim();
  if (!nom) {
    redirect("/admin/equipes?error=nom_requis");
  }

  try {
    await prisma.equipe.update({ where: { id: equipeId }, data: { nom } });
  } catch {
    redirect("/admin/equipes?error=nom_deja_utilise");
  }

  revalidatePath("/admin/equipes");
  redirect("/admin/equipes");
}

export default async function GestionEquipesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const equipes = await prisma.equipe.findMany({
    orderBy: { nom: "asc" },
    include: { _count: { select: { appartenances: true, evenements: true } } },
  });

  return (
    <>
      <PageHeader
        title="Gestion des équipes"
        description="Créer ou renommer une équipe. La suppression n'est pas proposée ici : elle effacerait en cascade les membres, événements et documents de l'équipe."
      />

      <section className="mb-8 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="font-medium">Créer une équipe</h2>
        <form action={creerEquipe} className="mt-3 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="nom" className="text-sm font-medium">
              Nom de l&apos;équipe
            </label>
            <input
              id="nom"
              name="nom"
              type="text"
              required
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <button
            type="submit"
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
          >
            Créer
          </button>
        </form>
        {error === "nom_requis" && (
          <p className="mt-2 text-sm text-red-600">Le nom est requis.</p>
        )}
        {error === "nom_deja_utilise" && (
          <p className="mt-2 text-sm text-red-600">
            Ce nom d&apos;équipe est déjà utilisé.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-medium">Équipes existantes</h2>
        {equipes.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Aucune équipe pour l&apos;instant.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {equipes.map((equipe) => (
              <li
                key={equipe.id}
                className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {equipe._count.appartenances} membre(s) ·{" "}
                  {equipe._count.evenements} événement(s)
                </p>
                <form
                  action={renommerEquipe}
                  className="mt-2 flex flex-wrap items-center gap-2"
                >
                  <input type="hidden" name="equipeId" value={equipe.id} />
                  <input
                    name="nom"
                    type="text"
                    defaultValue={equipe.nom}
                    required
                    className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                  <button
                    type="submit"
                    className="rounded border border-zinc-300 px-3 py-1.5 text-sm font-medium dark:border-zinc-700"
                  >
                    Renommer
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
