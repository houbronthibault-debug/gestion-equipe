import { PageHeader } from "@/components/PageHeader";

export default async function EvenementDetailPage({
  params,
}: {
  params: Promise<{ equipeId: string; evenementId: string }>;
}) {
  const { evenementId } = await params;

  return (
    <>
      <PageHeader title="Détail de l'événement" description={`Événement ${evenementId}`} />
      <div className="flex flex-col gap-6">
        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="font-medium">Infos générales</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Type, lieu, durée, programme, objectif — éditable par le coach ou
            l&apos;admin.
          </p>
        </section>

        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="font-medium">Participants</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Liste des participants et de leur statut de présence.
          </p>
        </section>

        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="font-medium">Confirmation de présence</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Le joueur concerné confirme ou infirme sa présence.
          </p>
        </section>

        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="font-medium">Espace capitaine</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Éditable par le capitaine désigné ou l&apos;admin.
          </p>
        </section>

        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="font-medium">Espace intendance</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Trajet, couchage, repas, règlement — éditable par
            l&apos;intendant désigné ou l&apos;admin. Chaque joueur remplit
            ses infos.
          </p>
        </section>

        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="font-medium">Relance</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Le coach, l&apos;intendant ou l&apos;admin peut relancer les
            retardataires.
          </p>
          <button
            type="button"
            disabled
            className="mt-3 rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
          >
            Relancer les retardataires
          </button>
        </section>
      </div>
    </>
  );
}
