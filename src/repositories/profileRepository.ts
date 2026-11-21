// Profil applicatif (table `profiles`), lié 1–1 à auth.users. JAMAIS de PIN ici.
// Le profil est créé par le trigger `handle_new_user` à l'inscription Auth ;
// ce repository ne fait que lire et mettre à jour le profil de l'utilisateur connecté (RLS).
//
// NON BRANCHÉ : en attente de la décision d'authentification (voir docs/ARCHITECTURE.md §4.1).

import { getSupabase } from '@/lib/supabase';
import { fail, fromThrown, ok, type RepoResult } from '@/repositories/result';
import type { Tables, TablesUpdate } from '@/types/database';

export type Profile = Tables<'profiles'>;
export type ProfilePatch = Pick<TablesUpdate<'profiles'>, 'first_name' | 'last_name' | 'email' | 'country_code' | 'lang'>;

export async function fetchMyProfile(userId: string): Promise<RepoResult<Profile | null>> {
  try {
    const { data, error } = await getSupabase().from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) return fail(error.message, error.code);
    return ok(data);
  } catch (e) {
    return fromThrown(e);
  }
}

export async function updateMyProfile(userId: string, patch: ProfilePatch): Promise<RepoResult<Profile>> {
  try {
    const { data, error } = await getSupabase().from('profiles').update(patch).eq('id', userId).select('*').single();
    if (error) return fail(error.message, error.code);
    return ok(data);
  } catch (e) {
    return fromThrown(e);
  }
}
