import type { ImageSourcePropType } from 'react-native';
import { images, photoSet } from '@/data/images';
import type { L } from '@/i18n';

export const SUPPORT_WHATSAPP = '2290199003132'; // à confirmer avec le client
export const DRIVER_PER_DAY = 10000; // chauffeur en option (à définir)

// --- Location de véhicules -----------------------------------------------

export type RentalCat = 'city' | 'sedan' | 'suv' | 'pickup' | 'minibus';

export type Rental = {
  id: string;
  name: string;
  category: RentalCat;
  seats: number;
  gearbox: 'manual' | 'auto';
  fuel: 'petrol' | 'diesel';
  pricePerDay: number;
  image: ImageSourcePropType;
  photos: ImageSourcePropType[];
  city: L;
  lat: number;
  lng: number;
  rating: number;
  reviews: number;
  description: L;
  equipment: string[];
};

export const rentals: Rental[] = [
  {
    id: 'r1', name: 'Toyota Yaris', category: 'city', seats: 5, gearbox: 'manual', fuel: 'petrol',
    pricePerDay: 20000, image: images.rentals.yaris,
    photos: photoSet(['wid-yaris-1', 'wid-yaris-2', 'wid-yaris-3', 'wid-yaris-4']),
    city: { fr: 'Cotonou', en: 'Cotonou' }, lat: 6.3654, lng: 2.4183, rating: 4.8, reviews: 24,
    description: {
      fr: 'Citadine économique et facile à conduire, parfaite pour vos déplacements en ville. Climatisation, Bluetooth et faible consommation.',
      en: 'Economical and easy to drive city car, perfect for getting around town. Air conditioning, Bluetooth and low fuel consumption.',
    },
    equipment: ['vehicle.equipment.bluetooth', 'vehicle.equipment.windows', 'vehicle.equipment.camera'],
  },
  {
    id: 'r2', name: 'Toyota Corolla', category: 'sedan', seats: 5, gearbox: 'auto', fuel: 'petrol',
    pricePerDay: 30000, image: images.rentals.corolla,
    photos: photoSet(['wid-corolla-1', 'wid-corolla-2', 'wid-corolla-3', 'wid-corolla-4']),
    city: { fr: 'Cotonou', en: 'Cotonou' }, lat: 6.3617, lng: 2.4231, rating: 4.9, reviews: 31,
    description: {
      fr: 'Berline confortable et spacieuse, idéale pour les trajets professionnels comme pour les sorties en famille.',
      en: 'Comfortable and spacious sedan, ideal for business trips as well as family outings.',
    },
    equipment: ['vehicle.equipment.bluetooth', 'vehicle.equipment.screen', 'vehicle.equipment.gps', 'vehicle.equipment.leather'],
  },
  {
    id: 'r3', name: 'Toyota RAV4', category: 'suv', seats: 5, gearbox: 'auto', fuel: 'petrol',
    pricePerDay: 45000, image: images.rentals.rav4,
    photos: photoSet(['wid-rav4-1', 'wid-rav4-2', 'wid-rav4-3', 'wid-rav4-4']),
    city: { fr: 'Cotonou', en: 'Cotonou' }, lat: 6.3572, lng: 2.4069, rating: 4.9, reviews: 18,
    description: {
      fr: 'SUV robuste et confortable, adapté aux routes urbaines comme aux pistes. Grand coffre et position de conduite surélevée.',
      en: 'Sturdy and comfortable SUV, suited to both city roads and rough tracks. Large trunk and elevated driving position.',
    },
    equipment: ['vehicle.equipment.bluetooth', 'vehicle.equipment.camera', 'vehicle.equipment.roof', 'vehicle.equipment.gps'],
  },
  {
    id: 'r4', name: 'Toyota Hilux', category: 'pickup', seats: 5, gearbox: 'manual', fuel: 'diesel',
    pricePerDay: 55000, image: images.rentals.hilux,
    photos: photoSet(['wid-hilux-1', 'wid-hilux-2', 'wid-hilux-3', 'wid-hilux-4']),
    city: { fr: 'Abomey-Calavi', en: 'Abomey-Calavi' }, lat: 6.4489, lng: 2.3556, rating: 4.7, reviews: 12,
    description: {
      fr: 'Pick-up 4x4 puissant pour les chantiers et les missions hors ville. Robuste, fiable et prêt à tout terrain.',
      en: 'Powerful 4x4 pickup for worksites and off-city missions. Sturdy, reliable and ready for any terrain.',
    },
    equipment: ['vehicle.equipment.roof', 'vehicle.equipment.bluetooth', 'vehicle.equipment.windows'],
  },
  {
    id: 'r5', name: 'Hyundai H1', category: 'minibus', seats: 9, gearbox: 'manual', fuel: 'diesel',
    pricePerDay: 60000, image: images.rentals.h1,
    photos: photoSet(['wid-h1-1', 'wid-h1-2', 'wid-h1-3', 'wid-h1-4']),
    city: { fr: 'Cotonou', en: 'Cotonou' }, lat: 6.3703, lng: 2.3912, rating: 4.8, reviews: 9,
    description: {
      fr: 'Minibus 9 places climatisé, parfait pour les groupes, les navettes et les transferts aéroport.',
      en: 'Air-conditioned 9-seat minibus, perfect for groups, shuttles and airport transfers.',
    },
    equipment: ['vehicle.equipment.bluetooth', 'vehicle.equipment.screen', 'vehicle.equipment.windows'],
  },
];

// --- Logements -----------------------------------------------------------

export type AptType = 'studio' | 'two' | 'three' | 'villa';
export type Feature = 'ac' | 'wifi' | 'hotwater' | 'guard' | 'parking' | 'generator' | 'garden';
export type AptRoom = 'facade' | 'salon' | 'chambre' | 'cuisine' | 'sdb' | 'exterieur';
export type AptPhoto = { room: AptRoom; source: ImageSourcePropType };

export type Apartment = {
  id: string;
  type: AptType;
  title: L;
  quartier: L;
  city: L;
  /** Libellé court « Ville · Quartier » utilisé dans les listes. */
  area: L;
  pricePerMonth: number;
  beds: number;
  baths: number;
  size: number;
  features: Feature[];
  description: L;
  image: ImageSourcePropType;
  photos: AptPhoto[];
  lat: number;
  lng: number;
  rating: number;
  reviews: number;
};

const rooms = (prefix: string, list: AptRoom[]): AptPhoto[] =>
  list.map((room) => ({ room, source: photoSet([`${prefix}-${room}`])[0] }));

export const apartments: Apartment[] = [
  {
    id: 'a1', type: 'studio',
    title: { fr: 'Studio meublé', en: 'Furnished studio' },
    quartier: { fr: 'Haie Vive', en: 'Haie Vive' },
    city: { fr: 'Cotonou', en: 'Cotonou' },
    area: { fr: 'Cotonou · Haie Vive', en: 'Cotonou · Haie Vive' },
    pricePerMonth: 150000, beds: 1, baths: 1, size: 28,
    features: ['ac', 'wifi', 'hotwater', 'guard'],
    description: {
      fr: 'Studio moderne et lumineux, entièrement meublé, proche des commerces et des restaurants. Séjour confortable, coin cuisine équipé et salle d’eau privative. Idéal pour un séjour court ou moyen.',
      en: 'Modern, bright, fully furnished studio close to shops and restaurants. Comfortable living area, equipped kitchenette and private bathroom. Ideal for a short or medium stay.',
    },
    image: images.apartments.studio, lat: 6.3572, lng: 2.4069, rating: 4.9, reviews: 19,
    photos: rooms('wid-a1', ['facade', 'salon', 'chambre', 'cuisine', 'sdb', 'exterieur']),
  },
  {
    id: 'a2', type: 'two',
    title: { fr: 'Appartement 2 pièces', en: '2-room apartment' },
    quartier: { fr: 'Fidjrossè', en: 'Fidjrossè' },
    city: { fr: 'Cotonou', en: 'Cotonou' },
    area: { fr: 'Cotonou · Fidjrossè', en: 'Cotonou · Fidjrossè' },
    pricePerMonth: 250000, beds: 2, baths: 1, size: 55,
    features: ['ac', 'parking', 'generator'],
    description: {
      fr: 'Appartement calme à quelques minutes de la plage, avec cuisine équipée et salon spacieux. Parking privé et groupe électrogène pour un confort sans coupure.',
      en: 'Quiet apartment a few minutes from the beach, with an equipped kitchen and spacious living room. Private parking and a generator for uninterrupted comfort.',
    },
    image: images.apartments.deux, lat: 6.3489, lng: 2.3737, rating: 4.8, reviews: 27,
    photos: rooms('wid-a2', ['facade', 'salon', 'chambre', 'cuisine', 'sdb', 'exterieur']),
  },
  {
    id: 'a3', type: 'three',
    title: { fr: 'Appartement 3 pièces', en: '3-room apartment' },
    quartier: { fr: 'Cadjèhoun', en: 'Cadjèhoun' },
    city: { fr: 'Cotonou', en: 'Cotonou' },
    area: { fr: 'Cotonou · Cadjèhoun', en: 'Cotonou · Cadjèhoun' },
    pricePerMonth: 400000, beds: 3, baths: 2, size: 90,
    features: ['ac', 'wifi', 'parking', 'guard'],
    description: {
      fr: 'Grand appartement familial avec salon spacieux, balcon et trois chambres. Résidence sécurisée avec gardien, proche des écoles et des commerces.',
      en: 'Large family apartment with a spacious living room, balcony and three bedrooms. Secure residence with a guard, close to schools and shops.',
    },
    image: images.apartments.trois, lat: 6.3593, lng: 2.4249, rating: 4.9, reviews: 15,
    photos: rooms('wid-a3', ['facade', 'salon', 'chambre', 'cuisine', 'sdb', 'exterieur']),
  },
  {
    id: 'a4', type: 'villa',
    title: { fr: 'Villa avec jardin', en: 'Villa with garden' },
    quartier: { fr: 'Calavi', en: 'Calavi' },
    city: { fr: 'Abomey-Calavi', en: 'Abomey-Calavi' },
    area: { fr: 'Abomey-Calavi', en: 'Abomey-Calavi' },
    pricePerMonth: 700000, beds: 4, baths: 3, size: 200,
    features: ['garden', 'parking', 'generator', 'guard'],
    description: {
      fr: 'Villa sécurisée avec jardin arboré, idéale pour une famille ou une entreprise. Quatre chambres, grand séjour, cuisine équipée et dépendance pour le personnel.',
      en: 'Secure villa with a landscaped garden, ideal for a family or a company. Four bedrooms, large living room, equipped kitchen and staff quarters.',
    },
    image: images.apartments.villa, lat: 6.4489, lng: 2.3556, rating: 5.0, reviews: 8,
    photos: rooms('wid-a4', ['facade', 'salon', 'chambre', 'cuisine', 'sdb', 'exterieur']),
  },
];

// --- Chauffeurs ----------------------------------------------------------

export type Chauffeur = {
  id: string; name: string; years: number; rating: number; langs: ('fr' | 'en' | 'fon')[];
  vehicle: string; priceHalf: number; priceDay: number; photo: ImageSourcePropType;
};
export const chauffeurs: Chauffeur[] = [
  { id: 'd1', name: 'Koffi A.', years: 8, rating: 4.9, langs: ['fr', 'en'], vehicle: 'Toyota Corolla', priceHalf: 15000, priceDay: 25000, photo: images.chauffeurs.c1 },
  { id: 'd2', name: 'Ibrahim S.', years: 5, rating: 4.8, langs: ['fr', 'fon'], vehicle: 'Toyota RAV4', priceHalf: 20000, priceDay: 35000, photo: images.chauffeurs.c2 },
  { id: 'd3', name: 'Marcel D.', years: 11, rating: 4.9, langs: ['fr', 'en'], vehicle: 'Hyundai H1', priceHalf: 25000, priceDay: 45000, photo: images.chauffeurs.c3 },
  { id: 'd4', name: 'Rodrigue H.', years: 4, rating: 4.7, langs: ['fr'], vehicle: 'Toyota Yaris', priceHalf: 12000, priceDay: 20000, photo: images.chauffeurs.c4 },
];

// --- Crypto (démo) -------------------------------------------------------

export type Coin = { id: string; name: string; symbol: string; price: number; change: number; decimals: number; color: string };
// Taux de démonstration : ils viendront du serveur
export const coins: Coin[] = [
  { id: 'usdt', name: 'Tether', symbol: 'USDT', price: 620, change: 0.1, decimals: 2, color: '#26A17B' },
  { id: 'usdc', name: 'USD Coin', symbol: 'USDC', price: 620, change: 0.0, decimals: 2, color: '#2775CA' },
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', price: 45000000, change: 1.8, decimals: 6, color: '#F7931A' },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', price: 1800000, change: -0.9, decimals: 5, color: '#627EEA' },
];
