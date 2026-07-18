import { prisma } from "@/lib/prisma";
import { envoyerEmail } from "@/lib/email";
import type { JourSemaine } from "@prisma/client";

const LIBELLES_TYPE: Record<string, string> = {
  ENTRAINEMENT: "Entraînement",
  STAGE: "Stage",
  MATCH_AMICAL: "Match amical",
  CHAMPIONNAT: "Championnat",
  TOURNOI: "Tournoi",
};

const JOURS_PAR_NOM_FR: Record<string, JourSemaine> = {
  lundi: "LUNDI",
  mardi: "MARDI",
  mercredi: "MERCREDI",
  jeudi: "JEUDI",
  vendredi: "VENDREDI",
  samedi: "SAMEDI",
  dimanche: "DIMANCHE",
};

export function jourSemaineActuel(date = new Date()): JourSemaine {
  const nomJour = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "long",
  }).format(date);
  return JOURS_PAR_NOM_FR[nomJour.toLowerCase()];
}

export async function envoyerDigestsEvenements(date = new Date()) {
  const jour = jourSemaineActuel(date);

  const equipes = await prisma.equipe.findMany({
    where: { jourEnvoiMailEvenements: jour },
  });

  const depuis = new Date(date.getTime() - 7 * 24 * 3600 * 1000);
  let equipesNotifiees = 0;
  let emailsEnvoyes = 0;

  for (const equipe of equipes) {
    const evenements = await prisma.evenement.findMany({
      where: { equipeId: equipe.id, createdAt: { gte: depuis } },
      orderBy: { dateDebut: "asc" },
    });

    if (evenements.length === 0) continue;

    const membres = await prisma.appartenance.findMany({
      where: { equipeId: equipe.id },
      include: { utilisateur: true },
      distinct: ["utilisateurId"],
    });

    if (membres.length === 0) continue;

    const lignes = evenements
      .map((evenement) => {
        const lien = `${process.env.APP_URL}/equipes/${equipe.id}/evenements/${evenement.id}`;
        const dateFormatee = evenement.dateDebut.toLocaleString("fr-FR", {
          dateStyle: "medium",
          timeStyle: "short",
        });
        return `<li>${LIBELLES_TYPE[evenement.type] ?? evenement.type} — ${evenement.lieu} — ${dateFormatee} (<a href="${lien}">voir</a>)</li>`;
      })
      .join("");

    const html = `<p>Bonjour,</p><p>Voici les nouveaux événements créés cette semaine pour l'équipe ${equipe.nom} :</p><ul>${lignes}</ul>`;

    const resultats = await Promise.all(
      membres.map((membre) =>
        envoyerEmail({
          to: membre.utilisateur.mail,
          subject: `Nouveaux événements — ${equipe.nom}`,
          html,
        }),
      ),
    );

    equipesNotifiees += 1;
    emailsEnvoyes += resultats.filter((r) => r.success).length;
  }

  return { jour, equipesNotifiees, emailsEnvoyes };
}
