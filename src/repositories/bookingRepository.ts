// Réservations (table `bookings`) et créneaux occupés.
//
// NON BRANCHÉ : `src/lib/bookings.ts` (AsyncStorage) reste la source de vérité de l'UI.
// TODO(migration bookings) : voir docs/ARCHITECTURE.md §7 étape 5. Prérequis : Supabase Auth
// opérationnel, puis RPC serveur pour paiement/annulation (la RLS n'autorise que l'INSERT d'une
// réservation `pending` non payée).

import { getSupabase } from '@/lib/supabase';
import { fail, fromThrown, ok, type RepoResult } from '@/repositories/result';
import type { Tables, TablesInsert } from '@/types/database';

export type BookingRow = Tables<'bookings'>;
export type NewPendingBooking = Pick<
  TablesInsert<'bookings'>,
  'user_id' | 'listing_id' | 'title_snapshot' | 'start_at' | 'end_at' | 'amount' | 'deposit'
>;
export type BusySlot = { start_at: string; end_at: string };

export async function fetchMyBookings(): Promise<RepoResult<BookingRow[]>> {
  try {
    // La RLS limite déjà le résultat aux réservations de l'utilisateur connecté.
    const { data, error } = await getSupabase().from('bookings').select('*').order('created_at', { ascending: false });
    if (error) return fail(error.message, error.code);
    return ok(data);
  } catch (e) {
    return fromThrown(e);
  }
}

export async function fetchBusySlots(listingId: string, from: Date, to: Date): Promise<RepoResult<BusySlot[]>> {
  try {
    const { data, error } = await getSupabase().rpc('get_busy_slots', {
      p_listing_id: listingId,
      p_from: from.toISOString(),
      p_to: to.toISOString(),
    });
    if (error) return fail(error.message, error.code);
    return ok(data);
  } catch (e) {
    return fromThrown(e);
  }
}

/** Crée une réservation `pending` non payée. Un chevauchement est refusé par la base (code 23P01). */
export async function createPendingBooking(input: NewPendingBooking): Promise<RepoResult<BookingRow>> {
  try {
    const { data, error } = await getSupabase()
      .from('bookings')
      .insert({ ...input, status: 'pending', paid: 0 })
      .select('*')
      .single();
    if (error) return fail(error.message, error.code);
    return ok(data);
  } catch (e) {
    return fromThrown(e);
  }
}
