import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "@/auth";

const NAV_ITEMS = [
  { href: "/admin/inscriptions", label: "Validation des inscriptions" },
  { href: "/admin/roles", label: "Gestion des rôles" },
  { href: "/admin/equipes", label: "Gestion des équipes" },
  { href: "/admin/utilisateurs", label: "Gestion des utilisateurs" },
  { href: "/admin/apparence", label: "Apparence" },
];

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  if (!session?.user.estAdmin) {
    redirect("/");
  }

  return (
    <div>
      <nav className="mb-6 flex flex-wrap gap-4 border-b border-zinc-200 pb-3 text-sm dark:border-zinc-700">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className="hover:underline">
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
