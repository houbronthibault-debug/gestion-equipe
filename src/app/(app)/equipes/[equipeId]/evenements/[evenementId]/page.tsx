import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
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

async function definirPresence(
  equipeId: string,
  evenementId: string,
  statut: "CONFIRME" | "INFIRME",
) {
  "use server";

  const session = await auth();
  if (!session?.user) {
    throw new Error("Non autorisé.");
  }

  await prisma.participation.update({
    where: {
      utilisateurId_evenementId: {
        utilisateurId: session.user.id,
        evenementId,
      },
    },
    data: { statutPresence: statut },
  });

  revalidatePath(`/equipes/${equipeId}/evenements/${evenementId}`);
}

async function modifierIntendance(
  equipeId: string,
  evenementId: string,
  formData: FormData,
) {
  "use server";

  const session = await auth();
  if (
    !session?.user ||
    !(await peutEditerIntendance(session.user, evenementId))
  ) {
    throw new Error("Non autorisé.");
  }

  const trajet = String(formData.get("trajet") ?? "").trim();
  const couchage = String(formData.get("couchage") ?? "").trim();
  const repas = String(formData.get("repas") ?? "").trim();
  const reglement = String(formData.get("reglement") ?? "").trim();

  await prisma.evenement.update({
    where: { id: evenementId },
    data: {
      trajet: trajet || null,
      couchage: couchage || null,
      repas: repas || null,
      reglement: reglement || null,
    },
  });

  revalidatePath(`/equipes/${equipeId}/evenements/${evenementId}`);
}

async function marquerInfosIntendance(
  equipeId: string,
  evenementId: string,
  valeur: boolean,
) {
  "use server";

  const session = await auth();
  if (!session?.user) {
    throw new Error("Non autorisé.");
  }

  await prisma.participation.update({
    where: {
      utilisateurId_evenementId: {
        utilisateurId: session.user.id,
        evenementId,
      },
    },
    data: { infosIntendanceOk: valeur },
  });

  revalidatePath(`/equipes/${equipeId}/evenements/${evenementId}`);
}

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
          {participation ? (
            <>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Ton statut actuel :{" "}
                <span className="font-medium">
                  {participation.statutPresence === "CONFIRME" &&
                    "Confirmé"}
                  {participation.statutPresence === "INFIRME" && "Infirmé"}
                  {participation.statutPresence === "EN_ATTENTE" &&
                    "En attente"}
                </span>
                .
              </p>
              <div className="mt-3 flex gap-2">
                <form
                  action={definirPresence.bind(
                    null,
                    equipeId,
                    evenementId,
                    "CONFIRME",
                  )}
                >
                  <button
                    type="submit"
                    disabled={participation.statutPresence === "CONFIRME"}
                    className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
                  >
                    Confirmer ma présence
                  </button>
                </form>
                <form
                  action={definirPresence.bind(
                    null,
                    equipeId,
                    evenementId,
                    "INFIRME",
                  )}
                >
                  <button
                    type="submit"
                    disabled={participation.statutPresence === "INFIRME"}
                    className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-zinc-700"
                  >
                    Infirmer ma présence
                  </button>
                </form>
              </div>
            </>
          ) : (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Tu n&apos;es pas inscrit comme participant à cet événement.
            </p>
          )}
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

          {editableIntendance ? (
            <form
              action={modifierIntendance.bind(null, equipeId, evenementId)}
              className="mt-3 flex flex-col gap-3"
            >
              <div className="flex flex-col gap-1">
                <label htmlFor="trajet" className="text-sm font-medium">
                  Trajet
                </label>
                <textarea
                  id="trajet"
                  name="trajet"
                  rows={2}
                  defaultValue={evenement.trajet ?? ""}
                  className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="couchage" className="text-sm font-medium">
                  Couchage
                </label>
                <textarea
                  id="couchage"
                  name="couchage"
                  rows={2}
                  defaultValue={evenement.couchage ?? ""}
                  className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="repas" className="text-sm font-medium">
                  Repas
                </label>
                <textarea
                  id="repas"
                  name="repas"
                  rows={2}
                  defaultValue={evenement.repas ?? ""}
                  className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="reglement" className="text-sm font-medium">
                  Règlement
                </label>
                <textarea
                  id="reglement"
                  name="reglement"
                  rows={2}
                  defaultValue={evenement.reglement ?? ""}
                  className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <button
                type="submit"
                className="mt-1 self-start rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
              >
                Enregistrer
              </button>
            </form>
          ) : (
            <dl className="mt-3 flex flex-col gap-2 text-sm">
              <div>
                <dt className="font-medium">Trajet</dt>
                <dd className="text-zinc-600 dark:text-zinc-400">
                  {evenement.trajet || "Non renseigné."}
                </dd>
              </div>
              <div>
                <dt className="font-medium">Couchage</dt>
                <dd className="text-zinc-600 dark:text-zinc-400">
                  {evenement.couchage || "Non renseigné."}
                </dd>
              </div>
              <div>
                <dt className="font-medium">Repas</dt>
                <dd className="text-zinc-600 dark:text-zinc-400">
                  {evenement.repas || "Non renseigné."}
                </dd>
              </div>
              <div>
                <dt className="font-medium">Règlement</dt>
                <dd className="text-zinc-600 dark:text-zinc-400">
                  {evenement.reglement || "Non renseigné."}
                </dd>
              </div>
            </dl>
          )}

          {participation && (
            <div className="mt-4 border-t border-zinc-200 pt-3 dark:border-zinc-800">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Mes infos :{" "}
                <span className="font-medium">
                  {participation.infosIntendanceOk
                    ? "Complétées"
                    : "À compléter"}
                </span>
              </p>
              <form
                action={marquerInfosIntendance.bind(
                  null,
                  equipeId,
                  evenementId,
                  !participation.infosIntendanceOk,
                )}
              >
                <button
                  type="submit"
                  className="mt-2 rounded border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-700"
                >
                  {participation.infosIntendanceOk
                    ? "Marquer comme à compléter"
                    : "Marquer mes infos comme complétées"}
                </button>
              </form>
            </div>
          )}
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
