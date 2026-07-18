import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";
import { resoudreUrlDocument } from "@/lib/supabase";

export default async function DocumentsClubPage() {
  const documents = await prisma.document.findMany({
    where: { visibleClub: true },
    include: { deposePar: true, equipe: true },
    orderBy: { createdAt: "desc" },
  });

  const documentsAvecUrl = await Promise.all(
    documents.map(async (document) => ({
      document,
      url: await resoudreUrlDocument(document.fichierOuLien),
    })),
  );

  return (
    <>
      <PageHeader
        title="Documents du club"
        description="Documents visibles par tous les membres du club."
      />
      {documentsAvecUrl.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Aucun document pour l&apos;instant.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {documentsAvecUrl.map(({ document, url }) => (
            <li
              key={document.id}
              className="rounded-lg border border-zinc-200 bg-card-background p-4 dark:border-zinc-700"
            >
              {url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline"
                >
                  {document.type}
                </a>
              ) : (
                <span className="font-medium text-red-600">
                  {document.type} (lien indisponible)
                </span>
              )}
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Déposé par {document.deposePar.nomPrenom} le{" "}
                {document.createdAt.toLocaleDateString("fr-FR")}
                {document.equipe && ` — ${document.equipe.nom}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
