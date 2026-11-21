-- WIDRIVE — 0008 : droits du rôle "authenticated" (utilisateurs connectés de l'app et admins).
-- Contexte : sur les projets récents, Supabase n'accorde plus automatiquement de droits aux tables créées
-- par migration. Les migrations 0001-0003 supposaient ces droits par défaut puis en retiraient certains ;
-- résultat : "permission denied" (403) pour tout utilisateur connecté.
-- On redonne EXACTEMENT ce que le modèle de sécurité prévoit ; la RLS (politiques) reste le garde-fou.
-- Idempotent : peut être relancé sans risque.

grant usage on schema public to authenticated;

-- Profils : lecture de son profil (RLS) ; modification limitée à certaines colonnes (jamais le téléphone).
grant select on public.profiles to authenticated;
grant update (first_name, last_name, email, lang, country_code) on public.profiles to authenticated;

-- Annonces : lecture des publiées ou des siennes ; création/modification/suppression des siennes (RLS),
-- et accès complet pour les admins via la politique listings_admin_all.
grant select, insert, update, delete on public.listings to authenticated;

-- Réservations et portefeuille : lecture seule (les écritures passent par les RPC sécurisées).
grant select on public.bookings to authenticated;
grant select on public.wallet_transactions to authenticated;

-- Journal d'audit : lecture (politique réservée aux admins).
grant select on public.audit_log to authenticated;
