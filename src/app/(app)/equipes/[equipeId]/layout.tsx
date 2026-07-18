import Link from "next/link";

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

  // Pas de garde bloquante ici : un invité ajouté à un seul événement (sans
  // être membre de l'équipe) doit pouvoir accéder à cette page précise.
  // Chaque page (vue d'ensemble, documents, événement) vérifie elle-même le
  // droit d'accès qui lui correspond.
  const estMembre = await peutConsulterEspaceEquipe(user, equipeId);
  const peutGerer = estMembre && (await peutGererMembresEquipe(user, equipeId));

  const NAV_ITEMS = estMembre
    ? [
        { href: `/equipes/${equipeId}`, label: "Vue d'ensemble" },
        { href: `/equipes/${equipeId}/documents`, label: "Documents" },
        ...(peutGerer
          ? [{ href: `/equipes/${equipeId}/gestion`, label: "Gestion équipe" }]
          : []),
      ]
    : [];

  return (
    <div>
      {NAV_ITEMS.length > 0 && (
        <nav className="mb-6 flex gap-4 border-b border-zinc-200 pb-3 text-sm dark:border-zinc-700">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="hover:underline">
              {item.label}
            </Link>
          ))}
        </nav>
      )}
      {children}
    </div>
  );
}
