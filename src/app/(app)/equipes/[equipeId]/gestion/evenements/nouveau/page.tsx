import { PageHeader } from "@/components/PageHeader";

export default function CreationEvenementPage() {
  return (
    <>
      <PageHeader
        title="Créer un événement"
        description="Type, lieu, durée, programme et objectif."
      />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Formulaire de création à venir.
      </p>
    </>
  );
}
