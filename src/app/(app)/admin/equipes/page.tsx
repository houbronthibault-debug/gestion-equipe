import { PageHeader } from "@/components/PageHeader";

export default function GestionEquipesPage() {
  return (
    <>
      <PageHeader title="Gestion des équipes" description="Créer, renommer ou supprimer une équipe." />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Liste des équipes à venir.
      </p>
    </>
  );
}
