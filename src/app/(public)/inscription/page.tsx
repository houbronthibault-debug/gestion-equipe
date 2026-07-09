import { redirect } from "next/navigation";

import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

async function demanderInscription(formData: FormData) {
  "use server";

  const nomPrenom = String(formData.get("nomPrenom") ?? "").trim();
  const pseudo = String(formData.get("pseudo") ?? "").trim();
  const mail = String(formData.get("mail") ?? "").trim();
  const telephone = String(formData.get("telephone") ?? "").trim();
  const motDePasse = String(formData.get("motDePasse") ?? "");

  if (!nomPrenom || !pseudo || !mail || !motDePasse) {
    redirect("/inscription?error=champs_requis");
  }

  const motDePasseHash = await hashPassword(motDePasse);

  try {
    await prisma.utilisateur.create({
      data: {
        nomPrenom,
        pseudo,
        mail,
        telephone: telephone || null,
        motDePasseHash,
      },
    });
  } catch {
    redirect("/inscription?error=deja_utilise");
  }

  redirect("/inscription?succes=1");
}

export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; succes?: string }>;
}) {
  const params = await searchParams;

  if (params.succes) {
    return (
      <>
        <PageHeader title="Demande envoyée" />
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Ta demande d&apos;inscription a bien été enregistrée. Un
          administrateur doit encore la valider avant que tu puisses te
          connecter.
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
        title="Demande d'inscription"
        description="Ta demande sera examinée par un administrateur du club."
      />
      <form action={demanderInscription} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="nomPrenom" className="text-sm font-medium">
            Nom et prénom
          </label>
          <input
            id="nomPrenom"
            name="nomPrenom"
            type="text"
            required
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="pseudo" className="text-sm font-medium">
            Pseudo
          </label>
          <input
            id="pseudo"
            name="pseudo"
            type="text"
            required
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
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
        <div className="flex flex-col gap-1">
          <label htmlFor="telephone" className="text-sm font-medium">
            Téléphone (optionnel)
          </label>
          <input
            id="telephone"
            name="telephone"
            type="tel"
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="motDePasse" className="text-sm font-medium">
            Mot de passe
          </label>
          <input
            id="motDePasse"
            name="motDePasse"
            type="password"
            required
            minLength={8}
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        {params.error === "champs_requis" && (
          <p className="text-sm text-red-600">Merci de remplir tous les champs requis.</p>
        )}
        {params.error === "deja_utilise" && (
          <p className="text-sm text-red-600">
            Ce pseudo ou cette adresse mail est déjà utilisé(e).
          </p>
        )}
        <button
          type="submit"
          className="mt-2 rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900"
        >
          Envoyer la demande
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
        Déjà inscrit ?{" "}
        <a href="/connexion" className="font-medium underline">
          Se connecter
        </a>
      </p>
    </>
  );
}
