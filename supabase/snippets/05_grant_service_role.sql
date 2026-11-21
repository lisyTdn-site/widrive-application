-- 05 — Copie de la migration 0007 : à coller dans Supabase > SQL Editor (Run) pour débloquer le backend immédiatement.
-- WIDRIVE — 0007 : droits du rôle serveur (service_role) sur le schéma public.
-- Contexte : sur les projets récents, Supabase n'accorde plus automatiquement ces droits aux tables
-- créées par migration ; le backend Express et l'Edge Function auth-pin (clé secrète) recevaient
-- "permission denied" (HTTP 403). service_role contourne déjà la RLS : seuls les GRANT manquaient.
-- Idempotent : peut être relancé sans risque.

grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- Tables, séquences et fonctions créées dans le futur.
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;
