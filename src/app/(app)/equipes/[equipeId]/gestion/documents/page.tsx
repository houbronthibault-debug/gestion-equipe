import { redirect } from "next/navigation";

import { PageHeader } from "@/components/PageHeader";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DOCUMENTS_BUCKET, supabaseAdmin } from "@/lib/supabase";
import {
  peutDeposerDocumentClub,
  peutDeposerDocumentEquipe,
} from "@/lib/permissions";

async function deposerDocument(equipeId: string, formData: FormData) {
  "use server";

  const session = await auth();
  if (!session?.user) {
    throw new Error("Non autorisé.");
  }
  const user = session.user;

  const visibleClub = formData.get("visibleClub") === "on";
  const type = String(formData.get("type") ?? "").trim();
  const lien = String(formData.get("fichierOuLien") ?? "").trim();
  const fichier = formData.get("fichier");

  if (!type) {
    redirect(`/equipes/${equipeId}/gestion/documents?error=champs_requis`);
  }

  const [peutEquipe, peutClub] = await Promise.all([
    peutDeposerDocumentEquipe(user, equipeId),
    peutDeposerDocumentClub(user),
  ]);

  if (!peutEquipe || (visibleClub && !peutClub)) {
    throw new Error("Non autorisé.");
  }

  let fichierOuLien: string;

  if (fichier instanceof File && fichier.size > 0) {
    const extension = fichier.name.includes(".")
      ? fichier.name.slice(fichier.name.lastIndexOf("."))
      : "";
    const chemin = `${equipeId}/${crypto.randomUUID()}${extension}`;

    const { error } = await supabaseAdmin.storage
      .from(DOCUMENTS_BUCKET)
      .upload(chemin, fichier, {
        contentType: fichier.type || undefined,
      });

    if (error) {
      redirect(`/equipes/${equipeId}/gestion/documents?error=upload_echoue`);
    }

    fichierOuLien = `storage://${chemin}`;
  } else if (lien) {
    fichierOuLien = lien;
  } else {
    redirect(`/equipes/${equipeId}/gestion/documents?error=champs_requis`);
  }

  await prisma.document.create({
    data: {
      equipeId,
      visibleClub,
      type,
      fichierOuLien,
      deposeParId: user.id,
    },
  });

  redirect(`/equipes/${equipeId}/documents`);
}

export default async function DepotDocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ equipeId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { equipeId } = await params;
  const { error } = await searchParams;
  const deposer = deposerDocument.bind(null, equipeId);

  return (
    <>
      <PageHeader
        title="Déposer un document"
        description="Fichier uploadé (PDF, Word, Excel, image — 20 Mo max), ou lien externe. Pour les fichiers volumineux (vidéos...), privilégie un lien externe."
      />
      <form action={deposer} className="flex max-w-lg flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="type" className="text-sm font-medium">
            Type de document
          </label>
          <input
            id="type"
            name="type"
            type="text"
            placeholder="ex. Feuille de match, Règlement, Photo, Vidéo"
            required
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="fichier" className="text-sm font-medium">
            Fichier à uploader
          </label>
          <input
            id="fichier"
            name="fichier"
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="fichierOuLien" className="text-sm font-medium">
            Ou lien externe (si aucun fichier n&apos;est choisi ci-dessus)
          </label>
          <input
            id="fichierOuLien"
            name="fichierOuLien"
            type="url"
            placeholder="https://…"
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="visibleClub" />
          Visible par tout le club (pas seulement cette équipe)
        </label>
        {error === "champs_requis" && (
          <p className="text-sm text-red-600">
            Merci de renseigner le type, et soit un fichier, soit un lien.
          </p>
        )}
        {error === "upload_echoue" && (
          <p className="text-sm text-red-600">
            L&apos;upload du fichier a échoué (format ou taille non
            autorisés). Réessaie ou utilise un lien externe.
          </p>
        )}
        <button
          type="submit"
          className="mt-2 self-start rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
        >
          Déposer
        </button>
      </form>
    </>
  );
}
