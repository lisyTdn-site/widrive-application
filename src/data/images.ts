import type { ImageSourcePropType } from 'react-native';

// ---------------------------------------------------------------------------
// Photos de démonstration.
//
// Les vraies photos (véhicules, logements) ne sont pas encore disponibles : la
// base ne contient pour l'instant que le schéma, sans données ni médias. On
// utilise donc des images libres, choisies pour être *pertinentes* (voiture,
// logement, intérieur, portrait…) plutôt que des photos aléatoires.
//
// Pour brancher les vraies photos plus tard : dépose le fichier dans
// assets/images puis remplace l'URL par ex.
//   yaris: require('@/assets/images/yaris.jpg'),
// ---------------------------------------------------------------------------

const pix = (path: string): ImageSourcePropType => ({
  uri: `https://cdn.pixabay.com/photo/${path}`,
});

const rentals = {
  yaris: pix('2016/03/28/09/37/car-1285174_1280.jpg'),
  corolla: pix('2012/12/21/10/07/toyota-71598_1280.jpg'),
  rav4: pix('2016/08/23/11/02/toyota-1614081_1280.jpg'),
  hilux: pix('2016/10/26/10/59/pickup-1771168_1280.jpg'),
  h1: pix('2024/10/01/07/54/bus-9087465_1280.jpg'),
};

/** Intérieurs de voiture, communs à toutes les galeries de location. */
const carInterior = [
  pix('2017/08/22/00/27/car-dashboard-2667434_1280.jpg'),
  pix('2017/12/28/23/41/car-3046424_1280.jpg'),
  pix('2023/04/28/02/43/car-7955720_1280.jpg'),
];

const apartments = {
  studio: pix('2017/01/07/17/48/interior-1961070_1280.jpg'),
  deux: pix('2017/03/19/01/43/living-room-2155376_1280.jpg'),
  trois: pix('2024/11/07/18/48/sofa-9181557_1280.jpg'),
  villa: pix('2017/04/10/22/28/residence-2219972_1280.jpg'),
};

const rooms = {
  salon: pix('2016/04/18/13/53/room-1336497_1280.jpg'),
  chambre: pix('2020/11/24/11/36/bedroom-5772286_1280.jpg'),
  cuisine: pix('2017/03/22/17/39/kitchen-2165756_1280.jpg'),
  sdb: pix('2021/10/06/15/05/bathroom-6686057_1280.jpg'),
};

const chauffeurs = {
  c1: pix('2021/01/31/08/25/man-5966217_1280.jpg'),
  c2: pix('2023/03/17/16/55/man-7859085_1280.jpg'),
  c3: pix('2019/10/22/13/43/portrait-4568762_1280.jpg'),
  c4: pix('2022/06/17/13/36/man-7267949_1280.jpg'),
};

const hero = {
  crypto: pix('2018/01/18/07/31/bitcoin-3089728_1280.jpg'),
  cards: pix('2016/08/10/15/01/credit-cards-1583534_1280.jpg'),
};

const ads = {
  a1: pix('2017/01/06/05/28/car-1957037_1280.jpg'),
  a2: pix('2016/03/28/09/37/car-1285174_1280.jpg'),
  a3: pix('2023/04/28/07/16/man-7956041_1280.jpg'),
  a4: pix('2016/11/10/05/09/bitcoin-1813503_1280.jpg'),
};

export const images = { rentals, carInterior, apartments, rooms, chauffeurs, hero, ads };

// --- Fabriques génériques (compatibilité) ---------------------------------
// `photo` / `photoSet` restent disponibles pour tout contenu sans image
// dédiée : la graine est rapprochée d'une catégorie quand elle en contient le
// mot-clé, sinon une image déterministe est choisie dans un fonds commun.

const pool: ImageSourcePropType[] = [
  rentals.yaris,
  rentals.corolla,
  rentals.rav4,
  rentals.hilux,
  rentals.h1,
  apartments.studio,
  apartments.deux,
  apartments.trois,
  apartments.villa,
  rooms.salon,
  rooms.chambre,
  rooms.cuisine,
  rooms.sdb,
];

const hash = (seed: string): number => {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const keyword = (seed: string): ImageSourcePropType | null => {
  const s = seed.toLowerCase();
  if (s.includes('yaris')) return rentals.yaris;
  if (s.includes('corolla')) return rentals.corolla;
  if (s.includes('rav4')) return rentals.rav4;
  if (s.includes('hilux')) return rentals.hilux;
  if (s.includes('h1')) return rentals.h1;
  if (s.includes('studio')) return apartments.studio;
  if (s.includes('villa')) return apartments.villa;
  if (s.includes('salon') || s.includes('living')) return rooms.salon;
  if (s.includes('chambre') || s.includes('bed')) return rooms.chambre;
  if (s.includes('cuisine') || s.includes('kitchen')) return rooms.cuisine;
  if (s.includes('sdb') || s.includes('bath')) return rooms.sdb;
  if (s.includes('facade') || s.includes('exterieur')) return apartments.villa;
  return null;
};

/** Choisit une photo de démonstration à partir d'une graine. */
export const photo = (seed: string): ImageSourcePropType =>
  keyword(seed) ?? pool[hash(seed) % pool.length];

/** Choisit une galerie de photos de démonstration à partir de graines. */
export const photoSet = (seeds: string[]): ImageSourcePropType[] => seeds.map(photo);
