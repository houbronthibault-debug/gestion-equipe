import { PageHeader } from "@/components/PageHeader";

export default function GestionUtilisateursPage() {
  return (
    <>
      <PageHeader
        title="Gestion des utilisateurs"
        description="Tous les comptes du club."
      />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Liste des utilisateurs à venir.
      </p>
    </>
  );
}
