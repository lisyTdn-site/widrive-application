-- 03 — Aides pour les TESTS uniquement (ne jamais exécuter sur de vraies données clients).
-- À lancer dans Supabase > SQL Editor.

-- A. Créditer le portefeuille d'un compte de test (équivaut à "Ajuster solde" dans l'admin).
--    Remplacer le numéro (format sans +, tel qu'affiché dans la table profiles) et le montant.
insert into public.wallet_transactions (user_id, kind, amount, method, status, label_key, label_text)
select id, 'in', 100000, null, 'completed', 'wallet.admin_adjust', 'Crédit de test'
from public.profiles where phone = '22900000000';

-- B. Supprimer un compte de test (profil, réservations liées en cascade selon les contraintes).
--    Plus simple : Authentication > Users > ⋯ > Delete user.
-- delete from auth.users where phone = '22900000000';

-- C. Débloquer un compte verrouillé après 5 PIN erronés (15 min).
-- delete from public.auth_attempts where phone = '+22900000000';

-- D. Publier toutes les annonces en brouillon (démo uniquement).
-- update public.listings set is_published = true where not is_published;
