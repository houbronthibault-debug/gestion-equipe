-- CreateTable
CREATE TABLE "parametres_apparence" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "couleurFormulaires" TEXT,
    "couleurTableauBord" TEXT,
    "couleurFond" TEXT,
    "imageFond" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parametres_apparence_pkey" PRIMARY KEY ("id")
);

