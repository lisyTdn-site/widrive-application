# Backend Supabase, sécurité et administration

Projet Supabase : `dtlutzalxszgovqtgrzv`. Migrations dans `supabase/migrations/` (0001→0005), appliquées avec
`npx supabase db push --remote`. Après chaque changement de schéma :
`npx supabase gen types typescript --remote=dtlutzalxszgovqtgrzv --schema public > src/types/database.ts`
(garder l'en-tête de commentaire) puis `npx supabase db lint --remote` et `npx supabase db advisors --remote`.

## Modèle de sécurité
- RLS activée partout ; `anon` ne lit que les annonces publiées (colonnes publiques).
- Le client ne décide ni solde, ni montant, ni disponibilité : RPC `create_booking`, `pay_booking_wallet`,
  `cancel_booking`, `request_withdrawal` (SECURITY DEFINER, `search_path` fixé, droits `authenticated` seulement).
- Grand livre `wallet_transactions` : aucune écriture client. Les retraits sont réservés (pending) puis validés par un admin.
- Rôle admin : table `user_roles` (aucun accès client), fonction `is_admin()`. Toutes les RPC `admin_*` la vérifient
  et écrivent dans `audit_log`.
- PIN : jamais stocké. Edge Function `auth-pin` dérive `HMAC(PIN_PEPPER, phone:pin)` → mot de passe haché par Supabase Auth ;
  5 échecs = verrouillage 15 min (`auth_attempts`). Secret `PIN_PEPPER` uniquement côté Supabase (`supabase secrets`).
- `.env` (URL + clé publishable) non versionné ; la clé `service_role` n'est jamais dans le code client.

## Créer le premier administrateur
1. Dashboard Supabase > Authentication > Users > *Add user* (e-mail + mot de passe fort, « Auto Confirm »).
2. SQL Editor : `insert into public.user_roles (user_id, role) select id, 'admin' from auth.users where email = 'EMAIL_ADMIN';`
3. Activer la MFA du compte si possible.

## Application admin (`admin/`)
`cd admin && cp .env.example .env && npm install && npm run dev` ; `npm run build` produit `admin/dist/` à héberger
(Netlify, Vercel…). Ajouter l'URL d'hébergement dans Authentication > URL Configuration.

## Reste à faire (dépend d'informations client)
- Fournisseur SMS : vérification du numéro (OTP réel) + réinitialisation du PIN (`resetPin` désactivé volontairement).
- Agrégateur Mobile Money : recharge et paiement MoMo (`WALLET_TOPUP_ENABLED` dans `src/lib/wallet.ts`, webhook signé via Edge Function).
- Modules Ride, crypto, vente de véhicules (écriture) : données encore locales.
- Phone provider à activer dans Authentication > Providers (sans confirmation SMS tant que le fournisseur SMS n'est pas branché).
