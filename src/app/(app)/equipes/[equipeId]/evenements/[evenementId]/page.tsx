import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

import { PageHeader } from "@/components/PageHeader";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { envoyerEmail } from "@/lib/email";
import {
  peutConsulterEvenement,
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

async function modifierNotesCapitaine(
  equipeId: string,
  evenementId: string,
  formData: FormData,
) {
  "use server";

  const session = await auth();
  if (
    !session?.user ||
    !(await peutEditerEspaceCapitaine(session.user, evenementId))
  ) {
    throw new Error("Non autorisé.");
  }

  const notesCapitaine = String(formData.get("notesCapitaine") ?? "").trim();

  await prisma.evenement.update({
    where: { id: evenementId },
    data: { notesCapitaine: notesCapitaine || null },
  });

  revalidatePath(`/equipes/${equipeId}/evenements/${evenementId}`);
}

async function ajouterQuestionIntendance(
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

  const libelle = String(formData.get("libelle") ?? "").trim();
  const optionsTexte = String(formData.get("optionsTexte") ?? "");
  const options = optionsTexte
    .split("\n")
    .map((ligne) => ligne.trim())
    .filter((ligne) => ligne.length > 0);

  if (!libelle) {
    redirect(
      `/equipes/${equipeId}/evenements/${evenementId}?error=question_invalide`,
    );
  }

  await prisma.questionIntendance.create({
    data: {
      evenementId,
      libelle,
      options: {
        create: options.map((optionLibelle, index) => ({
          libelle: optionLibelle,
          ordre: index,
        })),
      },
    },
  });

  revalidatePath(`/equipes/${equipeId}/evenements/${evenementId}`);
}

async function retirerQuestionIntendance(
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

  const questionId = String(formData.get("questionId"));

  await prisma.questionIntendance.delete({ where: { id: questionId } });

  revalidatePath(`/equipes/${equipeId}/evenements/${evenementId}`);
  redirect(`/equipes/${equipeId}/evenements/${evenementId}#intendance`);
}

async function repondreIntendance(
  equipeId: string,
  evenementId: string,
  formData: FormData,
) {
  "use server";

  const session = await auth();
  if (!session?.user) {
    throw new Error("Non autorisé.");
  }
  const utilisateurId = session.user.id;

  const questions = await prisma.questionIntendance.findMany({
    where: { evenementId },
    select: { id: true, options: { select: { id: true } } },
  });

  for (const question of questions) {
    if (question.options.length === 0) {
      const reponseLibre = String(
        formData.get(`q_${question.id}_autre`) ?? "",
      ).trim();
      if (!reponseLibre) continue;

      await prisma.reponseIntendance.upsert({
        where: {
          questionId_utilisateurId: { questionId: question.id, utilisateurId },
        },
        update: { optionId: null, reponseLibre },
        create: { questionId: question.id, utilisateurId, reponseLibre },
      });
      continue;
    }

    const valeur = formData.get(`q_${question.id}`);
    if (!valeur) continue;

    if (valeur === "autre") {
      const reponseLibre = String(
        formData.get(`q_${question.id}_autre`) ?? "",
      ).trim();
      if (!reponseLibre) continue;

      await prisma.reponseIntendance.upsert({
        where: {
          questionId_utilisateurId: { questionId: question.id, utilisateurId },
        },
        update: { optionId: null, reponseLibre },
        create: { questionId: question.id, utilisateurId, reponseLibre },
      });
    } else {
      await prisma.reponseIntendance.upsert({
        where: {
          questionId_utilisateurId: { questionId: question.id, utilisateurId },
        },
        update: { optionId: String(valeur), reponseLibre: null },
        create: {
          questionId: question.id,
          utilisateurId,
          optionId: String(valeur),
        },
      });
    }
  }

  revalidatePath(`/equipes/${equipeId}/evenements/${evenementId}`);
}

async function relancerRetardataires(equipeId: string, evenementId: string) {
  "use server";

  const session = await auth();
  if (
    !session?.user ||
    !(await peutDeclencherRelance(session.user, evenementId))
  ) {
    throw new Error("Non autorisé.");
  }

  const evenement = await prisma.evenement.findUniqueOrThrow({
    where: { id: evenementId },
  });

  const [participants, questions] = await Promise.all([
    prisma.participation.findMany({
      where: { evenementId },
      include: { utilisateur: true },
    }),
    prisma.questionIntendance.findMany({
      where: { evenementId },
      include: { reponses: true },
    }),
  ]);

  const nombreReponses = new Map<string, number>();
  for (const question of questions) {
    for (const reponse of question.reponses) {
      nombreReponses.set(
        reponse.utilisateurId,
        (nombreReponses.get(reponse.utilisateurId) ?? 0) + 1,
      );
    }
  }

  const retardataires = participants.filter(
    (p) =>
      p.statutPresence === "EN_ATTENTE" ||
      (nombreReponses.get(p.utilisateurId) ?? 0) < questions.length,
  );

  const lienEvenement = `${process.env.APP_URL}/equipes/${equipeId}/evenements/${evenementId}`;

  const resultats = await Promise.all(
    retardataires.map((retardataire) => {
      const actions: string[] = [];
      if (retardataire.statutPresence === "EN_ATTENTE") {
        actions.push("confirmer ta présence");
      }
      if ((nombreReponses.get(retardataire.utilisateurId) ?? 0) < questions.length) {
        actions.push("compléter tes infos d'intendance");
      }

      return envoyerEmail({
        to: retardataire.utilisateur.mail,
        subject: `Rappel — ${evenement.lieu}`,
        html: `<p>Bonjour ${retardataire.utilisateur.nomPrenom},</p><p>Merci de ${actions.join(" et ")} pour l'événement au ${evenement.lieu}.</p><p><a href="${lienEvenement}">Voir l'événement</a></p>`,
      });
    }),
  );

  const envoyes = resultats.filter((r) => r.success).length;
  const echecs = resultats.length - envoyes;

  redirect(
    `/equipes/${equipeId}/evenements/${evenementId}?relance=${envoyes}&relanceEchecs=${echecs}`,
  );
}

async function supprimerEvenement(equipeId: string, evenementId: string) {
  "use server";

  const session = await auth();
  if (
    !session?.user ||
    !(await peutModifierEvenement(session.user, equipeId))
  ) {
    throw new Error("Non autorisé.");
  }

  await prisma.evenement.delete({ where: { id: evenementId } });

  redirect(`/equipes/${equipeId}`);
}

async function ajouterParticipant(
  equipeId: string,
  evenementId: string,
  formData: FormData,
) {
  "use server";

  const session = await auth();
  if (
    !session?.user ||
    !(await peutModifierEvenement(session.user, equipeId))
  ) {
    throw new Error("Non autorisé.");
  }

  const utilisateurId = String(formData.get("utilisateurId"));

  await prisma.participation.upsert({
    where: { utilisateurId_evenementId: { utilisateurId, evenementId } },
    update: {},
    create: { utilisateurId, evenementId },
  });

  revalidatePath(`/equipes/${equipeId}/evenements/${evenementId}`);
}

export default async function EvenementDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ equipeId: string; evenementId: string }>;
  searchParams: Promise<{
    relance?: string;
    relanceEchecs?: string;
    error?: string;
    confirmerSuppression?: string;
    confirmerSuppressionEvenement?: string;
  }>;
}) {
  const { equipeId, evenementId } = await params;
  const {
    relance,
    relanceEchecs,
    error,
    confirmerSuppression,
    confirmerSuppressionEvenement,
  } = await searchParams;
  const session = await auth();
  const user = session!.user;

  const evenement = await prisma.evenement.findUnique({
    where: { id: evenementId },
  });

  if (!evenement || evenement.equipeId !== equipeId) {
    notFound();
  }

  if (!(await peutConsulterEvenement(user, equipeId, evenementId))) {
    redirect("/mes-equipes");
  }

  const concerneIntendanceEtCapitaine = evenement.type !== "ENTRAINEMENT";

  const participation = await prisma.participation.findUnique({
    where: { utilisateurId_evenementId: { utilisateurId: user.id, evenementId } },
  });

  const [participants, assignations, questions] = await Promise.all([
    prisma.participation.findMany({
      where: { evenementId },
      include: { utilisateur: true },
      orderBy: { utilisateur: { nomPrenom: "asc" } },
    }),
    prisma.assignationEvenement.findMany({ where: { evenementId } }),
    concerneIntendanceEtCapitaine
      ? prisma.questionIntendance.findMany({
          where: { evenementId },
          include: { options: { orderBy: { ordre: "asc" } }, reponses: true },
          orderBy: { createdAt: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const rolesParUtilisateur = new Map<string, string[]>();
  for (const assignation of assignations) {
    const roles = rolesParUtilisateur.get(assignation.utilisateurId) ?? [];
    roles.push(assignation.role === "CAPITAINE" ? "Capitaine" : "Intendant");
    rolesParUtilisateur.set(assignation.utilisateurId, roles);
  }

  const nombreReponsesParUtilisateur = new Map<string, number>();
  for (const question of questions) {
    for (const reponse of question.reponses) {
      nombreReponsesParUtilisateur.set(
        reponse.utilisateurId,
        (nombreReponsesParUtilisateur.get(reponse.utilisateurId) ?? 0) + 1,
      );
    }
  }
  const intendanceComplete = (utilisateurId: string) =>
    (nombreReponsesParUtilisateur.get(utilisateurId) ?? 0) >= questions.length;

  const retardataires = participants.filter(
    (p) =>
      p.statutPresence === "EN_ATTENTE" ||
      (concerneIntendanceEtCapitaine && !intendanceComplete(p.utilisateurId)),
  );

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

  const idsParticipants = new Set(participants.map((p) => p.utilisateurId));
  const utilisateursEligibles = editableInfos
    ? (
        await prisma.utilisateur.findMany({
          where: { statutInscription: "VALIDE" },
          orderBy: { nomPrenom: "asc" },
        })
      ).filter((u) => !idsParticipants.has(u.id))
    : [];

  return (
    <>
      <PageHeader title="Détail de l'événement" description={evenement.lieu} />
      <div className="flex flex-col gap-6">
        <section className="rounded-lg border border-zinc-200 bg-card-background-tableau-bord p-4 dark:border-zinc-700">
          <h2 className="font-medium">Infos générales</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {evenement.type} — {evenement.lieu}
            {evenement.programme && ` — ${evenement.programme}`}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            {editableInfos ? "Éditable par toi." : "Lecture seule."}
          </p>
          {concerneIntendanceEtCapitaine && peutDesigner && (
            <Link
              href={`/equipes/${equipeId}/gestion/evenements/${evenementId}/roles`}
              className="mt-2 inline-block text-sm font-medium underline"
            >
              Désigner capitaine / intendant
            </Link>
          )}

          {editableInfos && (
            <div className="mt-4 border-t border-zinc-200 pt-3 dark:border-zinc-700">
              {confirmerSuppressionEvenement ? (
                <div className="flex flex-col gap-2 rounded border border-red-300 bg-red-50 px-3 py-2 dark:border-red-900 dark:bg-red-950">
                  <p className="text-xs text-red-700 dark:text-red-400">
                    {`Supprimer définitivement cet événement ? ${participants.length} participant(s) et toutes les réponses associées seront perdus. Cette action est irréversible.`}
                  </p>
                  <div className="flex gap-2">
                    <form
                      action={supprimerEvenement.bind(
                        null,
                        equipeId,
                        evenementId,
                      )}
                    >
                      <button
                        type="submit"
                        className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                      >
                        Confirmer la suppression
                      </button>
                    </form>
                    <Link
                      href={`/equipes/${equipeId}/evenements/${evenementId}`}
                      className="rounded border border-zinc-300 px-3 py-1.5 text-xs font-medium dark:border-zinc-700"
                    >
                      Annuler
                    </Link>
                  </div>
                </div>
              ) : (
                <Link
                  href={`/equipes/${equipeId}/evenements/${evenementId}?confirmerSuppressionEvenement=1`}
                  className="text-sm font-medium text-red-600 hover:underline"
                >
                  Supprimer l&apos;événement
                </Link>
              )}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-zinc-200 bg-card-background-formulaires p-4 dark:border-zinc-700">
          <h2 className="font-medium">Participants</h2>
          {participants.length === 0 ? (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Aucun participant pour l&apos;instant.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {participants.map((p) => {
                const roles = rolesParUtilisateur.get(p.utilisateurId) ?? [];
                const libellePresence =
                  p.statutPresence === "CONFIRME"
                    ? "Présent"
                    : p.statutPresence === "INFIRME"
                      ? "Absent"
                      : "En attente";
                const couleurPresence =
                  p.statutPresence === "CONFIRME"
                    ? "text-green-600"
                    : p.statutPresence === "INFIRME"
                      ? "text-red-600"
                      : "text-zinc-500";
                return (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-2 text-sm"
                  >
                    <span>
                      {p.utilisateur.nomPrenom}
                      {roles.map((role) => (
                        <span
                          key={role}
                          className="ml-2 rounded border border-zinc-300 px-1.5 py-0.5 text-xs font-medium dark:border-zinc-700"
                        >
                          {role}
                        </span>
                      ))}
                    </span>
                    <span className="text-zinc-600 dark:text-zinc-400">
                      <span className={couleurPresence}>
                        {libellePresence}
                      </span>
                      {concerneIntendanceEtCapitaine && questions.length > 0 && (
                        <>
                          {" · "}
                          infos intendance{" "}
                          {intendanceComplete(p.utilisateurId)
                            ? "complétées"
                            : "à compléter"}
                        </>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          {editableInfos && (
            <div className="mt-4 border-t border-zinc-200 pt-3 dark:border-zinc-700">
              {utilisateursEligibles.length === 0 ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Tous les comptes validés participent déjà.
                </p>
              ) : (
                <form
                  action={ajouterParticipant.bind(null, equipeId, evenementId)}
                  className="flex flex-wrap items-end gap-3"
                >
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="utilisateurId"
                      className="text-sm font-medium"
                    >
                      Ajouter un participant (n&apos;importe quel membre du
                      club, pas seulement l&apos;équipe)
                    </label>
                    <select
                      id="utilisateurId"
                      name="utilisateurId"
                      required
                      className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    >
                      {utilisateursEligibles.map((utilisateur) => (
                        <option key={utilisateur.id} value={utilisateur.id}>
                          {utilisateur.nomPrenom} ({utilisateur.pseudo})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="rounded bg-accent-formulaires px-4 py-2 text-sm font-medium text-white hover:bg-accent-formulaires-dark"
                  >
                    Ajouter
                  </button>
                </form>
              )}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-zinc-200 bg-card-background-tableau-bord p-4 dark:border-zinc-700">
          <h2 className="font-medium">Confirmation de présence</h2>
          {participation ? (
            <>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Ton statut actuel :{" "}
                <span className="font-medium">
                  {participation.statutPresence === "CONFIRME" &&
                    "Présent"}
                  {participation.statutPresence === "INFIRME" && "Absent"}
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
                    className="rounded bg-accent-formulaires px-4 py-2 text-sm font-medium text-white hover:bg-accent-formulaires-dark disabled:opacity-50"
                  >
                    Présent
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
                    Absent
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

        {concerneIntendanceEtCapitaine &&
          (editableCapitaine || evenement.notesCapitaine) && (
          <section className="rounded-lg border border-zinc-200 bg-card-background-formulaires p-4 dark:border-zinc-700">
            <h2 className="font-medium">Espace capitaine</h2>

            {editableCapitaine ? (
              <form
                action={modifierNotesCapitaine.bind(null, equipeId, evenementId)}
                className="mt-3 flex flex-col gap-3"
              >
                <div className="flex flex-col gap-1">
                  <label htmlFor="notesCapitaine" className="text-sm font-medium">
                    Notes du capitaine
                  </label>
                  <textarea
                    id="notesCapitaine"
                    name="notesCapitaine"
                    rows={4}
                    placeholder="ex. composition, consignes tactiques, convocations…"
                    defaultValue={evenement.notesCapitaine ?? ""}
                    className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </div>
                <button
                  type="submit"
                  className="self-start rounded bg-accent-formulaires px-4 py-2 text-sm font-medium text-white hover:bg-accent-formulaires-dark"
                >
                  Enregistrer
                </button>
              </form>
            ) : (
              <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
                {evenement.notesCapitaine || "Aucune note pour l'instant."}
              </p>
            )}
          </section>
        )}

        {concerneIntendanceEtCapitaine &&
          (editableIntendance || questions.length > 0) && (
          <section
            id="intendance"
            className="rounded-lg border border-zinc-200 bg-card-background-formulaires p-4 dark:border-zinc-700"
          >
            <h2 className="font-medium">Espace intendance</h2>

            {editableIntendance && (
              <div className="mt-3 border-b border-zinc-200 pb-4 dark:border-zinc-700">
                <h3 className="text-sm font-medium">Ajouter une question</h3>
                <form
                  action={ajouterQuestionIntendance.bind(
                    null,
                    equipeId,
                    evenementId,
                  )}
                  className="mt-2 flex flex-col gap-2"
                >
                  <input
                    name="libelle"
                    type="text"
                    placeholder="ex. Quel est ton moyen de transport ?"
                    required
                    className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                  <textarea
                    name="optionsTexte"
                    rows={3}
                    placeholder={"Une option par ligne, ex. :\nVoiture\nTrain\nCovoiturage\n\nLaisse vide pour une question à réponse libre."}
                    className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                  <p className="text-xs text-zinc-500">
                    Avec des options, une option &quot;Autre&quot; en texte
                    libre est ajoutée automatiquement. Sans option, la
                    question devient une simple réponse libre.
                  </p>
                  <button
                    type="submit"
                    className="self-start rounded bg-accent-formulaires px-4 py-2 text-sm font-medium text-white hover:bg-accent-formulaires-dark"
                  >
                    Ajouter la question
                  </button>
                </form>
                {error === "question_invalide" && (
                  <p className="mt-2 text-sm text-red-600">
                    Merci de renseigner l&apos;intitulé de la question.
                  </p>
                )}
              </div>
            )}

            {questions.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                Aucune question d&apos;intendance pour l&apos;instant.
              </p>
            ) : (
              <>
                {editableIntendance && (
                  <ul className="mt-4 flex flex-col gap-2">
                    {questions.map((question) => {
                      const nombreReponses = question.reponses.length;
                      const enConfirmation =
                        confirmerSuppression === question.id;

                      return (
                        <li key={question.id} className="text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span>
                              {question.libelle}{" "}
                              <span className="text-zinc-500">
                                (
                                {question.options.length > 0
                                  ? question.options
                                      .map((o) => o.libelle)
                                      .join(", ")
                                  : "réponse libre"}
                                )
                              </span>
                            </span>
                            {nombreReponses === 0 || enConfirmation ? null : (
                              <Link
                                href={`/equipes/${equipeId}/evenements/${evenementId}?confirmerSuppression=${question.id}#intendance`}
                                className="rounded border border-zinc-300 px-2 py-1 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                              >
                                Retirer
                              </Link>
                            )}
                            {nombreReponses === 0 && (
                              <form
                                action={retirerQuestionIntendance.bind(
                                  null,
                                  equipeId,
                                  evenementId,
                                )}
                              >
                                <input
                                  type="hidden"
                                  name="questionId"
                                  value={question.id}
                                />
                                <button
                                  type="submit"
                                  className="rounded border border-zinc-300 px-2 py-1 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                                >
                                  Retirer
                                </button>
                              </form>
                            )}
                          </div>
                          {enConfirmation && nombreReponses > 0 && (
                            <div className="mt-2 flex items-center gap-2 rounded border border-red-300 bg-red-50 px-3 py-2 dark:border-red-900 dark:bg-red-950">
                              <p className="flex-1 text-xs text-red-700 dark:text-red-400">
                                {`${nombreReponses} joueur(s) ont déjà répondu à cette question. Les supprimer aussi ?`}
                              </p>
                              <form
                                action={retirerQuestionIntendance.bind(
                                  null,
                                  equipeId,
                                  evenementId,
                                )}
                              >
                                <input
                                  type="hidden"
                                  name="questionId"
                                  value={question.id}
                                />
                                <button
                                  type="submit"
                                  className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                                >
                                  Confirmer la suppression
                                </button>
                              </form>
                              <Link
                                href={`/equipes/${equipeId}/evenements/${evenementId}#intendance`}
                                className="rounded border border-zinc-300 px-2 py-1 text-xs font-medium dark:border-zinc-700"
                              >
                                Annuler
                              </Link>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {(editableIntendance || editableInfos) && (
                  <div className="mt-4 overflow-x-auto">
                    <h3 className="mb-2 text-sm font-medium">
                      Réponses des joueurs
                    </h3>
                    <table className="w-full min-w-max border-collapse text-sm">
                      <thead>
                        <tr>
                          <th className="border-b border-zinc-200 py-2 pr-4 text-left font-medium dark:border-zinc-700">
                            Joueur
                          </th>
                          {questions.map((question) => (
                            <th
                              key={question.id}
                              className="border-b border-zinc-200 py-2 pr-4 text-left font-medium dark:border-zinc-700"
                            >
                              {question.libelle}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {participants.map((p) => (
                          <tr key={p.id}>
                            <td className="border-b border-zinc-200 py-2 pr-4 dark:border-zinc-700">
                              {p.utilisateur.nomPrenom}
                            </td>
                            {questions.map((question) => {
                              const reponse = question.reponses.find(
                                (r) => r.utilisateurId === p.utilisateurId,
                              );
                              const option = reponse?.optionId
                                ? question.options.find(
                                    (o) => o.id === reponse.optionId,
                                  )
                                : undefined;
                              const texte =
                                option?.libelle ?? reponse?.reponseLibre;
                              return (
                                <td
                                  key={question.id}
                                  className="border-b border-zinc-200 py-2 pr-4 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
                                >
                                  {texte ?? "—"}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {participation && (
                  <form
                    action={repondreIntendance.bind(null, equipeId, evenementId)}
                    className="mt-4 flex flex-col gap-4 border-t border-zinc-200 pt-4 dark:border-zinc-700"
                  >
                    <h3 className="text-sm font-medium">Mes réponses</h3>
                    {questions.map((question) => {
                      const maReponse = question.reponses.find(
                        (r) => r.utilisateurId === user.id,
                      );
                      if (question.options.length === 0) {
                        return (
                          <div key={question.id} className="flex flex-col gap-1">
                            <label
                              htmlFor={`q${question.id}-libre`}
                              className="text-sm"
                            >
                              {question.libelle}
                            </label>
                            <input
                              type="text"
                              id={`q${question.id}-libre`}
                              name={`q_${question.id}_autre`}
                              defaultValue={maReponse?.reponseLibre ?? ""}
                              placeholder="Ta réponse…"
                              className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                            />
                          </div>
                        );
                      }

                      return (
                        <div key={question.id} className="flex flex-col gap-1">
                          <p className="text-sm">{question.libelle}</p>
                          {question.options.map((option) => (
                            <div
                              key={option.id}
                              className="flex items-center gap-2 text-sm"
                            >
                              <input
                                type="radio"
                                id={`q${question.id}-o${option.id}`}
                                name={`q_${question.id}`}
                                value={option.id}
                                defaultChecked={maReponse?.optionId === option.id}
                              />
                              <label htmlFor={`q${question.id}-o${option.id}`}>
                                {option.libelle}
                              </label>
                            </div>
                          ))}
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <input
                              type="radio"
                              className="peer"
                              id={`q${question.id}-autre`}
                              name={`q_${question.id}`}
                              value="autre"
                              defaultChecked={Boolean(maReponse?.reponseLibre)}
                            />
                            <label htmlFor={`q${question.id}-autre`}>
                              Autre :
                            </label>
                            <input
                              type="text"
                              name={`q_${question.id}_autre`}
                              defaultValue={maReponse?.reponseLibre ?? ""}
                              placeholder="Précise…"
                              className="hidden basis-full rounded border border-zinc-300 px-3 py-1.5 text-sm peer-checked:block dark:border-zinc-700 dark:bg-zinc-900"
                            />
                          </div>
                        </div>
                      );
                    })}
                    <button
                      type="submit"
                      className="self-start rounded bg-accent-formulaires px-4 py-2 text-sm font-medium text-white hover:bg-accent-formulaires-dark"
                    >
                      Enregistrer mes réponses
                    </button>
                  </form>
                )}
              </>
            )}
          </section>
        )}

        {peutRelancer && (
          <section className="rounded-lg border border-zinc-200 bg-card-background-tableau-bord p-4 dark:border-zinc-700">
            <h2 className="font-medium">Relance</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Relance les participants n&apos;ayant pas confirmé leur présence
              {concerneIntendanceEtCapitaine && " ou pas complété leurs infos d'intendance"}
              .
            </p>

            {relance !== undefined && (
              <p className="mt-3 rounded border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
                {`Email de relance envoyé à ${relance} participant(s).`}
                {relanceEchecs && relanceEchecs !== "0"
                  ? ` ${relanceEchecs} échec(s) d'envoi (voir la console serveur).`
                  : ""}
              </p>
            )}

            {retardataires.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                Aucun retardataire pour l&apos;instant.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                {retardataires.map((retardataire) => {
                  const raisons: string[] = [];
                  if (retardataire.statutPresence === "EN_ATTENTE") {
                    raisons.push("présence non confirmée");
                  }
                  if (
                    concerneIntendanceEtCapitaine &&
                    !intendanceComplete(retardataire.utilisateurId)
                  ) {
                    raisons.push("infos intendance non complétées");
                  }
                  return (
                    <li key={retardataire.id}>
                      {retardataire.utilisateur.nomPrenom} —{" "}
                      {raisons.join(", ")}
                    </li>
                  );
                })}
              </ul>
            )}
            <form
              action={relancerRetardataires.bind(null, equipeId, evenementId)}
            >
              <button
                type="submit"
                disabled={retardataires.length === 0}
                className="mt-3 rounded bg-accent-formulaires px-4 py-2 text-sm font-medium text-white hover:bg-accent-formulaires-dark disabled:opacity-50"
              >
                Relancer les retardataires
              </button>
            </form>
          </section>
        )}
      </div>
    </>
  );
}
