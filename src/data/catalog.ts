import type { ImageSourcePropType } from 'react-native';
import { images } from '@/data/images';
import type { L } from '@/i18n';

export const SUPPORT_WHATSAPP = '2290199003132'; // à confirmer avec le client
export const DRIVER_PER_DAY = 10000; // chauffeur en option (à définir)

export type RentalCat = 'city' | 'sedan' | 'suv' | 'pickup' | 'minibus';
export type Rental = {
  id: string; name: string; category: RentalCat; seats: number;
  gearbox: 'manual' | 'auto'; fuel: 'petrol' | 'diesel'; pricePerDay: number; image: ImageSourcePropType;
};
export const rentals: Rental[] = [
  { id: 'r1', name: 'Toyota Yaris', category: 'city', seats: 5, gearbox: 'manual', fuel: 'petrol', pricePerDay: 20000, image: images.rentals.yaris },
  { id: 'r2', name: 'Toyota Corolla', category: 'sedan', seats: 5, gearbox: 'auto', fuel: 'petrol', pricePerDay: 30000, image: images.rentals.corolla },
  { id: 'r3', name: 'Toyota RAV4', category: 'suv', seats: 5, gearbox: 'auto', fuel: 'petrol', pricePerDay: 45000, image: images.rentals.rav4 },
  { id: 'r4', name: 'Toyota Hilux', category: 'pickup', seats: 5, gearbox: 'manual', fuel: 'diesel', pricePerDay: 55000, image: images.rentals.hilux },
  { id: 'r5', name: 'Hyundai H1', category: 'minibus', seats: 9, gearbox: 'manual', fuel: 'diesel', pricePerDay: 60000, image: images.rentals.h1 },
];

export type AptType = 'studio' | 'two' | 'three' | 'villa';
export type Feature = 'ac' | 'wifi' | 'hotwater' | 'guard' | 'parking' | 'generator' | 'garden';
export type Apartment = {
  id: string; type: AptType; title: L; area: L; pricePerMonth: number;
  beds: number; baths: number; size: number; features: Feature[];
  description: L; image: ImageSourcePropType;
};
export const apartments: Apartment[] = [
  {
    id: 'a1', type: 'studio', title: { fr: 'Studio meublé', en: 'Furnished studio' },
    area: { fr: 'Cotonou · Haie Vive', en: 'Cotonou · Haie Vive' }, pricePerMonth: 150000,
    beds: 1, baths: 1, size: 28, features: ['ac', 'wifi', 'hotwater', 'guard'],
    description: { fr: 'Studio moderne et lumineux, entièrement meublé, proche des commerces et restaurants.', en: 'Modern, bright, fully furnished studio close to shops and restaurants.' },
    image: images.apartments.studio,
  },
  {
    id: 'a2', type: 'two', title: { fr: 'Appartement 2 pièces', en: '2-room apartment' },
    area: { fr: 'Cotonou · Fidjrossè', en: 'Cotonou · Fidjrossè' }, pricePerMonth: 250000,
    beds: 2, baths: 1, size: 55, features: ['ac', 'parking', 'generator'],
    description: { fr: 'Appartement calme à quelques minutes de la plage, cuisine équipée.', en: 'Quiet apartment a few minutes from the beach, equipped kitchen.' },
    image: images.apartments.deux,
  },
  {
    id: 'a3', type: 'three', title: { fr: 'Appartement 3 pièces', en: '3-room apartment' },
    area: { fr: 'Cotonou · Cadjèhoun', en: 'Cotonou · Cadjèhoun' }, pricePerMonth: 400000,
    beds: 3, baths: 2, size: 90, features: ['ac', 'wifi', 'parking', 'guard'],
    description: { fr: 'Grand appartement familial, salon spacieux et balcon.', en: 'Large family apartment with a spacious living room and balcony.' },
    image: images.apartments.trois,
  },
  {
    id: 'a4', type: 'villa', title: { fr: 'Villa avec jardin', en: 'Villa with garden' },
    area: { fr: 'Abomey-Calavi', en: 'Abomey-Calavi' }, pricePerMonth: 700000,
    beds: 4, baths: 3, size: 200, features: ['garden', 'parking', 'generator', 'guard'],
    description: { fr: 'Villa sécurisée avec jardin, idéale pour une famille ou une entreprise.', en: 'Secure villa with garden, ideal for a family or a company.' },
    image: images.apartments.villa,
  },
];

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

export type Coin = { id: string; name: string; symbol: string; price: number; change: number; decimals: number; color: string };
// Taux de démonstration : ils viendront du serveur
export const coins: Coin[] = [
  { id: 'usdt', name: 'Tether', symbol: 'USDT', price: 620, change: 0.1, decimals: 2, color: '#26A17B' },
  { id: 'usdc', name: 'USD Coin', symbol: 'USDC', price: 620, change: 0.0, decimals: 2, color: '#2775CA' },
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', price: 45000000, change: 1.8, decimals: 6, color: '#F7931A' },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', price: 1800000, change: -0.9, decimals: 5, color: '#627EEA' },
];