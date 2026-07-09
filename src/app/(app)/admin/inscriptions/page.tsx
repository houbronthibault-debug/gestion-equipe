import { PageHeader } from "@/components/PageHeader";

export default function ValidationInscriptionsPage() {
  return (
    <>
      <PageHeader
        title="Validation des inscriptions"
        description="Demandes d'inscription en attente de validation."
      />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Liste des demandes à venir.
      </p>
    </>
  );
}
