import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";

export default async function EquipeDocumentsPage({
  params,
}: {
  params: Promise<{ equipeId: string }>;
}) {
  const { equipeId } = await params;

  const documents = await prisma.document.findMany({
    where: { equipeId },
    include: { deposePar: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader
        title="Documents de l'équipe"
        description="Visibles uniquement par les membres de cette équipe."
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
                {document.visibleClub && " — visible par tout le club"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
