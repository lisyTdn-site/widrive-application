# WIDRIVE — Spécification produit

> Statut : document vivant, rédigé à partir de l'inspection du code (2026-11-18). Les éléments marqués *(supposé)* sont à valider avec le client.

## 1. Objectif produit

WIDRIVE est une super-app mobile de mobilité et de services pour l'Afrique de l'Ouest francophone, lancée à **Abomey-Calavi (Bénin)**. Elle réunit au même endroit : achat de véhicules, location de véhicules, location de logements (par créneaux), chauffeurs, course VTC (« Ride »), portefeuille en FCFA (XOF) alimenté par Mobile Money, crypto et cartes virtuelles. Langues : français et anglais. Monnaie : XOF (XAF prévu pour d'autres pays).

## 2. Utilisateurs et rôles supposés

| Rôle | Description | État |
|---|---|---|
| Client | Particulier inscrit par téléphone + PIN 4 chiffres ; réserve, paie, utilise le portefeuille | Seul rôle présent dans l'app |
| Propriétaire / loueur *(supposé)* | Publie véhicules et logements (écran « Vendre » existant) | Non modélisé |
| Chauffeur *(supposé)* | Accepte courses et missions | Non modélisé (liste statique) |
| Support / admin *(supposé)* | Gère annonces, litiges, remboursements, modules | Non existant ; WhatsApp pour le support |

## 3. Modules actuels

Pilotés par `src/core/modules.ts` (statuts `active | maintenance | soon | hidden`, garde `ModuleGate`).

| Module | Route | Statut | Notes |
|---|---|---|---|
| Véhicules (vente) | `/vehicules`, `/vehicule/[id]` | actif | Catalogue statique `src/data/vehicles.ts` |
| Location véhicules | `/rental/location`, `/rental/[id]` | actif | Calendrier horaire, acompte, paiement |
| Logements | `/housing/appartements`, `/housing/[id]` | actif | Réservation par créneaux |
| Chauffeurs | `/drivers/chauffeurs` | actif | Liste statique |
| Crypto | `/crypto` | actif | Cours statiques, soldes à 0 |
| Cartes | `/cards/cartes` | actif | État local React uniquement |
| Ride | `/ride`, `/trip` | actif | Tarifs fixes, suivi simulé par timers |
| Pro | — | bientôt | |
| Assistance | `/assistance` | actif | Lien WhatsApp |
| Autres écrans | `/welcome`, `/login`, `/(tabs)` (accueil, portefeuille, profil), `/bookings`, `/transfer`, `/notifications`, `/vendre`, `/bientot` | actifs | |

## 4. Parcours principaux

1. **Inscription** : `/welcome` → `/login` (mode register) → formulaire (nom, prénom, e-mail optionnel, pays, téléphone, PIN ×2, CGU) → OTP → retour à la connexion (le PIN est ressaisi volontairement).
2. **Connexion** : téléphone + PIN 4 chiffres, option « se souvenir de moi » (téléphone/pays seulement). La session reste en mémoire : PIN redemandé à chaque ouverture.
3. **PIN oublié** : téléphone → nouveau PIN → OTP → connexion.
4. **Recharge / retrait portefeuille** : `/transfer` (montant min., méthode MoMo, solde suffisant pour un retrait).
5. **Réservation location/logement** : fiche → calendrier (créneaux libres/occupés) → feuille de paiement (`PaySheet`, acompte ou totalité, portefeuille ou MoMo) → réservation confirmée, créneau bloqué.
6. **Annulation** : `/bookings` → statut `cancelled`, créneau libéré, remboursement portefeuille.
7. **Course Ride** : destination → catégorie (Eco/Confort/Van) → paiement → suivi en 3 étapes.
8. **Achat de véhicule** : consultation de fiche, contact (WhatsApp *(supposé)*).

## 5. État actuel : prototype local

- **Authentification** : comptes dans AsyncStorage (`wid_accounts_v2`), **PIN stocké en clair** ; OTP codé en dur (`123456`) ; aucune vérification serveur.
- **Réservations** : store AsyncStorage (`wid_bookings_v1`) initialisé avec 6 réservations de démo ; anti-chevauchement calculé côté client.
- **Portefeuille** : store AsyncStorage (`wid_wallet_v1`), solde d'ouverture 250 000 XOF, historique de démo ; paiements simulés par `setTimeout`.
- **Catalogues, zones, pays, opérateurs** : fichiers TypeScript statiques ; photos Pixabay distantes.
- Aucune donnée n'est partagée entre appareils/utilisateurs ; réinstaller l'app efface tout.
- Typecheck et lint : propres au 2026-11-18 (`erreurs.txt` à la racine est obsolète).

## 6. Fonctionnalités backend prévues (Supabase)

- Authentification téléphone (OTP SMS réel) + PIN haché côté serveur, ou Supabase Auth avec facteur PIN.
- Profils, pays, préférences.
- Catalogues (véhicules, locations, logements, chauffeurs) administrables, médias en Storage.
- Réservations avec **contrainte d'exclusion de chevauchement en base**.
- Portefeuille en **grand livre (ledger) append-only**, solde dérivé, opérations atomiques (RPC / Edge Functions).
- Intégration Mobile Money (MTN, Moov, Celtiis) via Edge Function + webhooks.
- Notifications push, annonces/pubs, tickets support, courses Ride temps réel (Realtime).
- Détail des tables : voir `BACKEND.md`.

## 7. Décisions encore ouvertes

1. **(BLOQUANT pour la migration Auth, voir `ARCHITECTURE.md` §4.1)** Auth : OTP SMS seul, téléphone + mot de passe, ou auth maison PIN (fournisseur SMS ? coût/pays). Comment représenter un PIN dans Supabase Auth (mot de passe dérivé ? facteur secondaire ?).
2. Agrégateur Mobile Money (direct MTN/Moov/Celtiis, FedaPay, Kkiapay, CinetPay…) et conformité réglementaire (agrément e-monnaie BCEAO ?) pour le portefeuille.
3. Rôles propriétaire/chauffeur : dans la même app ou apps séparées ?
4. Politique d'annulation et de remboursement (délais, frais), taux d'acompte (30 % en démo).
5. Fuseau/horaires de réservation (UTC en base, affichage Africa/Porto-Novo).
6. Crypto et cartes : réel (partenaire) ou vitrine ? Périmètre légal.
7. Ride : dispatch temps réel, tarification, géolocalisation.
8. Numéro WhatsApp support (`SUPPORT_WHATSAPP`) et tarif chauffeur (`DRIVER_PER_DAY`) « à confirmer ».
9. Stratégie hors-ligne : cache lecture seule ou en ligne obligatoire.

## 8. Risques techniques et sécurité

| Risque | Gravité | Mitigation |
|---|---|---|
| PIN en clair dans AsyncStorage (`AuthContext`) | Élevée | Supprimer avec la migration auth ; ne jamais le répliquer dans Supabase |
| OTP fixe `123456`, vérification locale | Élevée | OTP serveur ; retirer avant toute mise en production |
| PIN à 4 chiffres : 10 000 combinaisons | Élevée | Rate limiting serveur, verrouillage progressif, hachage lent (argon2/bcrypt) |
| Solde/transactions manipulables côté client | Critique | Écritures uniquement via RPC/Edge Function `SECURITY DEFINER`, RLS sans `INSERT/UPDATE` client sur le ledger |
| Double réservation possible entre appareils | Élevée | `EXCLUDE USING gist` sur plage temporelle par annonce |
| Paiements simulés (`setTimeout`) | Élevée | Confirmation uniquement via webhook agrégateur, idempotence |
| Clé `service_role` exposée dans le bundle | Critique | Jamais côté client ; secrets via Edge Functions / EAS secrets |
| RLS absente ou trop large | Critique | RLS activée sur toutes les tables, tests de politiques |
| Données personnelles (téléphone, e-mail) | Moyenne | Minimisation, logs sans PII, droit à l'effacement |
| Migration de données locales | Moyenne | Pas d'import automatique des PIN ; données démo non migrées |
| Dépendances Expo SDK 58 / RN 0.88 récentes | Moyenne | `expo-doctor`, `npx expo install`, doc versionnée |
| `web.output: "server"` + stockage navigateur | Faible | Vérifier le rendu SSR avant d'utiliser AsyncStorage/Supabase sur le web |
