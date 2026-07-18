import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { PageHeader } from "@/components/PageHeader";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getParametresApparence } from "@/lib/parametresApparence";
import { uploaderAssetPublic } from "@/lib/supabase";
import { eclaircirCouleur } from "@/lib/couleurs";

const DEFAUTS = {
  couleurFormulaires: "#643e8c",
  couleurTableauBord: "#643e8c",
  couleurFond: "#ffffff",
};

async function enregistrerApparence(formData: FormData) {
  "use server";

  const session = await auth();
  if (!session?.user.estAdmin) {
    throw new Error("Non autorisé.");
  }

  const couleurFormulaires = String(formData.get("couleurFormulaires") ?? "");
  const couleurTableauBord = String(formData.get("couleurTableauBord") ?? "");
  const couleurFondFormulaires = String(
    formData.get("couleurFondFormulaires") ?? "",
  );
  const couleurFondTableauBord = String(
    formData.get("couleurFondTableauBord") ?? "",
  );
  const couleurSousElementFormulaires = String(
    formData.get("couleurSousElementFormulaires") ?? "",
  );
  const couleurSousElementTableauBord = String(
    formData.get("couleurSousElementTableauBord") ?? "",
  );
  const couleurFond = String(formData.get("couleurFond") ?? "");
  const utiliserDegradeConnexion =
    formData.get("utiliserDegradeConnexion") === "on";
  const supprimerImage = formData.get("supprimerImage") === "on";
  const image = formData.get("imageFond");

  const existant = await getParametresApparence();
  let imageFond = existant?.imageFond ?? null;

  if (supprimerImage) {
    imageFond = null;
  }

  if (image instanceof File && image.size > 0) {
    const extension = image.name.includes(".")
      ? image.name.slice(image.name.lastIndexOf("."))
      : "";
    const chemin = `fond-ecran${extension}`;
    const url = await uploaderAssetPublic(chemin, image);
    if (!url) {
      redirect("/admin/apparence?error=upload_echoue");
    }
    imageFond = `${url}?v=${Date.now()}`;
  }

  await prisma.parametresApparence.upsert({
    where: { id: "singleton" },
    update: {
      couleurFormulaires,
      couleurTableauBord,
      couleurFondFormulaires,
      couleurFondTableauBord,
      couleurSousElementFormulaires,
      couleurSousElementTableauBord,
      couleurFond,
      imageFond,
      utiliserDegradeConnexion,
    },
    create: {
      id: "singleton",
      couleurFormulaires,
      couleurTableauBord,
      couleurFondFormulaires,
      couleurFondTableauBord,
      couleurSousElementFormulaires,
      couleurSousElementTableauBord,
      couleurFond,
      imageFond,
      utiliserDegradeConnexion,
    },
  });

  revalidatePath("/", "layout");
  redirect("/admin/apparence?succes=1");
}

async function reinitialiserApparence() {
  "use server";

  const session = await auth();
  if (!session?.user.estAdmin) {
    throw new Error("Non autorisé.");
  }

  await prisma.parametresApparence.deleteMany({ where: { id: "singleton" } });

  revalidatePath("/", "layout");
  redirect("/admin/apparence?succes=1");
}

export default async function ApparencePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; succes?: string }>;
}) {
  const { error, succes } = await searchParams;
  const parametres = await getParametresApparence();

  return (
    <>
      <PageHeader
        title="Apparence du site"
        description="Couleurs et fond d'écran appliqués à tout le club (réglages globaux, admin uniquement)."
      />

      {succes && (
        <p className="mb-4 rounded border border-zinc-300 bg-card-background px-3 py-2 text-sm dark:border-zinc-700">
          Apparence enregistrée.
        </p>
      )}
      {error === "upload_echoue" && (
        <p className="mb-4 text-sm text-red-600">
          L&apos;upload de l&apos;image a échoué. Réessaie avec une image plus
          légère (PNG, JPG ou WebP).
        </p>
      )}

      <form
        action={enregistrerApparence}
        className="flex max-w-lg flex-col gap-5"
      >
        <div className="flex flex-col gap-3 border-b border-zinc-200 pb-4 dark:border-zinc-700">
          <p className="text-sm font-medium">Formulaires</p>
          <div className="flex flex-wrap gap-6">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="couleurFormulaires"
                className="text-sm text-zinc-600 dark:text-zinc-400"
              >
                Boutons
              </label>
              <input
                id="couleurFormulaires"
                name="couleurFormulaires"
                type="color"
                defaultValue={
                  parametres?.couleurFormulaires ?? DEFAUTS.couleurFormulaires
                }
                className="h-10 w-20 rounded border border-zinc-300 dark:border-zinc-700"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="couleurFondFormulaires"
                className="text-sm text-zinc-600 dark:text-zinc-400"
              >
                Fond des cadres
              </label>
              <input
                id="couleurFondFormulaires"
                name="couleurFondFormulaires"
                type="color"
                defaultValue={
                  parametres?.couleurFondFormulaires ??
                  eclaircirCouleur(
                    parametres?.couleurFormulaires ??
                      DEFAUTS.couleurFormulaires,
                  )
                }
                className="h-10 w-20 rounded border border-zinc-300 dark:border-zinc-700"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="couleurSousElementFormulaires"
                className="text-sm text-zinc-600 dark:text-zinc-400"
              >
                Fond des sous-éléments (cadres imbriqués)
              </label>
              <input
                id="couleurSousElementFormulaires"
                name="couleurSousElementFormulaires"
                type="color"
                defaultValue={
                  parametres?.couleurSousElementFormulaires ??
                  eclaircirCouleur(
                    parametres?.couleurFormulaires ??
                      DEFAUTS.couleurFormulaires,
                    0.88,
                  )
                }
                className="h-10 w-20 rounded border border-zinc-300 dark:border-zinc-700"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-zinc-200 pb-4 dark:border-zinc-700">
          <p className="text-sm font-medium">
            Éléments du tableau de bord (menus, cartes)
          </p>
          <div className="flex flex-wrap gap-6">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="couleurTableauBord"
                className="text-sm text-zinc-600 dark:text-zinc-400"
              >
                Survol / accents
              </label>
              <input
                id="couleurTableauBord"
                name="couleurTableauBord"
                type="color"
                defaultValue={
                  parametres?.couleurTableauBord ?? DEFAUTS.couleurTableauBord
                }
                className="h-10 w-20 rounded border border-zinc-300 dark:border-zinc-700"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="couleurFondTableauBord"
                className="text-sm text-zinc-600 dark:text-zinc-400"
              >
                Fond des cadres
              </label>
              <input
                id="couleurFondTableauBord"
                name="couleurFondTableauBord"
                type="color"
                defaultValue={
                  parametres?.couleurFondTableauBord ??
                  eclaircirCouleur(
                    parametres?.couleurTableauBord ??
                      DEFAUTS.couleurTableauBord,
                  )
                }
                className="h-10 w-20 rounded border border-zinc-300 dark:border-zinc-700"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="couleurSousElementTableauBord"
                className="text-sm text-zinc-600 dark:text-zinc-400"
              >
                Fond des sous-éléments (cadres imbriqués)
              </label>
              <input
                id="couleurSousElementTableauBord"
                name="couleurSousElementTableauBord"
                type="color"
                defaultValue={
                  parametres?.couleurSousElementTableauBord ??
                  eclaircirCouleur(
                    parametres?.couleurTableauBord ??
                      DEFAUTS.couleurTableauBord,
                    0.88,
                  )
                }
                className="h-10 w-20 rounded border border-zinc-300 dark:border-zinc-700"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-b border-zinc-200 pb-4 dark:border-zinc-700">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              name="utiliserDegradeConnexion"
              defaultChecked={parametres?.utiliserDegradeConnexion ?? false}
            />
            Utiliser le dégradé violet/noir de la page de connexion comme fond
            du site
          </label>
          <p className="text-xs text-zinc-500">
            Si activé, ce dégradé remplace la couleur et l&apos;image de fond
            ci-dessous sur toutes les pages une fois connecté.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="couleurFond" className="text-sm font-medium">
            Couleur de fond des pages
          </label>
          <input
            id="couleurFond"
            name="couleurFond"
            type="color"
            defaultValue={parametres?.couleurFond ?? DEFAUTS.couleurFond}
            className="h-10 w-20 rounded border border-zinc-300 dark:border-zinc-700"
          />
        </div>

        <div className="flex flex-col gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-700">
          <label htmlFor="imageFond" className="text-sm font-medium">
            Image de fond (optionnelle, superposée à la couleur de fond)
          </label>
          {parametres?.imageFond && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={parametres.imageFond}
              alt="Fond d'écran actuel"
              className="h-32 w-full rounded border border-zinc-300 object-cover dark:border-zinc-700"
            />
          )}
          <input
            id="imageFond"
            name="imageFond"
            type="file"
            accept=".png,.jpg,.jpeg,.webp"
            className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          {parametres?.imageFond && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="supprimerImage" />
              Supprimer l&apos;image de fond actuelle
            </label>
          )}
        </div>

        <button
          type="submit"
          className="self-start rounded bg-accent-formulaires px-4 py-2 text-sm font-medium text-white hover:bg-accent-formulaires-dark"
        >
          Enregistrer
        </button>
      </form>

      <form action={reinitialiserApparence} className="mt-6">
        <button
          type="submit"
          className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Réinitialiser aux couleurs par défaut
        </button>
      </form>
    </>
  );
}
