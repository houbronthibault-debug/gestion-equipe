import crypto from "node:crypto";

import { redirect } from "next/navigation";

import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";
import { envoyerEmail } from "@/lib/email";

const DUREE_VALIDITE_MS = 60 * 60 * 1000; // 1 heure

async function demanderReinitialisation(formData: FormData) {
  "use server";

  const mail = String(formData.get("mail") ?? "").trim();

  if (mail) {
    const utilisateur = await prisma.utilisateur.findFirst({
      where: { mail: { equals: mail, mode: "insensitive" } },
    });

    if (utilisateur) {
      const token = crypto.randomBytes(32).toString("hex");

      await prisma.tokenReinitialisation.deleteMany({
        where: { utilisateurId: utilisateur.id },
      });
      await prisma.tokenReinitialisation.create({
        data: {
          utilisateurId: utilisateur.id,
          token,
          expiration: new Date(Date.now() + DUREE_VALIDITE_MS),
        },
      });

      const lien = `${process.env.APP_URL}/reinitialiser-mot-de-passe?token=${token}`;

      await envoyerEmail({
        to: utilisateur.mail,
        subject: "Réinitialisation de ton mot de passe",
        html: `<p>Bonjour ${utilisateur.nomPrenom},</p><p>Une demande de réinitialisation de mot de passe a été faite pour ton compte. Ce lien est valable 1 heure :</p><p><a href="${lien}">Réinitialiser mon mot de passe</a></p><p>Si tu n'es pas à l'origine de cette demande, ignore cet email.</p>`,
      });
    }
  }

  // Toujours la même redirection, que le compte existe ou non, pour ne pas
  // révéler si une adresse est enregistrée.
  redirect("/mot-de-passe-oublie?succes=1");
}

export default async function MotDePasseOubliePage({
  searchParams,
}: {
  searchParams: Promise<{ succes?: string }>;
}) {
  const { succes } = await searchParams;

  if (succes) {
    return (
      <>
        <PageHeader title="Email envoyé" />
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Si un compte existe avec cette adresse, un email vient d&apos;être
          envoyé avec un lien pour réinitialiser ton mot de passe.
        </p>
        <a
          href="/connexion"
          className="mt-4 inline-block text-sm font-medium underline"
        >
          Retour à la connexion
        </a>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Mot de passe oublié"
        description="Reçois un lien par email pour choisir un nouveau mot de passe."
      />
      <form
        action={demanderReinitialisation}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="mail" className="text-sm font-medium">
            Adresse mail
          </label>
          <input
            id="mail"
            name="mail"
            type="email"
            required
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <button
          type="submit"
          className="mt-2 rounded bg-accent-formulaires px-4 py-2 text-sm font-medium text-white hover:bg-accent-formulaires-dark"
        >
          Envoyer le lien
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
        <a href="/connexion" className="font-medium underline">
          Retour à la connexion
        </a>
      </p>
    </>
  );
}
