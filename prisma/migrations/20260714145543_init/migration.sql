-- CreateEnum
CREATE TYPE "StatutInscription" AS ENUM ('EN_ATTENTE', 'VALIDE', 'REFUSE');

-- CreateEnum
CREATE TYPE "RoleEquipe" AS ENUM ('COACH', 'JOUEUR');

-- CreateEnum
CREATE TYPE "TypeEvenement" AS ENUM ('ENTRAINEMENT', 'STAGE', 'MATCH_AMICAL', 'CHAMPIONNAT', 'TOURNOI');

-- CreateEnum
CREATE TYPE "RoleEvenement" AS ENUM ('CAPITAINE', 'INTENDANT');

-- CreateEnum
CREATE TYPE "StatutPresence" AS ENUM ('EN_ATTENTE', 'CONFIRME', 'INFIRME');

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" TEXT NOT NULL,
    "nomPrenom" TEXT NOT NULL,
    "pseudo" TEXT NOT NULL,
    "mail" TEXT NOT NULL,
    "telephone" TEXT,
    "motDePasseHash" TEXT NOT NULL,
    "estAdmin" BOOLEAN NOT NULL DEFAULT false,
    "estMembreBureau" BOOLEAN NOT NULL DEFAULT false,
    "statutInscription" "StatutInscription" NOT NULL DEFAULT 'EN_ATTENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipes" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "equipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appartenances" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "equipeId" TEXT NOT NULL,
    "role" "RoleEquipe" NOT NULL,

    CONSTRAINT "appartenances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evenements" (
    "id" TEXT NOT NULL,
    "equipeId" TEXT NOT NULL,
    "type" "TypeEvenement" NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "lieu" TEXT NOT NULL,
    "duree" TEXT,
    "programme" TEXT,
    "objectif" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evenements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignations_evenement" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "evenementId" TEXT NOT NULL,
    "role" "RoleEvenement" NOT NULL,

    CONSTRAINT "assignations_evenement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participations" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "evenementId" TEXT NOT NULL,
    "statutPresence" "StatutPresence" NOT NULL DEFAULT 'EN_ATTENTE',
    "infosIntendanceOk" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "participations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "equipeId" TEXT,
    "visibleClub" BOOLEAN NOT NULL DEFAULT false,
    "deposeParId" TEXT NOT NULL,
    "fichierOuLien" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_pseudo_key" ON "utilisateurs"("pseudo");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_mail_key" ON "utilisateurs"("mail");

-- CreateIndex
CREATE UNIQUE INDEX "equipes_nom_key" ON "equipes"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "appartenances_utilisateurId_equipeId_role_key" ON "appartenances"("utilisateurId", "equipeId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "assignations_evenement_utilisateurId_evenementId_role_key" ON "assignations_evenement"("utilisateurId", "evenementId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "participations_utilisateurId_evenementId_key" ON "participations"("utilisateurId", "evenementId");

-- AddForeignKey
ALTER TABLE "appartenances" ADD CONSTRAINT "appartenances_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appartenances" ADD CONSTRAINT "appartenances_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "equipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evenements" ADD CONSTRAINT "evenements_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "equipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignations_evenement" ADD CONSTRAINT "assignations_evenement_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignations_evenement" ADD CONSTRAINT "assignations_evenement_evenementId_fkey" FOREIGN KEY ("evenementId") REFERENCES "evenements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participations" ADD CONSTRAINT "participations_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participations" ADD CONSTRAINT "participations_evenementId_fkey" FOREIGN KEY ("evenementId") REFERENCES "evenements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "equipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_deposeParId_fkey" FOREIGN KEY ("deposeParId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
