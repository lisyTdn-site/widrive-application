import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/database';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
if (!url || !key) throw new Error('Variables VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY manquantes (voir .env.example).');

// Seules des valeurs publiques ici : les droits admin viennent du rôle (table user_roles) + RLS.
export const sb = createClient<Database>(url, key);
