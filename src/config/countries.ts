type L = { fr: string; en: string };
export type Country = {
  code: string;
  flag: string;
  name: L;
  dial: string;
  phoneLength: number;
  currency: 'XOF' | 'XAF';
  enabled: boolean; // true = proposé dans l'app
};

export const countries: Country[] = [
  { code: 'BJ', flag: '🇧🇯', name: { fr: 'Bénin', en: 'Benin' }, dial: '+229', phoneLength: 10, currency: 'XOF', enabled: true },
  { code: 'TG', flag: '🇹🇬', name: { fr: 'Togo', en: 'Togo' }, dial: '+228', phoneLength: 8, currency: 'XOF', enabled: false },
  { code: 'CI', flag: '🇨🇮', name: { fr: 'Côte d’Ivoire', en: 'Ivory Coast' }, dial: '+225', phoneLength: 10, currency: 'XOF', enabled: false },
  { code: 'SN', flag: '🇸🇳', name: { fr: 'Sénégal', en: 'Senegal' }, dial: '+221', phoneLength: 9, currency: 'XOF', enabled: false },
  { code: 'BF', flag: '🇧🇫', name: { fr: 'Burkina Faso', en: 'Burkina Faso' }, dial: '+226', phoneLength: 8, currency: 'XOF', enabled: false },
  { code: 'NE', flag: '🇳🇪', name: { fr: 'Niger', en: 'Niger' }, dial: '+227', phoneLength: 8, currency: 'XOF', enabled: false },
];

export const activeCountries = countries.filter((c) => c.enabled);
export const DEFAULT_COUNTRY = countries[0];