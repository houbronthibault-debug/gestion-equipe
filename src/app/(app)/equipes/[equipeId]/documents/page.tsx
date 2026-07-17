import { redirect } from "next/navigation";

import { PageHeader } from "@/components/PageHeader";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resoudreUrlDocument } from "@/lib/supabase";
import { peutConsulterEspaceEquipe } from "@/lib/permissions";

export default async function EquipeDocumentsPage({
  params,
}: {
  params: Promise<{ equipeId: string }>;
}) {
  const { equipeId } = await params;
  const session = await auth();

  if (!(await peutConsulterEspaceEquipe(session!.user, equipeId))) {
    redirect("/mes-equipes");
  }

  const documents = await prisma.document.findMany({
    where: { equipeId },
    include: { deposePar: true },
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
        title="Documents de l'équipe"
        description="Visibles uniquement par les membres de cette équipe."
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
              className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
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
                {document.visibleClub && " — visible par tout le club"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
