import { PageHeader } from "@/components/PageHeader";

export default async function EquipeVueEnsemblePage({
  params,
}: {
  params: Promise<{ equipeId: string }>;
}) {
  const { equipeId } = await params;

  return (
    <>
      <PageHeader
        title="Vue d'ensemble"
        description="Calendrier de l'équipe et liste des membres."
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="font-medium">Calendrier de l&apos;équipe</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Événements à venir pour l&apos;équipe {equipeId}.
          </p>
        </section>
        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="font-medium">Membres</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Liste des coachs et joueurs de l&apos;équipe.
          </p>
        </section>
      </div>
    </>
  );
}
