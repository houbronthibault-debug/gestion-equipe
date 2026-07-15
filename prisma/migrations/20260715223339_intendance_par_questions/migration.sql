-- AlterTable
ALTER TABLE "evenements" DROP COLUMN "couchage",
DROP COLUMN "reglement",
DROP COLUMN "repas",
DROP COLUMN "trajet";

-- AlterTable
ALTER TABLE "participations" DROP COLUMN "infosIntendanceOk";

-- CreateTable
CREATE TABLE "questions_intendance" (
    "id" TEXT NOT NULL,
    "evenementId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_intendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "options_intendance" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "options_intendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reponses_intendance" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "optionId" TEXT,
    "reponseLibre" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reponses_intendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reponses_intendance_questionId_utilisateurId_key" ON "reponses_intendance"("questionId", "utilisateurId");

-- AddForeignKey
ALTER TABLE "questions_intendance" ADD CONSTRAINT "questions_intendance_evenementId_fkey" FOREIGN KEY ("evenementId") REFERENCES "evenements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "options_intendance" ADD CONSTRAINT "options_intendance_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions_intendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reponses_intendance" ADD CONSTRAINT "reponses_intendance_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions_intendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reponses_intendance" ADD CONSTRAINT "reponses_intendance_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reponses_intendance" ADD CONSTRAINT "reponses_intendance_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "options_intendance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

