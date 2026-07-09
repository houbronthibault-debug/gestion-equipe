import { PageHeader } from "@/components/PageHeader";

export default function GestionRolesPage() {
  return (
    <>
      <PageHeader
        title="Gestion globale des rôles"
        description="Administrateur, membre du bureau, coach par équipe."
      />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Interface de gestion des rôles à venir.
      </p>
    </>
  );
}
