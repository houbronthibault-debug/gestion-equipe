import type { Session } from "next-auth";

import { prisma } from "@/lib/prisma";

type Utilisateur = Session["user"];

// L'administrateur peut toujours agir à la place de n'importe quel rôle (§2).

async function estCoachEquipe(user: Utilisateur, equipeId: string) {
  if (user.estAdmin) return true;
  const appartenance = await prisma.appartenance.findFirst({
    where: { utilisateurId: user.id, equipeId, role: "COACH" },
  });
  return appartenance !== null;
}

async function estMembreEquipe(user: Utilisateur, equipeId: string) {
  if (user.estAdmin) return true;
  const appartenance = await prisma.appartenance.findFirst({
    where: { utilisateurId: user.id, equipeId },
  });
  return appartenance !== null;
}

async function estCapitaineEvenement(user: Utilisateur, evenementId: string) {
  if (user.estAdmin) return true;
  const assignation = await prisma.assignationEvenement.findFirst({
    where: { utilisateurId: user.id, evenementId, role: "CAPITAINE" },
  });
  return assignation !== null;
}

async function estIntendantEvenement(user: Utilisateur, evenementId: string) {
  if (user.estAdmin) return true;
  const assignation = await prisma.assignationEvenement.findFirst({
    where: { utilisateurId: user.id, evenementId, role: "INTENDANT" },
  });
  return assignation !== null;
}

async function estCoachDeLequipeOrganisatrice(
  user: Utilisateur,
  evenementId: string,
) {
  if (user.estAdmin) return true;
  const evenement = await prisma.evenement.findUnique({
    where: { id: evenementId },
    select: { equipeId: true },
  });
  if (!evenement) return false;
  return estCoachEquipe(user, evenement.equipeId);
}

// --- Règles de permission (§4) ---------------------------------------------

export function peutConsulterEspaceEquipe(user: Utilisateur, equipeId: string) {
  return estMembreEquipe(user, equipeId);
}

export function peutGererMembresEquipe(user: Utilisateur, equipeId: string) {
  return estCoachEquipe(user, equipeId);
}

export function peutCreerEvenement(user: Utilisateur, equipeId: string) {
  return estCoachEquipe(user, equipeId);
}

export function peutModifierEvenement(user: Utilisateur, equipeId: string) {
  return estCoachEquipe(user, equipeId);
}

export function peutDesignerRoles(user: Utilisateur, equipeId: string) {
  return estCoachEquipe(user, equipeId);
}

export function peutEditerEspaceCapitaine(
  user: Utilisateur,
  evenementId: string,
) {
  return estCapitaineEvenement(user, evenementId);
}

export function peutEditerIntendance(user: Utilisateur, evenementId: string) {
  return estIntendantEvenement(user, evenementId);
}

export function peutConfirmerPresence(
  user: Utilisateur,
  utilisateurCibleId: string,
) {
  return user.estAdmin || user.id === utilisateurCibleId;
}

export async function peutDeclencherRelance(
  user: Utilisateur,
  evenementId: string,
) {
  if (user.estAdmin) return true;
  const [coach, intendant] = await Promise.all([
    estCoachDeLequipeOrganisatrice(user, evenementId),
    estIntendantEvenement(user, evenementId),
  ]);
  return coach || intendant;
}

export function peutValiderInscription(user: Utilisateur) {
  return user.estAdmin;
}

export function peutDeposerDocumentEquipe(
  user: Utilisateur,
  equipeId: string,
) {
  return estCoachEquipe(user, equipeId);
}

export async function peutDeposerDocumentClub(user: Utilisateur) {
  if (user.estAdmin || user.estMembreBureau) return true;
  const appartenanceCoach = await prisma.appartenance.findFirst({
    where: { utilisateurId: user.id, role: "COACH" },
  });
  return appartenanceCoach !== null;
}

export function peutConsulterDocumentsClub() {
  // Tous les membres connectés du club.
  return true;
}

export function peutConsulterDocumentsEquipe(
  user: Utilisateur,
  equipeId: string,
) {
  return estMembreEquipe(user, equipeId);
}
