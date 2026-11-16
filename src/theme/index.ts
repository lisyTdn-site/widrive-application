import { colors } from './colors';

export { colors };

/**
 * Design system WIDRIVE
 * -----------------------------------------------------------
 * Toutes les valeurs visuelles de l'app viennent d'ici.
 * Objectif : un rendu cohérent et professionnel, sans valeurs
 * "magiques" dispersées dans les écrans.
 */

// Échelle d'espacement (multiples de 4).
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// Rayons de bordure.
export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  pill: 999,
} as const;

// Familles de police (Plus Jakarta Sans, chargées dans _layout.tsx).
// On n'utilise pas `fontWeight` : chaque graisse est une famille distincte.
export const font = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

// Ombres prêtes à l'emploi (iOS + Android).
export const shadow = {
  card: {
    shadowColor: colors.primary,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  raised: {
    shadowColor: colors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
} as const;
