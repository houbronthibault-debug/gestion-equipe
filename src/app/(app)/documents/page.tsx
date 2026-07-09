import { PageHeader } from "@/components/PageHeader";

export default function DocumentsClubPage() {
  return (
    <>
      <PageHeader
        title="Documents du club"
        description="Documents visibles par tous les membres du club."
      />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Liste des documents à venir.
      </p>
    </>
  );
}
