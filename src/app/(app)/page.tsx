import { PageHeader } from "@/components/PageHeader";

export default function TableauDeBordPage() {
  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description="Calendrier unifié toutes équipes confondues, actions en attente et notifications."
      />
      <div className="grid gap-6 sm:grid-cols-3">
        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="font-medium">Calendrier</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Événements à venir sur toutes tes équipes.
          </p>
        </section>
        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="font-medium">Actions en attente</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Confirmations de présence et infos d&apos;intendance à compléter.
          </p>
        </section>
        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="font-medium">Notifications</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Nouveaux événements, ajouts et relances.
          </p>
        </section>
      </div>
    </>
  );
}
