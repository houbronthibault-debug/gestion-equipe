import { redirect } from "next/navigation";
import Link from "next/link";

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

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <nav className="flex flex-wrap items-center gap-4 text-sm">
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
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/connexion" });
            }}
          >
            <button
              type="submit"
              className="text-sm font-medium hover:underline"
            >
              Déconnexion ({session.user.pseudo})
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
