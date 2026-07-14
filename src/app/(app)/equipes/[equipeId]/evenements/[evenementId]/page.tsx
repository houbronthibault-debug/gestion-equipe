import { notFound } from "next/navigation";
import Link from "next/link";

import { PageHeader } from "@/components/PageHeader";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  peutDeclencherRelance,
  peutDesignerRoles,
  peutEditerEspaceCapitaine,
  peutEditerIntendance,
  peutModifierEvenement,
} from "@/lib/permissions";

export default async function EvenementDetailPage({
  params,
}: {
  params: Promise<{ equipeId: string; evenementId: string }>;
}) {
  const { equipeId, evenementId } = await params;
  const session = await auth();
  const user = session!.user;

  const evenement = await prisma.evenement.findUnique({
    where: { id: evenementId },
  });

  if (!evenement || evenement.equipeId !== equipeId) {
    notFound();
  }

  const participation = await prisma.participation.findUnique({
    where: { utilisateurId_evenementId: { utilisateurId: user.id, evenementId } },
  });

  const [
    editableInfos,
    editableCapitaine,
    editableIntendance,
    peutRelancer,
    peutDesigner,
  ] = await Promise.all([
    peutModifierEvenement(user, equipeId),
    peutEditerEspaceCapitaine(user, evenementId),
    peutEditerIntendance(user, evenementId),
    peutDeclencherRelance(user, evenementId),
    peutDesignerRoles(user, equipeId),
  ]);

  return (
    <>
      <PageHeader title="Détail de l'événement" description={evenement.lieu} />
      <div className="flex flex-col gap-6">
        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="font-medium">Infos générales</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {evenement.type} — {evenement.lieu}
            {evenement.programme && ` — ${evenement.programme}`}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            {editableInfos ? "Éditable par toi." : "Lecture seule."}
          </p>
          {peutDesigner && (
            <Link
              href={`/equipes/${equipeId}/gestion/evenements/${evenementId}/roles`}
              className="mt-2 inline-block text-sm font-medium underline"
            >
              Désigner capitaine / intendant
            </Link>
          )}
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
            {participation
              ? `Ton statut actuel : ${participation.statutPresence}.`
              : "Tu n'es pas inscrit comme participant à cet événement."}
          </p>
        </section>

        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="font-medium">Espace capitaine</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {editableCapitaine
              ? "Éditable par toi (capitaine désigné ou admin)."
              : "Réservé au capitaine désigné et à l'admin."}
          </p>
        </section>

        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="font-medium">Espace intendance</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {editableIntendance
              ? "Éditable par toi (intendant désigné ou admin)."
              : "Réservé à l'intendant désigné et à l'admin."}
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
            disabled={!peutRelancer}
            className="mt-3 rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
          >
            Relancer les retardataires
          </button>
        </section>
      </div>
    </>
  );
}
