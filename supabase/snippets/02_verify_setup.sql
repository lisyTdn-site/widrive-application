-- 02 — Vérifier que la base est correctement installée (lecture seule).

-- Tables et RLS (toutes doivent avoir rls_enabled = true).
select c.relname as table, c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by 1;

-- Fonctions serveur attendues (réservations, portefeuille, admin).
select p.proname
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('create_booking','pay_booking_wallet','cancel_booking','request_withdrawal',
                    'wallet_balance','get_all_busy_slots','is_admin','admin_dashboard_stats',
                    'admin_set_booking_status','admin_set_user_blocked','admin_wallet_adjust',
                    'admin_resolve_withdrawal')
order by 1;

-- Compteurs.
select (select count(*) from auth.users)               as comptes,
       (select count(*) from public.profiles)          as profils,
       (select count(*) from public.listings)          as annonces,
       (select count(*) from public.listings where is_published) as annonces_publiees,
       (select count(*) from public.user_roles)        as admins;
