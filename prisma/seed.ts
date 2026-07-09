import { PrismaClient } from "@prisma/client";

import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

async function main() {
  const mail = process.env.ADMIN_EMAIL;
  const pseudo = process.env.ADMIN_PSEUDO;
  const nomPrenom = process.env.ADMIN_NOM;
  const motDePasse = process.env.ADMIN_PASSWORD;

  if (!mail || !pseudo || !nomPrenom || !motDePasse) {
    throw new Error(
      "Définis ADMIN_EMAIL, ADMIN_PSEUDO, ADMIN_NOM et ADMIN_PASSWORD dans .env avant de lancer le seed.",
    );
  }

  const motDePasseHash = await hashPassword(motDePasse);

  const admin = await prisma.utilisateur.upsert({
    where: { mail },
    update: {
      estAdmin: true,
      statutInscription: "VALIDE",
    },
    create: {
      mail,
      pseudo,
      nomPrenom,
      motDePasseHash,
      estAdmin: true,
      statutInscription: "VALIDE",
    },
  });

  console.log(`Compte admin prêt : ${admin.mail} (${admin.pseudo})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
