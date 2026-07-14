import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Club PUC <club@club-puc.fr>";

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
