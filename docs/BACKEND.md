# WIDRIVE — Inventaire des données simulées → tables Supabase

> **État** : le schéma initial existe sous forme de migration (`supabase/migrations/0001_initial_schema.sql`) mais l'application **n'est pas encore branchée** : `AuthContext`, `bookings.ts` et `wallet.ts` utilisent toujours AsyncStorage. Les §1 à 6 ci-dessous sont l'inventaire de conception ; les noms de colonnes finaux sont ceux de la migration (partie A).
> Conventions : `uuid` en clé primaire, `created_at`/`updated_at` en `timestamptz` (UTC), montants en `integer` XOF (sans décimale), RLS activée partout (voir `ARCHITECTURE.md` §8).

# A. Schéma initial (migration 0001)

## A.1 Tables

| Table | Rôle | Colonnes principales |
|---|---|---|
| `profiles` | Profil 1–1 avec `auth.users` (**aucun PIN**) | `id` (PK, FK `auth.users` cascade), `phone` (unique), `first_name`, `last_name`, `email`, `country_code`, `lang`, `created_at`, `updated_at` |
| `listings` | Véhicules à vendre, véhicules en location, logements | `id`, `owner_id` (FK `profiles`, set null), `kind` (`vehicle_sale`/`vehicle_rental`/`housing`), `title`, `description` (jsonb `{fr,en}`), `city`, `lat`, `lng`, `price` (XOF), `price_unit` (`total`/`day`/`month`), `attributes` (jsonb), `image_urls` (text[]), `is_published`, timestamps |
| `bookings` | Réservations | `id`, `ref` (unique, `WD-XXXXXX`), `user_id` (FK `profiles`), `listing_id` (FK `listings`, restrict), `title_snapshot`, `start_at`, `end_at`, `amount`, `deposit`, `paid`, `method`, `status` (`pending`/`confirmed`/`cancelled`), timestamps |
| `wallet_transactions` | Grand livre du portefeuille | `id`, `user_id` (FK `profiles`), `kind` (`in`/`out`), `amount` (> 0), `currency` (= `XOF`), `method`, `status` (`pending`/`completed`/`failed`), `label_key`, `label_text`, `label_vars`, `booking_id` (FK, set null), `idempotency_key`, timestamps |

Enums : `listing_kind`, `booking_status`, `payment_method` (`wallet`/`momo`/`cash`), `wallet_tx_kind`, `wallet_tx_status`.
Le solde n'est **pas stocké** : somme des lignes `completed` (`in` − `out`).

## A.2 Relations

```
auth.users 1─1 profiles 1─* listings (owner_id, nullable)
                     profiles 1─* bookings *─1 listings
                     profiles 1─* wallet_transactions *─0..1 bookings
```

Contraintes utiles : `end_at > start_at`, `deposit <= amount`, `paid <= amount`, **exclusion anti-chevauchement** (`bookings_no_overlap`, `btree_gist`) pour les réservations non annulées d'une même annonce, `unique(user_id, idempotency_key)` sur le ledger. Index : `listings(kind, is_published)`, `listings(owner_id)`, `bookings(user_id, created_at desc)`, `bookings(listing_id)`, `wallet_transactions(user_id, created_at desc)`, `wallet_transactions(booking_id)`.

Fonctions : `set_updated_at()` (trigger), `handle_new_user()` (crée le profil à l'inscription Auth ; exécution révoquée aux rôles client), `get_busy_slots(listing, from, to)` (créneaux occupés sans données personnelles, réservée à `authenticated`).

## A.3 Règles RLS (testées sur Postgres 17 avec un schéma `auth` simulé)

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | son profil | trigger uniquement | son profil | non (via Auth) |
| `listings` | publiées, ou les siennes | les siennes, **non publiées** | les siennes, restent non publiées | les siennes |
| `bookings` | les siennes | les siennes, `pending`, `paid = 0`, annonce publiée | **non** (RPC serveur plus tard) | non |
| `wallet_transactions` | les siennes | **non** (serveur) | **non** | **non** |

La publication d'une annonce se fait côté serveur (service role / admin). Le rôle `anon` n'a aucun accès aux tables. Les créneaux des autres utilisateurs ne sont visibles que via `get_busy_slots`.

## A.3 bis Migration 0002 — lecture publique du catalogue

`0002_listings_public_read.sql` : politique `listings_select_published_anon` + `grant select` **par colonnes** au rôle `anon` (tout sauf `owner_id`), annonces publiées uniquement. Nécessaire tant que l'app n'a pas de session Supabase. Les autres tables restent fermées à `anon` (vérifié). À retirer/resserrer quand Supabase Auth sera en place, si le catalogue doit devenir privé.

## A.3 ter Flux implémenté et couche repositories

| Module | Rôle | Branché ? |
|---|---|---|
| `src/lib/supabase.ts` | `getSupabase()` (création paresseuse), `isSupabaseConfigured` | oui |
| `src/repositories/listingRepository.ts` | `fetchPublishedListings(kind)`, `fetchListingById(id)` | **oui** (véhicules) |
| `src/repositories/profileRepository.ts` | `fetchMyProfile`, `updateMyProfile` | non (attend l'Auth) |
| `src/repositories/bookingRepository.ts` | `fetchMyBookings`, `fetchBusySlots` (RPC), `createPendingBooking` | non (TODO migration bookings) |
| `src/lib/vehicleListings.ts` | hooks `useVehicles` / `useVehicle`, mapper, repli dev | oui |

Les repositories renvoient `RepoResult<T>` (`{ok:true,data}` / `{ok:false,error}`), aucune requête dans les composants. Les attributs d'un véhicule en vente sont lus dans `listings.attributes` (jsonb) : `brand`, `model`, `year`, `km`, `fuel`, `gearbox`, `drive`, `category`, `status`, `engine`, `paint`, `interior`, `ac`, `equipment[]`, `documentKey` ; valeurs invalides → valeurs par défaut. `seed.sql` fournit 3 véhicules équivalents aux données locales.

## A.4 Variables d'environnement

| Variable | Usage | Secret ? |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | URL du projet | Non (publique) |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clé publishable (`sb_publishable_…`) | Non (protégée par la RLS) |

Fichier `.env` local (ignoré par Git) copié depuis `.env.example`. Expo inline les variables `EXPO_PUBLIC_*` au build : redémarrer avec `npx expo start -c` après modification. **Jamais** de clé `service_role` / secret dans l'app ni dans `EXPO_PUBLIC_*` ; elle ne vit que dans les Edge Functions (secrets Supabase). Pour EAS : `eas env:create` (ou secrets EAS) par environnement.

Client : `src/lib/supabase.ts` (session persistée dans AsyncStorage, `autoRefreshToken`, `persistSession`, `detectSessionInUrl: false`, erreur explicite si variables absentes). Types : `src/types/database.ts` (régénérer avec `npx supabase gen types typescript --project-id <ref> --schema public`).

## A.5 Procédure de migration

Appliquer **0001 puis 0002** (dans l'ordre).

Option 1 — CLI Supabase (recommandée, versionnée) :
```bash
npx supabase login
npx supabase link --project-ref <ref-du-projet>
npx supabase db push            # applique supabase/migrations/*.sql non encore appliquées
```
Option 2 — SQL Editor du dashboard : coller le contenu de `0001_initial_schema.sql` et l'exécuter (à réserver au développement).
Local (Docker requis) : `npx supabase start` puis `npx supabase db reset` (applique les migrations **et** `seed.sql`).

Après application : exécuter les *Security Advisors* du dashboard, vérifier que RLS est active sur les 4 tables, régénérer les types. Une migration appliquée ne se modifie jamais : toute évolution = nouveau fichier `000N_*.sql`.

## A.6 Développement vs production

| | Développement | Production |
|---|---|---|
| Projet Supabase | projet dédié ou stack locale | projet séparé |
| `.env` | valeurs du projet dev | variables EAS du profil production |
| `seed.sql` | oui (annonces fictives, `db reset`) | **jamais** |
| Auth OTP | OTP de test acceptable | SMS réel obligatoire |
| Migrations | `db push` libre | revue + `db push` depuis la CI ou une personne identifiée ; sauvegarde avant |
| Données utilisateur | jetables | sauvegardes, PITR |

Cette étape ne migre aucun écran : le PIN reste côté prototype (AsyncStorage) jusqu'à l'étape Auth, et ne sera jamais écrit dans `profiles`.

# B. Inventaire des données simulées (conception)


## 1. Données utilisateur persistées localement

| Donnée actuelle | Source | Clé / forme | Future table Supabase | Remarques |
|---|---|---|---|---|
| Comptes (nom, prénom, e-mail, pays, téléphone) | `src/auth/AuthContext.tsx` | AsyncStorage `wid_accounts_v2` : `Record<phone, Account>` | `auth.users` + `public.profiles` (`id`, `first_name`, `last_name`, `email`, `phone`, `country_code`) | Téléphone unique ; e-mail optionnel |
| **PIN** | idem (`Account.pin`) | **en clair** aujourd'hui | **Aucune colonne en clair.** Hash serveur uniquement (Edge Function / Auth), table privée non exposée par l'API | Ne jamais répliquer le PIN actuel |
| OTP | `src/app/login.tsx` | constante `123456` | Supabase Auth OTP SMS | Retirer le code en dur |
| « Se souvenir de moi » | `AuthContext` | AsyncStorage `wid_remember_v1` `{phone,country}` | Reste local (préférence d'appareil) | Pas de donnée sensible |
| Langue | `src/i18n/index.tsx` | AsyncStorage `wid_lang` | Local ; optionnel `profiles.lang` | |
| Session | `AuthContext` | `phone` en mémoire | Session Supabase (JWT) | PIN redemandé à chaque ouverture à conserver |
| Réservations | `src/lib/bookings.ts` | AsyncStorage `wid_bookings_v1` : `Booking` | `bookings` : `id`, `ref`, `user_id`, `kind` (rental/housing), `listing_id`, `title_snapshot`, `start_at`, `end_at`, `amount`, `deposit`, `paid`, `method`, `status` (pending/confirmed/cancelled), `created_at` + contrainte d'exclusion de chevauchement | `title` = snapshot ; `ms` → `timestamptz` |
| Réservations de démo (`bk_seed_1..6`) | `bookings.ts` | seed | **Non migrées** (données de test uniquement, hors prod) | |
| Solde du portefeuille | `src/lib/wallet.ts` | `balance` (seed 250 000) | `wallets` (ou vue) : solde dérivé du ledger | Jamais modifiable par le client |
| Transactions | `wallet.ts` | `Tx` : `id`, `kind in/out`, `labelKey`, `labelText`, `vars`, `amount`, `at`, `method` | `wallet_transactions` : `id`, `user_id`, `kind`, `amount`, `method`, `label_key`, `label_text`, `label_vars jsonb`, `booking_id?`, `payment_id?`, `idempotency_key`, `created_at` | Append-only |
| Transactions de démo (`tx_seed_1..7`) | `wallet.ts` | seed | Non migrées | |
| Paiements Mobile Money | `PaySheet.tsx`, `transfer.tsx` (`setTimeout`) | simulés | `payments` : `id`, `user_id`, `provider`, `operator` (mtn/moov/celtiis), `provider_ref`, `amount`, `status`, `purpose`, `raw_webhook jsonb` | Confirmation par webhook uniquement |

## 2. Données d'état local non persistées

| Donnée | Source | Future table | Remarques |
|---|---|---|---|
| Cartes virtuelles (numéro, exp., solde, gelée) | `src/app/cards/cartes.tsx` (`useState`) | `virtual_cards` (token fournisseur, 4 derniers chiffres, `balance`, `status`) | **Ne jamais stocker un PAN complet** ; dépend d'un partenaire émetteur |
| Course Ride (étapes, ETA, prix) | `src/app/ride.tsx`, `trip.tsx` (timers, params de route) | `ride_trips` : `passenger_id`, `driver_id`, `category`, `origin`, `destination`, `price`, `status`, `payment_id` | Suivi simulé 3 étapes ; solde `BALANCE` codé en dur dans `ride.tsx` à remplacer par le vrai solde |
| Soldes crypto | `src/data/holdings.ts` (`usdt/btc/eth = 0`) | `crypto_holdings` (`user_id`, `asset`, `amount`) | Périmètre légal à décider |
| Résumé cartes | `holdings.ts` (`cardsSummary`) | Dérivé de `virtual_cards` | |
| Notifications | `src/app/notifications.tsx` | `notifications` (`user_id`, `type`, `title_key`, `payload`, `read_at`) | Écran actuellement vide (état « aucune notification ») |

## 3. Catalogues statiques (`src/data`, `src/config`)

| Donnée | Source | Future table | Remarques |
|---|---|---|---|
| Véhicules à vendre | `src/data/vehicles.ts` (`Vehicle`) | `vehicles` (marque, modèle, année, prix, km, carburant, boîte, catégorie, ville, lat/lng, statut, états, équipements, `seller_id`) + `vehicle_images` | Photos vers Storage (actuellement URL Pixabay) |
| Véhicules de location | `src/data/catalog.ts` (`rentals`) | `rental_listings` (+ `rental_photos`, `owner_id`, `price_per_day`, `rating`, `reviews`) | `rating/reviews` à dériver d'une table `reviews` |
| Logements | `catalog.ts` (`apartments`) | `housing_listings` (+ `housing_photos` avec `room`, features) | |
| Chauffeurs | `catalog.ts` (`chauffeurs`) | `drivers` (`user_id`, nom, années, note, langues) | |
| Option chauffeur / jour | `catalog.ts` (`DRIVER_PER_DAY = 10000`) | `app_settings` | « à définir » |
| Numéro WhatsApp support | `catalog.ts` (`SUPPORT_WHATSAPP`) | `app_settings` | « à confirmer » |
| Cours crypto | `catalog.ts` (`coins`) | API externe ou `crypto_prices` (cache) | Pas de donnée utilisateur |
| Annonces / carrousel | `src/data/ads.ts` | `ads` (`tag/title/sub` i18n, image, `route`, période, actif) | |
| Zones et quartiers | `src/data/zones.ts` (`CALAVI`) | `zones`, `quartiers` | |
| Pays (indicatifs, longueur, devise, activé) | `src/config/countries.ts` | `countries` ou config locale | Actif : Bénin seulement |
| Opérateurs Mobile Money | `src/config/operators.ts` | `operators` (par pays) ou config | |
| Modules et statut (active/maintenance/soon) | `src/core/modules.ts` | `app_modules` (activation à distance) | Permet de couper un module sans publier |
| Annonces « Vendre » | `src/app/vendre.tsx` | Alimentera `vehicles` / `rental_listings` | À vérifier : formulaire, modération |

## 4. Tables transverses prévues

`user_roles` (client, owner, driver, admin), `reviews`, `support_tickets`, `audit_log` (actions sensibles), `push_tokens`.

## 5. Fonctions serveur prévues (RPC / Edge Functions)

`book_slot`, `cancel_booking`, `wallet_pay`, `wallet_refund`, `wallet_withdraw`, `momo_initiate`, `momo_webhook`, `set_pin` / `verify_pin` (hachage + rate limiting), `expire_pending_bookings` (cron).

## 6. Hors périmètre de la migration

Seeds de démonstration, images Pixabay, PIN locaux existants, clés AsyncStorage `wid_*` (purgées après migration).
