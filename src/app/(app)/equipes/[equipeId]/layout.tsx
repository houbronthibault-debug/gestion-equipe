import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { peutConsulterEspaceEquipe, peutGererMembresEquipe } from "@/lib/permissions";

export default async function EquipeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ equipeId: string }>;
}) {
  const { equipeId } = await params;
  const session = await auth();
  const user = session!.user;

  if (!(await peutConsulterEspaceEquipe(user, equipeId))) {
    redirect("/mes-equipes");
  }

  const peutGerer = await peutGererMembresEquipe(user, equipeId);

  const NAV_ITEMS = [
    { href: `/equipes/${equipeId}`, label: "Vue d'ensemble" },
    { href: `/equipes/${equipeId}/documents`, label: "Documents" },
    ...(peutGerer
      ? [{ href: `/equipes/${equipeId}/gestion`, label: "Gestion équipe" }]
      : []),
  ];

  return (
    <div>
      <nav className="mb-6 flex gap-4 border-b border-zinc-200 pb-3 text-sm dark:border-zinc-800">
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
