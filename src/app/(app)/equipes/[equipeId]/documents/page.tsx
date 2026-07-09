import { PageHeader } from "@/components/PageHeader";

export default function EquipeDocumentsPage() {
  return (
    <>
      <PageHeader
        title="Documents de l'équipe"
        description="Visibles uniquement par les membres de cette équipe."
      />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Liste des documents à venir.
      </p>
    </>
  );
}
