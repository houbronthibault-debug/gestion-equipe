import { redirect } from "next/navigation";

import { PageHeader } from "@/components/PageHeader";
import { PasswordInput } from "@/components/PasswordInput";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

async function reinitialiserMotDePasse(formData: FormData) {
  "use server";

  const token = String(formData.get("token") ?? "");
  const motDePasse = String(formData.get("motDePasse") ?? "");
  const motDePasseConfirmation = String(
    formData.get("motDePasseConfirmation") ?? "",
  );

  if (!motDePasse || motDePasse.length < 8) {
    redirect(
      `/reinitialiser-mot-de-passe?token=${token}&error=mot_de_passe_trop_court`,
    );
  }

  if (motDePasse !== motDePasseConfirmation) {
    redirect(
      `/reinitialiser-mot-de-passe?token=${token}&error=confirmation_differente`,
    );
  }

  const tokenReinitialisation = await prisma.tokenReinitialisation.findUnique(
    { where: { token } },
  );

  if (
    !tokenReinitialisation ||
    tokenReinitialisation.expiration < new Date()
  ) {
    redirect("/reinitialiser-mot-de-passe?error=lien_invalide");
  }

  const motDePasseHash = await hashPassword(motDePasse);

  await prisma.utilisateur.update({
    where: { id: tokenReinitialisation.utilisateurId },
    data: { motDePasseHash },
  });

  await prisma.tokenReinitialisation.deleteMany({
    where: { utilisateurId: tokenReinitialisation.utilisateurId },
  });

  redirect("/connexion?motDePasseReinitialise=1");
}

export default async function ReinitialiserMotDePassePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  if (error === "lien_invalide" || !token) {
    return (
      <>
        <PageHeader title="Lien expiré ou invalide" />
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Ce lien de réinitialisation n&apos;est plus valable (il expire
          après 1 heure, ou a déjà été utilisé).
        </p>
        <a
          href="/mot-de-passe-oublie"
          className="mt-4 inline-block text-sm font-medium underline"
        >
          Redemander un lien
        </a>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Choisir un nouveau mot de passe"
        description="Ce lien est valable 1 heure et à usage unique."
      />
      <form
        action={reinitialiserMotDePasse}
        className="flex flex-col gap-4"
      >
        <input type="hidden" name="token" value={token} />
        <div className="flex flex-col gap-1">
          <label htmlFor="motDePasse" className="text-sm font-medium">
            Nouveau mot de passe
          </label>
          <PasswordInput
            id="motDePasse"
            name="motDePasse"
            required
            minLength={8}
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="motDePasseConfirmation"
            className="text-sm font-medium"
          >
            Confirmer le mot de passe
          </label>
          <PasswordInput
            id="motDePasseConfirmation"
            name="motDePasseConfirmation"
            required
            minLength={8}
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        {error === "mot_de_passe_trop_court" && (
          <p className="text-sm text-red-600">
            Le mot de passe doit faire au moins 8 caractères.
          </p>
        )}
        {error === "confirmation_differente" && (
          <p className="text-sm text-red-600">
            Les deux mots de passe ne correspondent pas.
          </p>
        )}
        <button
          type="submit"
          className="mt-2 rounded bg-brand-violet px-4 py-2 text-sm font-medium text-white hover:bg-brand-violet-dark"
        >
          Réinitialiser mon mot de passe
        </button>
      </form>
    </>
  );
}
