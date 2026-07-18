-- CreateEnum
CREATE TYPE "JourSemaine" AS ENUM ('LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE');

-- AlterTable
ALTER TABLE "equipes" ADD COLUMN     "jourEnvoiMailEvenements" "JourSemaine";

