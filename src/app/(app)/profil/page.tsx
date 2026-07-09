import { PageHeader } from "@/components/PageHeader";
import { auth } from "@/auth";

export default async function ProfilPage() {
  const session = await auth();

  return (
    <>
      <PageHeader title="Mon profil" />
      <dl className="grid max-w-md gap-3 text-sm">
        <div className="flex justify-between border-b border-zinc-200 pb-2 dark:border-zinc-800">
          <dt className="text-zinc-600 dark:text-zinc-400">Nom</dt>
          <dd>{session?.user.name}</dd>
        </div>
        <div className="flex justify-between border-b border-zinc-200 pb-2 dark:border-zinc-800">
          <dt className="text-zinc-600 dark:text-zinc-400">Pseudo</dt>
          <dd>{session?.user.pseudo}</dd>
        </div>
        <div className="flex justify-between border-b border-zinc-200 pb-2 dark:border-zinc-800">
          <dt className="text-zinc-600 dark:text-zinc-400">Mail</dt>
          <dd>{session?.user.email}</dd>
        </div>
      </dl>
    </>
  );
}
