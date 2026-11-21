# CLAUDE.md — WIDRIVE (app mobile Expo)

Ce fichier complète `AGENTS.md`. En cas de conflit, la règle la plus stricte s'applique.

## Règles impératives

1. **Lire `AGENTS.md` avant toute modification.**
2. **Respecter Expo SDK 58** (`expo ~58`, React Native 0.88, React 19). Avant d'utiliser une API Expo/EAS/RN, consulter la doc versionnée : `https://docs.expo.dev/versions/v58.0.0/` (et `https://docs.expo.dev/llms.txt`). Ne jamais répondre de mémoire.
3. **Expo Router pour toute navigation** (`src/app/`, `router`, `Link`, `useLocalSearchParams` depuis `expo-router`). Aucun autre système de navigation.
4. **Ne jamais créer ni éditer `ios/` ou `android/` à la main** (Continuous Native Generation). Config native via `app.json` et config plugins.
5. **Aucun secret dans le code ni dans git** : pas de clé `service_role`, pas de jeton, pas de mot de passe. Seules les valeurs publiques (`EXPO_PUBLIC_SUPABASE_URL`, clé *publishable/anon*) peuvent être exposées au client, via variables d'environnement (`.env` non versionné / EAS secrets), jamais en dur.
6. **Dépendances Expo : `npx expo install <paquet>`** (jamais `npm install` / `yarn add` pour elles). Vérifier avec `npx expo-doctor` si besoin.
7. **Conserver le design, les traductions (FR/EN, `src/i18n/`) et les routes existantes.** Toute nouvelle chaîne visible est ajoutée dans `fr.ts` ET `en.ts`.
8. **Ne jamais remplacer une fonctionnalité par une maquette.** Une fonctionnalité existante doit rester opérationnelle à chaque étape.
9. **Après chaque étape : `npx tsc --noEmit` puis `npx expo lint`.** Les deux doivent passer (état de référence au 2026-11-18 : 0 erreur, 0 warning). Ne pas déclarer une tâche terminée sinon.
10. **Changements petits, réversibles et documentés** : une préoccupation par changement, pas de réécriture massive, mise à jour de `docs/` quand le comportement ou l'architecture change.
11. **Ne jamais stocker un PIN en clair**, ni côté client (AsyncStorage, logs, params de route, état persistant) ni dans Supabase. Le PIN est haché côté serveur (ou remplacé par Supabase Auth) ; le client ne le transmet que par canal TLS et ne le conserve pas.

## Contexte projet

- Branché sur Supabase : auth (Edge Function `auth-pin`, `src/auth/AuthContext.tsx`), réservations et portefeuille (`src/lib/bookings.ts`, `wallet.ts`, RPC serveur), annonces (`src/lib/vehicleListings.ts`, `catalogListings.ts`, `src/repositories/`). Reste simulé : recharge/paiement Mobile Money, OTP SMS (code test `123456`), Ride, crypto, cartes. Admin : `../../../admin` (Next.js) + `../../../backend` (Express).
- Alias d'import : `@/` → `src/`.
- Code métier : `src/auth`, `src/lib`, `src/data`, `src/components`, `src/core`. Routes uniquement dans `src/app/`.
- Documentation : `docs/SPEC.md` (produit), `docs/ARCHITECTURE.md` (architecture et migration), `docs/BACKEND.md` (inventaire des données → tables Supabase).

## Commandes

```bash
npx expo start        # serveur de dev
npx tsc --noEmit      # typecheck
npx expo lint         # lint
npx expo-doctor       # diagnostic dépendances/config
```
