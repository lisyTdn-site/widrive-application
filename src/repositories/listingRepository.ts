// Accès aux annonces (table `listings`). Aucun composant d'UI n'appelle Supabase directement.
// Colonnes listées explicitement : le rôle `anon` n'a pas accès à `owner_id` (migration 0002).

import { getSupabase } from '@/lib/supabase';
import { fail, fromThrown, ok, type RepoResult } from '@/repositories/result';
import type { Database, Tables } from '@/types/database';

const COLUMNS =
  'id, kind, title, description, city, lat, lng, price, price_unit, attributes, image_urls, is_published, created_at, updated_at';

export type ListingKind = Database['public']['Enums']['listing_kind'];
export type ListingRow = Omit<Tables<'listings'>, 'owner_id'>;

export async function fetchPublishedListings(kind: ListingKind): Promise<RepoResult<ListingRow[]>> {
  try {
    const { data, error } = await getSupabase()
      .from('listings')
      .select(COLUMNS)
      .eq('kind', kind)
      .eq('is_published', true)
      .order('created_at', { ascending: true });
    if (error) return fail(error.message, error.code);
    return ok(data as ListingRow[]);
  } catch (e) {
    return fromThrown(e);
  }
}

/** Renvoie `null` si l'annonce n'existe pas ou n'est pas visible. */
export async function fetchListingById(id: string): Promise<RepoResult<ListingRow | null>> {
  try {
    const { data, error } = await getSupabase().from('listings').select(COLUMNS).eq('id', id).maybeSingle();
    if (error) return fail(error.message, error.code);
    return ok((data as ListingRow | null) ?? null);
  } catch (e) {
    return fromThrown(e);
  }
}

export type NewVehicleListing = {
  brand: string;
  model: string;
  year: number;
  km: number;
  price: number;
  city: string;
  description: string;
};

/** Soumet un véhicule à vendre : annonce NON publiée (la RLS l'impose), modérée par l'admin. */
export async function submitVehicleListing(input: NewVehicleListing): Promise<RepoResult<{ id: string }>> {
  try {
    const sb = getSupabase();
    const { data: auth } = await sb.auth.getUser();
    if (!auth.user) return fail('not_authenticated', 'auth');
    const { data, error } = await sb
      .from('listings')
      .insert({
        owner_id: auth.user.id,
        kind: 'vehicle_sale',
        title: `${input.brand} ${input.model}`.trim().slice(0, 200),
        description: { fr: input.description, en: input.description },
        city: input.city || null,
        price: input.price,
        price_unit: 'total',
        attributes: { brand: input.brand, model: input.model, year: input.year, km: input.km },
        is_published: false,
      })
      .select('id')
      .single();
    if (error) return fail(error.message, error.code);
    return ok({ id: data.id });
  } catch (e) {
    return fromThrown(e);
  }
}
