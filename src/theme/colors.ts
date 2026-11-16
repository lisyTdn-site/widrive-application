// Palette unique de la marque WIDRIVE.
// Toute couleur de l'application doit venir d'ici (aucun hex en dur dans les écrans).

export const colors = {
  // --- Marque (bordeaux) ---
  accent: '#96364C',
  accentDark: '#762638',
  accentDeep: '#5E1E2D',
  accentTint: '#F7EAED',
  accentSoft: '#C4808F', // texte / icônes posés sur fond sombre

  // --- Fonds sombres (en-têtes, écran de bienvenue) ---
  primary: '#20232B',
  primaryDeep: '#191B21',
  darkSurface: '#2E333C',
  darkSurfaceAlt: '#3A404A',
  darkBorder: '#474E59',

  // --- Surfaces claires ---
  background: '#F5F4F2',
  surface: '#FFFFFF',
  surfaceAlt: '#F0EFED',
  border: '#E8E5E2',

  // --- Textes ---
  text: '#252832',
  textMuted: '#85858D',
  onDark: '#E9E9EB',
  onDarkMuted: '#A9ADB6',

  // --- Neutres ---
  white: '#FFFFFF',
  black: '#000000',

  // --- Statuts ---
  success: '#21845B',
  successTint: '#E8F4ED',
  warning: '#C58A32',
  warningTint: '#FAF1E3',
  danger: '#B83C4B',
  dangerTint: '#FBE9EB',

  // --- Divers ---
  gold: '#C7A66A',
  overlay: 'rgba(20, 23, 30, 0.58)',
} as const;
