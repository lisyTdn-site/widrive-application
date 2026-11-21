// Réservations (location de véhicules + logements), lues et écrites via Supabase.
// Montant, acompte et disponibilité sont décidés par le SERVEUR (RPC `create_booking`,
// contrainte anti-chevauchement) ; le client n'affiche que ce que le serveur retourne.
// Le calendrier lit `useBookings()` = mes réservations + créneaux occupés par les autres
// (`get_all_busy_slots`, sans donnée personnelle).

import { getSupabase } from '@/lib/supabase';
import { createLiveStore, useStore } from '@/lib/store';
import type { TxMethod } from '@/lib/wallet';

export type BookingKind = 'rental' | 'housing';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export type Booking = {
  id: string;
  ref: string;
  kind: BookingKind;
  listingId: string;
  title: string;
  /** Début / fin (ms). */
  start: number;
  end: number;
  /** Montant total de la réservation. */
  amount: number;
  /** Acompte demandé pour bloquer le créneau. */
  deposit: number;
  /** Montant effectivement payé. */
  paid: number;
  method: TxMethod;
  status: BookingStatus;
  createdAt: number;
};

type BookingsState = { mine: Booking[]; busy: Booking[] };

export const bookings = createLiveStore<BookingsState>({ mine: [], busy: [] });

/** Mes réservations + créneaux occupés (pour les calendriers). */
export function useBookings(): Booking[] {
  const st = useStore(bookings);
  return [...st.mine, ...st.busy];
}

export function useMyBookings(): Booking[] {
  return useStore(bookings).mine;
}

export function resetBookings(): void {
  bookings.set({ mine: [], busy: [] });
}

const DAY = 86_400_000;

export async function refreshBookings(): Promise<void> {
  const sb = getSupabase();
  const now = Date.now();
  const [mine, busy] = await Promise.all([
    sb.from('bookings').select('*, listings(legacy_id, kind)').order('created_at', { ascending: false }),
    sb.rpc('get_all_busy_slots', {
      p_from: new Date(now - DAY).toISOString(),
      p_to: new Date(now + 400 * DAY).toISOString(),
    }),
  ]);
  if (mine.error || busy.error) return;
  bookings.set({
    mine: (mine.data ?? []).map((r) => ({
      id: r.id,
      ref: r.ref,
      kind: r.listings?.kind === 'housing' ? 'housing' : 'rental',
      listingId: r.listings?.legacy_id ?? r.listing_id,
      title: r.title_snapshot,
      start: new Date(r.start_at).getTime(),
      end: new Date(r.end_at).getTime(),
      amount: r.amount,
      deposit: r.deposit,
      paid: r.paid,
      method: (r.method ?? 'wallet') as TxMethod,
      status: r.status,
      createdAt: new Date(r.created_at).getTime(),
    })),
    busy: (busy.data ?? []).map((r, i) => ({
      id: `busy_${i}`,
      ref: '',
      kind: 'rental' as const,
      listingId: r.listing_ref,
      title: '',
      start: new Date(r.start_at).getTime(),
      end: new Date(r.end_at).getTime(),
      amount: 0,
      deposit: 0,
      paid: 0,
      method: 'wallet' as const,
      status: 'confirmed' as const,
      createdAt: 0,
    })),
  });
}

export type NewBooking = { listingId: string; start: number; end: number; withDriver?: boolean };
export type BookingResult = { ok: true; booking: Booking } | { ok: false; error: 'unavailable' | 'blocked' | 'error' };

/** Crée une réservation « pending » ; le serveur calcule montant et acompte. */
export async function createBooking(input: NewBooking): Promise<BookingResult> {
  const { data, error } = await getSupabase().rpc('create_booking', {
    p_listing: input.listingId,
    p_start: new Date(input.start).toISOString(),
    p_end: new Date(input.end).toISOString(),
    p_with_driver: !!input.withDriver,
  });
  if (error || !data) {
    if (error && /slot_unavailable/.test(error.message)) return { ok: false, error: 'unavailable' };
    if (error && /account_blocked/.test(error.message)) return { ok: false, error: 'blocked' };
    return { ok: false, error: 'error' };
  }
  await refreshBookings();
  const booking = bookings.get().mine.find((b) => b.id === data.id);
  return booking ? { ok: true, booking } : { ok: false, error: 'error' };
}

/** Annule (remboursement du portefeuille fait côté serveur). */
export async function cancelBooking(id: string): Promise<boolean> {
  const { error } = await getSupabase().rpc('cancel_booking', { p_booking_id: id });
  if (error) return false;
  await refreshBookings();
  return true;
}

/** Réservations qui occupent le calendrier (tout sauf annulées). */
export function activeBookings(items: Booking[], listingId: string): Booking[] {
  return items.filter((b) => b.listingId === listingId && b.status !== 'cancelled');
}

export function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Vrai si le créneau [start, end) est déjà occupé pour ce logement/véhicule. */
export function isRangeBusy(
  items: Booking[],
  listingId: string,
  start: number,
  end: number
): boolean {
  return activeBookings(items, listingId).some((b) => overlaps(start, end, b.start, b.end));
}

/** Vrai si une heure précise d'un jour donné est occupée. */
export function isHourBusy(items: Booking[], listingId: string, day: Date, hour: number): boolean {
  const start = new Date(day).setHours(hour, 0, 0, 0);
  const end = new Date(day).setHours(hour + 1, 0, 0, 0);
  return isRangeBusy(items, listingId, start, end);
}

/** Vrai si au moins une heure de ce jour est occupée. */
export function isDayBusy(items: Booking[], listingId: string, day: Date): boolean {
  const start = new Date(day).setHours(0, 0, 0, 0);
  const end = new Date(day).setHours(24, 0, 0, 0);
  return isRangeBusy(items, listingId, start, end);
}

export function myBookings(items: Booking[]): Booking[] {
  return [...items].sort((a, b) => b.createdAt - a.createdAt);
}
