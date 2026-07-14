import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";

export default async function DocumentsClubPage() {
  const documents = await prisma.document.findMany({
    where: { visibleClub: true },
    include: { deposePar: true, equipe: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader
        title="Documents du club"
        description="Documents visibles par tous les membres du club."
      />
      {documents.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Aucun document pour l&apos;instant.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {documents.map((document) => (
            <li
              key={document.id}
              className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <a
                href={document.fichierOuLien}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline"
              >
                {document.type}
              </a>
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
