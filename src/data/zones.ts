import type { L } from '@/i18n';

// Zone de lancement : Abomey-Calavi (Benin).
// WIDRIVE démarre ses services ici avant de s'étendre.

export type GeoPoint = { lat: number; lng: number };

export type Quartier = {
  id: string;
  name: L;
  point: GeoPoint;
};

export type Zone = {
  id: string;
  name: L;
  short: L;
  center: GeoPoint;
  zoom: number;
  quartiers: Quartier[];
};

export const CALAVI: Zone = {
  id: 'calavi',
  name: { fr: 'Abomey-Calavi', en: 'Abomey-Calavi' },
  short: { fr: 'Calavi', en: 'Calavi' },
  center: { lat: 6.4489, lng: 2.3556 },
  zoom: 12,
  quartiers: [
    { id: 'calavi-centre', name: { fr: 'Calavi centre', en: 'Calavi centre' }, point: { lat: 6.4489, lng: 2.3556 } },
    { id: 'godomey', name: { fr: 'Godomey', en: 'Godomey' }, point: { lat: 6.3889, lng: 2.345 } },
    { id: 'akassato', name: { fr: 'Akassato', en: 'Akassato' }, point: { lat: 6.4936, lng: 2.3619 } },
    { id: 'tankpe', name: { fr: 'Tankpè', en: 'Tankpè' }, point: { lat: 6.4319, lng: 2.3389 } },
    { id: 'zopah', name: { fr: 'Zopah', en: 'Zopah' }, point: { lat: 6.46, lng: 2.37 } },
    { id: 'arconville', name: { fr: 'Arconville', en: 'Arconville' }, point: { lat: 6.4406, lng: 2.3811 } },
    { id: 'cocotomey', name: { fr: 'Cocotomey', en: 'Cocotomey' }, point: { lat: 6.4111, lng: 2.3306 } },
    { id: 'hevie', name: { fr: 'Hêvié', en: 'Hêvié' }, point: { lat: 6.5006, lng: 2.3322 } },
    { id: 'kpota', name: { fr: 'Kpota', en: 'Kpota' }, point: { lat: 6.4639, lng: 2.3417 } },
  ],
};

/** Zone par défaut de l'application. */
export const DEFAULT_ZONE = CALAVI;

export const quartier = (id: string): Quartier =>
  CALAVI.quartiers.find((q) => q.id === id) ?? CALAVI.quartiers[0];
