import { PageHeader } from "@/components/PageHeader";

export default function DepotDocumentPage() {
  return (
    <>
      <PageHeader
        title="Déposer un document"
        description="Document d'équipe, ou visible par tout le club."
      />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Formulaire de dépôt à venir.
      </p>
    </>
  );
}
