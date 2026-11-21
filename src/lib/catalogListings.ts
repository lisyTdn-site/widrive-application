// Location de véhicules et logements : source Supabase (table `listings`, annonces publiées).
// Les annonces d'origine (ids « legacy » r1…, a1…) gardent leurs photos/descriptions riches de
// `src/data/catalog.ts` ; le prix, le titre, la ville et la publication viennent de la base.
// Les annonces créées depuis l'admin utilisent `attributes` (jsonb) avec des valeurs par défaut.
//
// Règles de source (comme `vehicleListings.ts`) : en production, pas de repli silencieux ;
// en __DEV__, repli local si Supabase est indisponible.

import { useCallback, useEffect, useState } from 'react';

import {
  apartments as localApartments,
  rentals as localRentals,
  type Apartment,
  type AptType,
  type Feature,
  type Rental,
  type RentalCat,
} from '@/data/catalog';
import { images } from '@/data/images';
import { isSupabaseConfigured } from '@/lib/supabase';
import { fetchPublishedListings, type ListingKind, type ListingRow } from '@/repositories/listingRepository';
import type { Json } from '@/types/database';

type Attrs = { [key: string]: Json | undefined };
const asAttrs = (v: Json): Attrs => (v !== null && typeof v === 'object' && !Array.isArray(v) ? v : {});
const str = (v: Json | undefined, d: string) => (typeof v === 'string' && v ? v : d);
const num = (v: Json | undefined, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const oneOf = <T extends string>(v: Json | undefined, allowed: readonly T[], d: T): T =>
  allowed.find((a) => a === v) ?? d;
const descr = (row: ListingRow, d: { fr: string; en: string }) => {
  const o = row.description;
  const d2 = o !== null && typeof o === 'object' && !Array.isArray(o) ? o : {};
  const fr = str(d2.fr, d.fr);
  return { fr, en: str(d2.en, fr) };
};

const RENTAL_CATS: readonly RentalCat[] = ['city', 'sedan', 'suv', 'pickup', 'minibus'];
const APT_TYPES: readonly AptType[] = ['studio', 'two', 'three', 'villa'];
const FEATURES: readonly Feature[] = ['ac', 'wifi', 'hotwater', 'guard', 'parking', 'generator', 'garden'];

// L'id côté app = id « legacy » s'il existe (calendriers/réservations déjà alignés), sinon l'UUID.
const refOf = (row: ListingRow & { legacy_id?: string | null }) => row.legacy_id ?? row.id;

export function listingToRental(row: ListingRow & { legacy_id?: string | null }): Rental {
  const id = refOf(row);
  const base = localRentals.find((r) => r.id === id);
  const a = asAttrs(row.attributes);
  const photos = row.image_urls.map((uri) => ({ uri }));
  const city = row.city ?? '';
  return {
    id,
    name: row.title,
    category: base?.category ?? oneOf(a.category, RENTAL_CATS, 'sedan'),
    seats: base?.seats ?? num(a.seats, 5),
    gearbox: base?.gearbox ?? oneOf(a.gearbox, ['manual', 'auto'] as const, 'manual'),
    fuel: base?.fuel ?? oneOf(a.fuel, ['petrol', 'diesel'] as const, 'petrol'),
    pricePerDay: row.price,
    image: photos[0] ?? base?.image ?? images.rentals.corolla,
    photos: photos.length ? photos : (base?.photos ?? [images.rentals.corolla, ...images.carInterior]),
    city: city ? { fr: city, en: city } : (base?.city ?? { fr: '', en: '' }),
    lat: row.lat ?? base?.lat ?? 6.4489,
    lng: row.lng ?? base?.lng ?? 2.3556,
    rating: base?.rating ?? 0,
    reviews: base?.reviews ?? 0,
    description: descr(row, base?.description ?? { fr: '', en: '' }),
    equipment: base?.equipment ?? [],
  };
}

export function listingToApartment(row: ListingRow & { legacy_id?: string | null }): Apartment {
  const id = refOf(row);
  const base = localApartments.find((x) => x.id === id);
  const a = asAttrs(row.attributes);
  const photos = row.image_urls.map((uri) => ({ room: 'facade' as const, source: { uri } }));
  const city = row.city ?? '';
  const quartier = str(a.quartier, '');
  const features = Array.isArray(a.features)
    ? FEATURES.filter((f) => (a.features as Json[]).includes(f))
    : (base?.features ?? []);
  const cityL = city ? { fr: city, en: city } : (base?.city ?? { fr: '', en: '' });
  const quartierL = quartier ? { fr: quartier, en: quartier } : (base?.quartier ?? { fr: '', en: '' });
  return {
    id,
    type: base?.type ?? oneOf(a.type, APT_TYPES, 'two'),
    title: base && row.title === base.title.fr ? base.title : { fr: row.title, en: row.title },
    quartier: quartierL,
    city: cityL,
    area: base?.area ?? { fr: [city, quartier].filter(Boolean).join(' · '), en: [city, quartier].filter(Boolean).join(' · ') },
    pricePerMonth: row.price,
    beds: base?.beds ?? num(a.beds, 1),
    baths: base?.baths ?? num(a.baths, 1),
    size: base?.size ?? num(a.size, 40),
    features,
    description: descr(row, base?.description ?? { fr: '', en: '' }),
    image: photos[0]?.source ?? base?.image ?? images.apartments.studio,
    photos: photos.length ? photos : (base?.photos ?? [{ room: 'facade', source: images.apartments.studio }]),
    lat: row.lat ?? base?.lat ?? 6.4,
    lng: row.lng ?? base?.lng ?? 2.35,
    rating: base?.rating ?? 0,
    reviews: base?.reviews ?? 0,
  };
}

export type Loaded<T> = { data: T; loading: boolean; error: string | null; retry: () => void };

function useListings<T>(kind: ListingKind, map: (r: ListingRow) => T, devFallback: T[]): Loaded<T[]> {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ data: T[]; loading: boolean; error: string | null }>({
    data: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isSupabaseConfigured) {
        if (!cancelled) setState(__DEV__ ? { data: devFallback, loading: false, error: null } : { data: [], loading: false, error: 'config' });
        return;
      }
      const res = await fetchPublishedListings(kind);
      if (cancelled) return;
      if (res.ok) setState({ data: res.data.map(map), loading: false, error: null });
      else if (__DEV__) setState({ data: devFallback, loading: false, error: null });
      else setState({ data: [], loading: false, error: res.error.message });
    })();
    return () => {
      cancelled = true;
    };
    // map/devFallback sont des constantes de module.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, attempt]);

  const retry = useCallback(() => {
    setState({ data: [], loading: true, error: null });
    setAttempt((n) => n + 1);
  }, []);
  return { ...state, retry };
}

/** Véhicules en location publiés. */
export const useRentals = () => useListings('vehicle_rental', listingToRental, localRentals);
/** Logements publiés. */
export const useApartments = () => useListings('housing', listingToApartment, localApartments);
