import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export const DOCUMENTS_BUCKET = "documents";
export const ASSETS_PUBLICS_BUCKET = "assets-publics";

const STORAGE_PREFIX = "storage://";

export async function uploaderAssetPublic(chemin: string, fichier: File) {
  await supabaseAdmin.storage
    .createBucket(ASSETS_PUBLICS_BUCKET, { public: true })
    .catch(() => {});

  const { error } = await supabaseAdmin.storage
    .from(ASSETS_PUBLICS_BUCKET)
    .upload(chemin, fichier, { contentType: fichier.type || undefined, upsert: true });

  if (error) {
    return null;
  }

  const { data } = supabaseAdmin.storage
    .from(ASSETS_PUBLICS_BUCKET)
    .getPublicUrl(chemin);

  return data.publicUrl;
}

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
