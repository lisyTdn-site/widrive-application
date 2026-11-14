import type { ImageSourcePropType } from 'react-native';

// Images de test. Pour remplacer : mets ta photo dans assets/images
// puis écris par ex. :  yaris: require('@/assets/images/yaris.jpg'),
// (ou une URL : { uri: 'https://...' })
const p = (seed: string, w = 800, h = 560): ImageSourcePropType => ({
  uri: `https://picsum.photos/seed/${seed}/${w}/${h}`,
});

export const images = {
  rentals: {
    yaris: p('wid-yaris'),
    corolla: p('wid-corolla'),
    rav4: p('wid-rav4'),
    hilux: p('wid-hilux'),
    h1: p('wid-h1'),
  },
  apartments: {
    studio: p('wid-studio'),
    deux: p('wid-deux'),
    trois: p('wid-trois'),
    villa: p('wid-villa'),
  },
  chauffeurs: {
    c1: p('wid-chauf1', 400, 400),
    c2: p('wid-chauf2', 400, 400),
    c3: p('wid-chauf3', 400, 400),
    c4: p('wid-chauf4', 400, 400),
  },
  hero: {
    crypto: p('wid-crypto', 800, 320),
    cards: p('wid-cards', 800, 320),
  },
  ads: {
    a1: p('wid-ad1', 900, 420),
    a2: p('wid-ad2', 900, 420),
    a3: p('wid-ad3', 900, 420),
    a4: p('wid-ad4', 900, 420),
  },
};