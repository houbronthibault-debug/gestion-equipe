import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/connexion",
  },
  providers: [
    Credentials({
      credentials: {
        identifiant: { label: "Identifiant", type: "text" },
        motDePasse: { label: "Mot de passe", type: "password" },
      },
      authorize: async (credentials) => {
        const identifiant = credentials?.identifiant;
        const motDePasse = credentials?.motDePasse;

        if (typeof identifiant !== "string" || typeof motDePasse !== "string") {
          return null;
        }

        const identifiantNormalise = identifiant.trim();

        const utilisateur = await prisma.utilisateur.findFirst({
          where: {
            OR: [
              { mail: { equals: identifiantNormalise, mode: "insensitive" } },
              { pseudo: { equals: identifiantNormalise, mode: "insensitive" } },
            ],
          },
        });

        if (!utilisateur || utilisateur.statutInscription !== "VALIDE") {
          return null;
        }

        const motDePasseValide = await verifyPassword(
          motDePasse,
          utilisateur.motDePasseHash,
        );

        if (!motDePasseValide) {
          return null;
        }

        return {
          id: utilisateur.id,
          name: utilisateur.nomPrenom,
          email: utilisateur.mail,
          pseudo: utilisateur.pseudo,
          estAdmin: utilisateur.estAdmin,
          estMembreBureau: utilisateur.estMembreBureau,
        };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.pseudo = user.pseudo;
        token.estAdmin = user.estAdmin;
        token.estMembreBureau = user.estMembreBureau;
      }
      return token;
    },
    session: ({ session, token }) => {
      session.user.id = token.id as string;
      session.user.pseudo = token.pseudo as string;
      session.user.estAdmin = token.estAdmin as boolean;
      session.user.estMembreBureau = token.estMembreBureau as boolean;
      return session;
    },
  },
});
