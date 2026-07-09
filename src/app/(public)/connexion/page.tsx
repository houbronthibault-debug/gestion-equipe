import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/PageHeader";
import { signIn } from "@/auth";

async function connecter(formData: FormData) {
  "use server";

  const identifiant = formData.get("identifiant");
  const motDePasse = formData.get("motDePasse");
  const callbackUrl = formData.get("callbackUrl");

  try {
    await signIn("credentials", {
      identifiant,
      motDePasse,
      redirectTo:
        typeof callbackUrl === "string" && callbackUrl ? callbackUrl : "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/connexion?error=identifiants");
    }
    throw error;
  }
}

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      <PageHeader title="Connexion" description="Accède à ton espace club." />
      <form action={connecter} className="flex flex-col gap-4">
        <input type="hidden" name="callbackUrl" value={params.callbackUrl ?? ""} />
        <div className="flex flex-col gap-1">
          <label htmlFor="identifiant" className="text-sm font-medium">
            Identifiant (mail ou pseudo)
          </label>
          <input
            id="identifiant"
            name="identifiant"
            type="text"
            required
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
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        {params.error && (
          <p className="text-sm text-red-600">
            Identifiant ou mot de passe incorrect.
          </p>
        )}
        <button
          type="submit"
          className="mt-2 rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900"
        >
          Se connecter
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
        Pas encore de compte ?{" "}
        <a href="/inscription" className="font-medium underline">
          Demander une inscription
        </a>
      </p>
    </>
  );
}
