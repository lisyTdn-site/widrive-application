# WIDRIVE — Architecture

## 1. Architecture actuelle (prototype local)

```
src/app/_layout.tsx
  └─ I18nProvider (langue dans AsyncStorage `wid_lang`)
      └─ AuthProvider (comptes dans AsyncStorage `wid_accounts_v2`)
          └─ Guard : redirige vers /welcome si pas de `phone` (hors /welcome et /login)
              └─ Stack Expo Router → écrans
```

- **Auth** (`src/auth/AuthContext.tsx`) : `accounts: Record<phone, {firstName,lastName,email,country,pin}>` en AsyncStorage. `login` compare le PIN en clair. Session = `phone` en mémoire seulement. `remembered` (`wid_remember_v1`) conserve téléphone + pays.
- **Store générique** (`src/lib/store.ts`) : `createStore(key, initial)` — valeur en mémoire, hydratée depuis AsyncStorage, persistée à chaque `set`, observable via `useSyncExternalStore` (`useStore`). Surface : `get / set / subscribe / hydrated`.
- **Réservations** (`src/lib/bookings.ts`) : store `wid_bookings_v1` (6 réservations de démo), `createBooking`, `confirmBooking`, `cancelBooking`, `isRangeBusy`/`isHourBusy`/`isDayBusy`.
- **Portefeuille** (`src/lib/wallet.ts`) : store `wid_wallet_v1` (solde 250 000 XOF de démo), `deposit`, `withdraw`, `chargeWallet`, `refundWallet`.
- **Données** (`src/data/*`, `src/config/*`) : catalogues statiques (véhicules, locations, logements, chauffeurs, cours crypto, pubs, zones).
- **Modules** (`src/core/*`) : registre `modules.ts` + `ModuleGate` (actif / maintenance / bientôt).
- Les stores ne sont **pas liés à l'utilisateur** : toutes les personnes se connectant sur un appareil partagent le même solde et les mêmes réservations.

## 2. Architecture cible avec Supabase

```
App (Expo, clé publishable uniquement)
  ├─ src/lib/supabase.ts          client unique (AsyncStorage pour la session, url-polyfill)
  ├─ src/auth/                    AuthContext → Supabase Auth (même API publique)
  ├─ src/lib/<domaine>/           repositories (bookings, wallet, catalog…) → PostgREST / RPC
  └─ src/app/                     écrans inchangés (consomment les mêmes hooks)

Supabase
  ├─ Auth            téléphone + OTP SMS, sessions JWT
  ├─ Postgres + RLS  profils, catalogues, réservations, ledger
  ├─ RPC SECURITY DEFINER   book_slot, wallet_pay, wallet_refund, cancel_booking
  ├─ Edge Functions  initiation paiement MoMo, webhooks, hachage PIN, notifications
  ├─ Storage         photos véhicules/logements
  └─ Realtime        disponibilité des créneaux, courses Ride
```

Principe : **le client ne décide jamais d'un solde, d'un paiement confirmé ni de la disponibilité d'un créneau.** Il demande, le serveur valide.

## 3. Responsabilités des dossiers

| Dossier | Responsabilité | Interdit |
|---|---|---|
| `src/app` | Routes Expo Router, composition d'écrans, état local d'UI | Logique métier, accès direct Supabase/AsyncStorage |
| `src/auth` | Contexte d'authentification, session, garde de routes | Stockage du PIN, logique non liée à l'identité |
| `src/lib` | Logique métier et accès aux données (stores, repositories, formatage, dates) ; futur `supabase.ts` | Composants UI |
| `src/data` | Données statiques de démo/référence (jusqu'à migration vers la base) | Données utilisateur |
| `src/components` | Composants UI réutilisables (`PaySheet`, calendriers, cartes…) | Appels réseau directs |
| `src/core` | Registre des modules et leur activation (`modules.ts`, `ModuleGate`) | Logique d'un module précis |
| `src/config`, `src/i18n`, `src/theme` | Pays/opérateurs, traductions FR/EN, design tokens | — |

## 4. Flux d'authentification

**Actuel** : formulaire → OTP local (`123456`) → `register` écrit `{…, pin}` dans AsyncStorage → retour login → `login` compare `pin` → `phone` en mémoire → `Guard` laisse passer.

**Cible** :
1. `register` : téléphone → Supabase envoie un OTP SMS → `verifyOtp` crée l'utilisateur `auth.users`.
2. Le PIN est envoyé via TLS à une Edge Function (ou fixé comme secret Supabase Auth) qui le **hache** (argon2/bcrypt) ; jamais stocké ni journalisé en clair. Rate limiting + verrouillage.
3. `login` : téléphone + PIN → session JWT (refresh token dans AsyncStorage, c'est un jeton, pas un secret rejouable de façon permanente). Le comportement « PIN redemandé à chaque ouverture » est conservé (session non restaurée automatiquement, ou déverrouillage par PIN local sans le stocker).
4. `resetPin` : OTP SMS puis nouveau PIN haché côté serveur.
5. `profiles` (1–1 avec `auth.users`) remplace `Account` hors secrets.
6. `Guard` dans `_layout.tsx` inchangé : il lit `phone` / `ready` fournis par `useAuth`.

### 4.1 Décision d'authentification : option C retenue (voir docs/DEPLOY_ADMIN.md) — section historique ci-dessous

L'interface actuelle impose **téléphone + PIN à 4 chiffres** (inscription, connexion, PIN oublié, OTP). Supabase Auth ne propose pas ce flux :

| Option | Fonctionnement Supabase | Écart avec l'UI actuelle | Risque |
|---|---|---|---|
| A. OTP SMS seul (passwordless) | `signInWithOtp({ phone })` puis `verifyOtp` ; session JWT | Le PIN disparaît (ou devient un simple déverrouillage local, jamais envoyé ni stocké en clair) | Nécessite un fournisseur SMS (Twilio, etc.) et son coût |
| B. Téléphone + mot de passe | `signUp/signInWithPassword({ phone, password })` ; le PIN serait le « mot de passe » | 4 chiffres = 10 000 combinaisons, sous le minimum de longueur de Supabase Auth (réglable mais faible) | Sécurité insuffisante sans rate limiting strict et hachage lent côté serveur |
| C. Auth maison PIN (Edge Function + hash argon2) | Edge Function qui émet une session | Fidèle à l'UI | Plus de code sécurité à maintenir soi-même ; à n'adopter qu'avec revue sécurité |

Un PIN « simulé » côté serveur ou une table de PIN seraient une solution de sécurité approximative : **non implémentés**. `AuthContext.tsx`, `login.tsx` et `welcome.tsx` sont donc **inchangés** (auth locale AsyncStorage, routes publiques intactes). Questions à trancher (aussi dans `SPEC.md` §7.1) :
1. Option A, B ou C ? Le PIN doit-il subsister, et sous quelle forme ?
2. Fournisseur SMS et pays couverts ?
3. Quelle expérience de « PIN redemandé à chaque ouverture » conserver ?

Prêt pour la suite dès la décision : `profileRepository.ts` (lecture/mise à jour du profil, créé par le trigger `handle_new_user`), client Supabase avec persistance de session et rafraîchissement du jeton. Transition prévue : drapeau `EXPO_PUBLIC_AUTH_BACKEND=local|supabase` dans `AuthContext`, ancien écran conservé tant que `local`.

### 4.2 Flux réellement implémenté (tranche « véhicules »)

```
src/app/vehicules.tsx ─ useVehicles() ─┐
src/app/vehicule/[id].tsx ─ useVehicle(id) ─┤  src/lib/vehicleListings.ts
                                            │   ├─ mapper ListingRow → Vehicle (attributs validés)
                                            │   └─ repli local __DEV__ uniquement
                                            ▼
                         src/repositories/listingRepository.ts ─ getSupabase() (src/lib/supabase.ts)
                                            ▼
                         Supabase `listings` (kind = vehicle_sale, is_published) via rôle `anon`
```

- **Sans session Supabase** (auth locale) les requêtes passent par le rôle `anon` : la migration `0002_listings_public_read.sql` autorise la lecture des annonces publiées, colonnes publiques seulement (pas `owner_id`).
- **États** : chargement (spinner), erreur (message + « Réessayer »), vide (message existant).
- **Sources** : voir tableau dans l'en-tête de `src/lib/vehicleListings.ts`. En production, jamais de repli silencieux vers `src/data/vehicles.ts`.
- Le rendu des cartes et de la fiche est inchangé. Le détail lit aussi Supabase (sinon les ids UUID ne seraient plus résolus) ; images : `image_urls[0]`, sinon image locale par défaut.
- Création paresseuse du client : sans variables d'environnement l'app démarre normalement ; l'erreur explicite est levée à l'usage.

## 5. Flux de réservation

**Actuel** : fiche → calendrier lit `useBookings()` → `isRangeBusy` côté client → `PaySheet` → `createBooking` + `confirmBooking` locaux → créneau bloqué. Annulation : `cancelBooking` + `refundWallet`.

**Cible** :
1. Le calendrier lit les créneaux occupés d'une annonce (vue publique sans données personnelles).
2. `book_slot(listing, start, end)` (RPC) crée la réservation `pending` ; la contrainte `EXCLUDE USING gist (listing_id WITH =, tstzrange(start_at,end_at) WITH &&) WHERE (status <> 'cancelled')` empêche toute double réservation.
3. Paiement : portefeuille (`wallet_pay` atomique, lié à la réservation) ou MoMo (Edge Function + webhook) → passage à `confirmed` côté serveur uniquement.
4. Annulation : `cancel_booking` applique la politique et crée l'écriture de remboursement.
5. Expiration automatique des `pending` non payées (job `pg_cron`).

## 6. Flux portefeuille

**Actuel** : `deposit`/`withdraw`/`chargeWallet`/`refundWallet` modifient `balance` et empilent des `Tx` dans le store local ; `setTimeout` simule l'opérateur.

**Cible** :
- Table `wallet_transactions` **append-only** (montant signé, type, méthode, référence externe, `idempotency_key`) ; solde = somme (vue ou colonne maintenue par trigger/RPC). Aucun `UPDATE/DELETE`.
- Recharge : Edge Function initie le paiement MoMo → webhook signé → écriture `in` confirmée.
- Retrait : RPC vérifie solde (verrou de ligne), crée écriture `out` `pending`, déclenche le décaissement, confirme par webhook.
- Paiement/remboursement de réservation : RPC atomiques, dans la même transaction que le changement de statut de réservation.
- `labelKey`/`vars` conservés pour l'i18n de l'historique.

## 7. Stratégie de migration progressive AsyncStorage → Supabase

Chaque étape est petite, réversible, validée par `tsc` + `lint`, et garde l'app fonctionnelle.

0. **(fait)** Documentation ; schéma initial (`0001`) ; client Supabase ; repositories (`profile`, `listing`, `booking`) ; lecture des véhicules branchée (`0002`).
   - **Reste bloqué** : Auth (§4.1). Bookings (`src/lib/bookings.ts`) et wallet (`src/lib/wallet.ts`) portent un `TODO(migration …)` explicite.
1. Créer les projets Supabase (dev/prod), variables `EXPO_PUBLIC_SUPABASE_URL` / clé publishable via `.env` non versionné ; ajouter `src/lib/supabase.ts` (via `npx expo install` pour les dépendances Expo ; `react-native-url-polyfill` déjà présent). Aucun écran branché.
2. Écrire les migrations SQL + RLS + tests de politiques ; générer les types TypeScript.
3. **Auth** : implémenter la version Supabase derrière l'API existante de `useAuth`, activée par un drapeau (`EXPO_PUBLIC_BACKEND=supabase|local`). Ne pas migrer les PIN locaux (ré-inscription).
4. **Catalogues** : repositories lisant la base avec repli sur `src/data` tant que la base est vide ; médias vers Storage.
5. **Réservations** : introduire une interface `BookingsRepository` ; implémentation locale (existante) et Supabase ; `useBookings`/`createBooking`… gardent leur signature.
6. **Portefeuille** : idem avec `WalletRepository` ; d'abord lecture seule du ledger, puis écritures via RPC, puis MoMo réel.
7. Modules secondaires (Ride, cartes, crypto, notifications, support) selon décisions produit.
8. Retrait du code local et des données de démo (seeds), suppression des clés AsyncStorage obsolètes (`wid_accounts_v2`, `wid_bookings_v1`, `wid_wallet_v1`) au premier lancement.

Règle : un seul backend actif par domaine à la fois ; pas de double écriture local/serveur.

## 8. Règles RLS prévues

RLS **activée sur toutes les tables** du schéma `public`, politiques par défaut = refus.

| Table | `SELECT` | `INSERT` | `UPDATE` | `DELETE` |
|---|---|---|---|---|
| `profiles` | propriétaire (`id = auth.uid()`) | via trigger à la création du compte | propriétaire, hors champs sensibles | aucun |
| `vehicles`, `rental_listings`, `housing_listings`, `drivers`, `ads`, `zones` | tout utilisateur authentifié (si `is_published`) | rôle admin / propriétaire de l'annonce | propriétaire de l'annonce / admin | admin |
| `bookings` | propriétaire de la réservation ; loueur concerné | **RPC uniquement** | **RPC uniquement** | aucun |
| `booked_slots` (vue sans PII) | tout utilisateur authentifié | — | — | — |
| `wallet_transactions` | propriétaire | **RPC / service role uniquement** | **interdit** | **interdit** |
| `wallets` / vue solde | propriétaire | RPC | RPC | aucun |
| `payments` | propriétaire | Edge Function | Edge Function (webhook) | aucun |
| `notifications` | destinataire | service role | destinataire (`read_at`) | destinataire |
| `support_tickets` | auteur ; support | auteur | support | aucun |
| `ride_trips` | passager ; chauffeur assigné | passager (RPC) | RPC | aucun |

Autres règles : rôles dans une table `user_roles` ou claim JWT non modifiable par l'utilisateur ; fonctions `SECURITY DEFINER` avec `search_path` fixé ; clé `service_role` uniquement dans Edge Functions ; vérification avec `get_advisors` (Supabase) après chaque migration ; tests de politiques par rôle (anonyme, client, autre client, admin).
