// Véhicules à vendre : source Supabase (table `listings`, kind = 'vehicle_sale'),
// avec repli local contrôlé vers `src/data/vehicles.ts` UNIQUEMENT en développement.
//
// Règles de source :
//   * Supabase configuré + lecture OK            -> données Supabase
//   * Supabase configuré + erreur, en __DEV__     -> repli local (avertissement console, `fallback: true`)
//   * Supabase configuré + erreur, en production  -> état d'erreur (pas de repli silencieux)
//   * Supabase non configuré, en __DEV__          -> données locales (`fallback: true`)
//   * Supabase non configuré, en production       -> état d'erreur

import { useCallback, useEffect, useState } from 'react';

import { images } from '@/data/images';
import {
  vehicles as localVehicles,
  type Vehicle,
  type VehicleCategory,
  type VehicleCondition,
  type VehicleEquipment,
  type VehicleFuel,
  type VehicleGearbox,
  type VehicleStatus,
} from '@/data/vehicles';
import { isSupabaseConfigured } from '@/lib/supabase';
import { fetchListingById, fetchPublishedListings, type ListingRow } from '@/repositories/listingRepository';
import { fail, ok, type RepoResult } from '@/repositories/result';
import type { Json } from '@/types/database';

// --- Mapping ListingRow -> Vehicle ------------------------------------------

const CATEGORIES: readonly VehicleCategory[] = ['sedan', 'suv', 'pickup'];
const STATUSES: readonly VehicleStatus[] = ['available', 'reserved', 'sold'];
const FUELS: readonly VehicleFuel[] = ['petrol', 'diesel'];
const GEARBOXES: readonly VehicleGearbox[] = ['manual', 'auto'];
const DRIVES: readonly Vehicle['drive'][] = ['twoWheel', 'fourWheel'];
const CONDITIONS: readonly VehicleCondition[] = ['excellent', 'veryGood', 'good', 'works'];
const EQUIPMENT: readonly VehicleEquipment[] = ['bluetooth', 'camera', 'windows', 'screen', 'roof', 'sunroof', 'leather', 'gps'];
const DOCS: readonly Vehicle['documentKey'][] = ['vehicle.docs.1', 'vehicle.docs.2', 'vehicle.docs.3', 'vehicle.docs.4'];

type Attrs = { [key: string]: Json | undefined };

const asAttrs = (v: Json): Attrs => (v !== null && typeof v === 'object' && !Array.isArray(v) ? v : {});
const str = (v: Json | undefined, fallback: string): string => (typeof v === 'string' && v ? v : fallback);
const num = (v: Json | undefined, fallback: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const oneOf = <T extends string>(v: Json | undefined, allowed: readonly T[], fallback: T): T =>
  allowed.find((a) => a === v) ?? fallback;

function listingDescription(d: Json): Vehicle['description'] {
  const o = d !== null && typeof d === 'object' && !Array.isArray(d) ? d : {};
  const fr = typeof o.fr === 'string' ? o.fr.trim() : '';
  const en = typeof o.en === 'string' && o.en.trim() ? o.en.trim() : fr;
  return fr ? { fr, en } : undefined;
}

export function listingToVehicle(row: ListingRow): Vehicle {
  const a = asAttrs(row.attributes);
  const equipment = Array.isArray(a.equipment)
    ? EQUIPMENT.filter((e) => (a.equipment as Json[]).includes(e))
    : [];
  const firstImage = row.image_urls[0];

  return {
    id: row.id,
    brand: str(a.brand, row.title),
    model: str(a.model, ''),
    year: num(a.year, new Date().getFullYear()),
    price: row.price,
    km: num(a.km, 0),
    fuel: oneOf(a.fuel, FUELS, 'petrol'),
    gearbox: oneOf(a.gearbox, GEARBOXES, 'manual'),
    drive: oneOf(a.drive, DRIVES, 'twoWheel'),
    category: oneOf(a.category, CATEGORIES, 'sedan'),
    city: row.city ?? '',
    lat: row.lat ?? 0,
    lng: row.lng ?? 0,
    status: oneOf(a.status, STATUSES, 'available'),
    engine: oneOf(a.engine, CONDITIONS, 'good'),
    paint: oneOf(a.paint, CONDITIONS, 'good'),
    interior: oneOf(a.interior, CONDITIONS, 'good'),
    ac: oneOf(a.ac, CONDITIONS, 'good'),
    equipment,
    documentKey: oneOf(a.documentKey, DOCS, 'vehicle.docs.1'),
    image: firstImage ? { uri: firstImage } : images.rentals.corolla,
    photos: row.image_urls.map((uri) => ({ uri })),
    description: listingDescription(row.description),
    negotiable: a.negotiable === true,
  };
}

// --- Chargement ----------------------------------------------------------------

const CONFIG_ERROR = 'Supabase non configuré (EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY).';

async function loadVehicles(): Promise<RepoResult<Vehicle[]>> {
  if (!isSupabaseConfigured) return fail(CONFIG_ERROR, 'config');
  const res = await fetchPublishedListings('vehicle_sale');
  return res.ok ? ok(res.data.map(listingToVehicle)) : res;
}

async function loadVehicle(id: string): Promise<RepoResult<Vehicle | null>> {
  if (!isSupabaseConfigured) return fail(CONFIG_ERROR, 'config');
  const res = await fetchListingById(id);
  if (!res.ok) return res;
  return ok(res.data && res.data.kind === 'vehicle_sale' ? listingToVehicle(res.data) : null);
}

type Remote<T> = { forLoad: () => Promise<RepoResult<T>>; res: RepoResult<T> };

export type Loaded<T> = {
  data: T;
  loading: boolean;
  /** Message d'erreur à afficher ; `null` si tout va bien. */
  error: string | null;
  /** Vrai si les données viennent du repli local de développement. */
  fallback: boolean;
  retry: () => void;
};

// `load` doit être stable (fonction de module ou useCallback) ; `empty` est la valeur
// affichée pendant le chargement ou en erreur ; `devFallback` n'est utilisé qu'en __DEV__.
function useRemote<T>(load: () => Promise<RepoResult<T>>, empty: T, devFallback: T, label: string): Loaded<T> {
  const [attempt, setAttempt] = useState(0);
  const [remote, setRemote] = useState<Remote<T> | null>(null);

  useEffect(() => {
    let cancelled = false;
    load().then((res) => {
      if (cancelled) return;
      if (!res.ok && __DEV__) {
        console.warn(`[${label}] Supabase indisponible, repli local (développement) : ${res.error.message}`);
      }
      setRemote({ forLoad: load, res });
    });
    return () => {
      cancelled = true;
    };
  }, [load, attempt, label]);

  const retry = useCallback(() => {
    setRemote(null);
    setAttempt((n) => n + 1);
  }, []);

  if (!remote || remote.forLoad !== load) return { data: empty, loading: true, error: null, fallback: false, retry };
  if (remote.res.ok) return { data: remote.res.data, loading: false, error: null, fallback: false, retry };
  if (__DEV__) return { data: devFallback, loading: false, error: null, fallback: true, retry };
  return { data: empty, loading: false, error: remote.res.error.message, fallback: false, retry };
}

const NO_VEHICLES: Vehicle[] = [];

/** Liste des véhicules à vendre. */
export function useVehicles(): Loaded<Vehicle[]> {
  return useRemote(loadVehicles, NO_VEHICLES, localVehicles, 'vehicles');
}

/** Un véhicule par id (`data` vaut `null` s'il est introuvable). */
export function useVehicle(id: string | undefined): Loaded<Vehicle | null> {
  const load = useCallback(() => loadVehicle(id ?? ''), [id]);
  const local = localVehicles.find((v) => v.id === id) ?? null;
  return useRemote(load, null, local, 'vehicle');
}
