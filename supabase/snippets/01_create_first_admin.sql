-- 01 — Donner le rôle administrateur à un compte existant.
-- Prérequis : le compte existe (Supabase > Authentication > Users > Add user, "Auto Confirm User" coché).
-- À exécuter dans Supabase > SQL Editor. Remplacer l'e-mail.
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'EMAIL_ADMIN'
on conflict do nothing;

-- Vérification : doit lister l'admin.
select u.email, r.role, r.created_at
from public.user_roles r join auth.users u on u.id = r.user_id;

-- Retirer le rôle admin (si besoin) :
-- delete from public.user_roles where user_id = (select id from auth.users where email = 'EMAIL_ADMIN');
