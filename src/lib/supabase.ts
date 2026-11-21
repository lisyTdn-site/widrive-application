// Client Supabase unique de l'application, créé À LA DEMANDE.
//
// Création paresseuse : tant que `getSupabase()` n'est pas appelé, l'absence de
// variables d'environnement ne casse pas le démarrage (les routes Expo Router
// sont importées au lancement). Dès qu'on l'appelle sans configuration, une
// erreur explicite est levée.
//
// Seules l'URL et la clé *publishable* sont lues ici. La clé service_role
// ne doit JAMAIS apparaître dans l'application.

import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import type { Database } from '@/types/database';

// Expo remplace `process.env.EXPO_PUBLIC_*` à la compilation : l'accès doit
// rester statique (pas de déstructuration ni de clé dynamique).
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = !!supabaseUrl && !!supabasePublishableKey;

export type AppSupabaseClient = SupabaseClient<Database>;

let client: AppSupabaseClient | null = null;

export function getSupabase(): AppSupabaseClient {
  if (client) return client;
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      'Configuration Supabase manquante : définis EXPO_PUBLIC_SUPABASE_URL et ' +
        'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY (copie .env.example vers .env, puis redémarre `npx expo start -c`).'
    );
  }

  client = createClient<Database>(supabaseUrl, supabasePublishableKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  // Sur mobile, le rafraîchissement du jeton ne doit tourner qu'au premier plan.
  AppState.addEventListener('change', (state) => {
    if (state === 'active') client?.auth.startAutoRefresh();
    else client?.auth.stopAutoRefresh();
  });

  return client;
}
