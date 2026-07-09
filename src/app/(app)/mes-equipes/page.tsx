import { PageHeader } from "@/components/PageHeader";

export default function MesEquipesPage() {
  return (
    <>
      <PageHeader
        title="Mes équipes"
        description="Les équipes auxquelles tu appartiens."
      />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Liste des équipes à venir.
      </p>
    </>
  );
}
