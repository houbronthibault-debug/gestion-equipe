import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { peutGererMembresEquipe } from "@/lib/permissions";

export default async function GestionEquipeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ equipeId: string }>;
}) {
  const { equipeId } = await params;
  const session = await auth();
  const user = session!.user;

  if (!(await peutGererMembresEquipe(user, equipeId))) {
    redirect(`/equipes/${equipeId}`);
  }

  return children;
}
