import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export const DOCUMENTS_BUCKET = "documents";

const STORAGE_PREFIX = "storage://";

export function estCheminStorage(fichierOuLien: string) {
  return fichierOuLien.startsWith(STORAGE_PREFIX);
}

export async function resoudreUrlDocument(fichierOuLien: string) {
  if (!estCheminStorage(fichierOuLien)) {
    return fichierOuLien;
  }

  const chemin = fichierOuLien.slice(STORAGE_PREFIX.length);
  const { data, error } = await supabaseAdmin.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(chemin, 60 * 60);

  if (error || !data) {
    return null;
  }

  return data.signedUrl;
}
