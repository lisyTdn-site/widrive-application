import type { ImageSourcePropType } from 'react-native';
import { images } from '@/data/images';
import type { L } from '@/i18n';

export type Ad = { id: string; tag: L; title: L; sub: L; image: ImageSourcePropType; route?: string };

export const ads: Ad[] = [
  {
    id: 'a1',
    tag: { fr: 'Location', en: 'Rental' },
    title: { fr: '-10 % sur ta première location', en: '10% off your first rental' },
    sub: { fr: 'Réserve en quelques clics', en: 'Book in a few taps' },
    image: images.ads.a1,
    route: '/location',
  },
  {
    id: 'a2',
    tag: { fr: 'Vente', en: 'Sell' },
    title: { fr: 'Vends ton véhicule vite', en: 'Sell your vehicle fast' },
    sub: { fr: 'Publie ton annonce gratuitement', en: 'Post your listing for free' },
    image: images.ads.a2,
    route: '/vendre',
  },
  {
    id: 'a3',
    tag: { fr: 'WIDRIVE RIDE', en: 'WIDRIVE RIDE' },
    title: { fr: 'Un chauffeur à ta disposition', en: 'A chauffeur at your service' },
    sub: { fr: 'Confort et sécurité', en: 'Comfort and safety' },
    image: images.ads.a3,
    route: '/ride',
  },
  {
    id: 'a4',
    tag: { fr: 'Crypto', en: 'Crypto' },
    title: { fr: 'Échange ou passe en P2P', en: 'Exchange or go P2P' },
    sub: { fr: 'USDT, BTC, ETH', en: 'USDT, BTC, ETH' },
    image: images.ads.a4,
    route: '/crypto',
  },
];