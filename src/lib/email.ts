import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Tant qu'aucun domaine n'est vérifié dans Resend, seul cet expéditeur est
// autorisé, et uniquement vers l'adresse du compte Resend (mode test).
const FROM = "Gestion Équipe <onboarding@resend.dev>";

export async function envoyerEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });

  if (error) {
    console.error(`[email] Échec d'envoi à ${to} :`, error);
  }

  return { success: !error };
}
