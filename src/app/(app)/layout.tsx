import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { auth, signOut } from "@/auth";

const NAV_ITEMS = [
  { href: "/", label: "Tableau de bord" },
  { href: "/mes-equipes", label: "Mes équipes" },
  { href: "/documents", label: "Documents du club" },
  { href: "/profil", label: "Mon profil" },
];

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  if (!session?.user) {
    redirect("/connexion");
  }

  const deconnexionAction = async () => {
    "use server";
    await signOut({ redirectTo: "/connexion" });
  };

  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <aside className="hidden w-64 shrink-0 flex-col justify-between bg-brand-black px-4 py-6 md:sticky md:top-0 md:flex md:h-screen">
        <div className="flex flex-col gap-8">
          <Link href="/" className="flex items-center gap-2 px-2">
            <Image src="/logo.png" alt="Club PUC" width={36} height={30} />
            <span className="font-semibold text-white">Club PUC</span>
          </Link>
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-brand-violet/25 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            {session.user.estAdmin && (
              <Link
                href="/admin/inscriptions"
                className="rounded px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-brand-violet/25 hover:text-white"
              >
                Back-office
              </Link>
            )}
          </nav>
        </div>
        <form action={deconnexionAction} className="px-2">
          <button
            type="submit"
            className="text-sm font-medium text-zinc-400 hover:text-white"
          >
            Déconnexion ({session.user.pseudo})
          </button>
        </form>
      </aside>

      <div className="flex flex-col border-b border-zinc-200 dark:border-zinc-800 md:hidden">
        <header className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Club PUC" width={28} height={24} />
            <span className="font-semibold">Club PUC</span>
          </Link>
          <form action={deconnexionAction}>
            <button type="submit" className="text-sm font-medium hover:underline">
              Déconnexion
            </button>
          </form>
        </header>
        <nav className="flex flex-wrap items-center gap-4 px-4 pb-3 text-sm">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="hover:underline">
              {item.label}
            </Link>
          ))}
          {session.user.estAdmin && (
            <Link href="/admin/inscriptions" className="hover:underline">
              Back-office
            </Link>
          )}
        </nav>
      </div>

      <main className="w-full flex-1 px-4 py-8 md:px-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
