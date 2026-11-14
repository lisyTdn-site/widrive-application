// src/lib/wallet.ts

export const BALANCE = 250000;

export const CURRENCY = 'XOF';

export function fmt(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(amount);
}

export function money(amount: number): string {
  return `${fmt(amount)} FCFA`;
}