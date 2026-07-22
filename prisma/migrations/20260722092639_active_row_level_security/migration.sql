-- Active Row Level Security sur toutes les tables du schéma public.
-- L'application se connecte avec le rôle "postgres" (rolbypassrls = true),
-- donc ceci n'a aucun impact sur Prisma / l'app Next.js : ça ferme
-- uniquement l'accès public via l'API REST auto-générée de Supabase
-- (rôles "anon"/"authenticated"), qui n'est utilisée nulle part dans le
-- site (aucune clé anon n'est même présente dans le projet).
ALTER TABLE "public"."utilisateurs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tokens_reinitialisation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."equipes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."appartenances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."evenements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."assignations_evenement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."participations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."questions_intendance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."options_intendance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reponses_intendance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."parametres_apparence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
