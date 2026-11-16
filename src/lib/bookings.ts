// Réservations (location de véhicules + logements), persistées localement.
// Le calendrier lit `activeBookings` pour savoir quels créneaux sont occupés :
// dès qu'une réservation est confirmée (paiement), le créneau est bloqué.

import { createStore, uid, useStore } from '@/lib/store';
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

type BookingsState = { items: Booking[] };

const atDay = (offset: number, hour: number): number => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
};

const makeRef = () => `WD-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

// Créneaux de démonstration déjà réservés (pour voir le calendrier se remplir).
const seedItem = (
  id: string,
  kind: BookingKind,
  listingId: string,
  title: string,
  start: number,
  end: number,
  amount: number
): Booking => ({
  id,
  ref: makeRef(),
  kind,
  listingId,
  title,
  start,
  end,
  amount,
  deposit: Math.round(amount * 0.3),
  paid: amount,
  method: 'momo',
  status: 'confirmed',
  createdAt: Date.now(),
});

const seed: BookingsState = {
  items: [
    seedItem('bk_seed_1', 'rental', 'r1', 'Toyota Yaris', atDay(1, 9), atDay(1, 18), 20000),
    seedItem('bk_seed_2', 'rental', 'r1', 'Toyota Yaris', atDay(3, 8), atDay(4, 12), 40000),
    seedItem('bk_seed_3', 'rental', 'r3', 'Toyota RAV4', atDay(2, 10), atDay(2, 16), 45000),
    seedItem('bk_seed_4', 'housing', 'a1', 'Studio meublé', atDay(1, 10), atDay(1, 13), 150000),
    seedItem('bk_seed_5', 'housing', 'a1', 'Studio meublé', atDay(5, 14), atDay(5, 17), 150000),
    seedItem('bk_seed_6', 'housing', 'a2', 'Appartement 2 pièces', atDay(2, 9), atDay(2, 11), 250000),
  ],
};

export const bookings = createStore<BookingsState>('wid_bookings_v1', seed);

export function useBookings(): Booking[] {
  return useStore(bookings).items;
}

export type NewBooking = {
  kind: BookingKind;
  listingId: string;
  title: string;
  start: number;
  end: number;
  amount: number;
  deposit: number;
  method: TxMethod;
  status: BookingStatus;
  paid: number;
};

export function createBooking(input: NewBooking): Booking {
  const booking: Booking = {
    ...input,
    id: uid('bk'),
    ref: makeRef(),
    createdAt: Date.now(),
  };
  bookings.set((prev) => ({ items: [booking, ...prev.items] }));
  return booking;
}

export function updateBooking(id: string, patch: Partial<Booking>): void {
  bookings.set((prev) => ({
    items: prev.items.map((b) => (b.id === id ? { ...b, ...patch } : b)),
  }));
}

export function confirmBooking(id: string, paid: number, method: TxMethod): void {
  updateBooking(id, { status: 'confirmed', paid, method });
}

export function cancelBooking(id: string): void {
  updateBooking(id, { status: 'cancelled' });
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
