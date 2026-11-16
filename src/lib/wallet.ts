// Portefeuille WIDRIVE : solde + historique, persistés localement (démo).
// `deposit` / `withdraw` mettent à jour le solde et ajoutent une opération.

import { createStore, uid, useStore } from '@/lib/store';

export const CURRENCY = 'XOF';

export function fmt(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(amount);
}

export function money(amount: number): string {
  return `${fmt(amount)} FCFA`;
}

export type TxKind = 'in' | 'out';
export type TxMethod = 'wallet' | 'momo' | 'cash';

export type Tx = {
  id: string;
  kind: TxKind;
  /** Clé i18n (ex. 'home.deposit'). */
  labelKey: string;
  /** Texte brut, prioritaire sur `labelKey` si fourni. */
  labelText?: string;
  vars?: Record<string, string | number>;
  amount: number;
  /** Horodatage (ms) : sert au tri et au filtrage par période. */
  at: number;
  method?: TxMethod;
};

type WalletState = { balance: number; txs: Tx[] };

export const OPENING_BALANCE = 250000;

const daysAgo = (n: number, hour = 12): number => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
};

const seed: WalletState = {
  balance: OPENING_BALANCE,
  txs: [
    { id: 'tx_seed_1', kind: 'in', labelKey: 'home.deposit', amount: 50000, at: daysAgo(1), method: 'momo' },
    { id: 'tx_seed_2', kind: 'out', labelKey: 'wt.rental', amount: 20000, at: daysAgo(3), method: 'wallet' },
    { id: 'tx_seed_3', kind: 'out', labelKey: 'cry.title', amount: 15000, at: daysAgo(6), method: 'wallet' },
    { id: 'tx_seed_4', kind: 'in', labelKey: 'home.deposit', amount: 30000, at: daysAgo(9), method: 'momo' },
    { id: 'tx_seed_5', kind: 'out', labelKey: 'home.withdraw', amount: 10000, at: daysAgo(13), method: 'wallet' },
    { id: 'tx_seed_6', kind: 'in', labelKey: 'home.deposit', amount: 120000, at: daysAgo(24), method: 'momo' },
    { id: 'tx_seed_7', kind: 'out', labelKey: 'wt.rental', amount: 60000, at: daysAgo(38), method: 'wallet' },
  ],
};

export const wallet = createStore<WalletState>('wid_wallet_v1', seed);

export function useWallet(): WalletState {
  return useStore(wallet);
}

function push(tx: Omit<Tx, 'id'>): Tx {
  const entry: Tx = { ...tx, id: uid('tx') };
  wallet.set((prev) => ({ balance: prev.balance, txs: [entry, ...prev.txs] }));
  return entry;
}

export function deposit(amount: number, method: TxMethod = 'momo', labelKey = 'home.deposit'): Tx {
  const entry: Tx = {
    id: uid('tx'),
    kind: 'in',
    labelKey,
    amount,
    at: Date.now(),
    method,
  };
  wallet.set((prev) => ({ balance: prev.balance + amount, txs: [entry, ...prev.txs] }));
  return entry;
}

export function withdraw(amount: number, method: TxMethod = 'momo', labelKey = 'home.withdraw'): Tx | null {
  if (wallet.get().balance < amount) return null;
  const entry: Tx = {
    id: uid('tx'),
    kind: 'out',
    labelKey,
    amount,
    at: Date.now(),
    method,
  };
  wallet.set((prev) => ({ balance: prev.balance - amount, txs: [entry, ...prev.txs] }));
  return entry;
}

/** Enregistre un paiement par solde WIDRIVE (utilisé par la feuille de paiement). */
export function chargeWallet(amount: number, labelText: string): boolean {
  if (wallet.get().balance < amount) return false;
  wallet.set((prev) => ({
    balance: prev.balance - amount,
    txs: [
      { id: uid('tx'), kind: 'out', labelKey: 'pay.txLabel', labelText, amount, at: Date.now(), method: 'wallet' },
      ...prev.txs,
    ],
  }));
  return true;
}

/** Rembourse un paiement (annulation de réservation). */
export function refundWallet(amount: number, labelText: string): void {
  wallet.set((prev) => ({
    balance: prev.balance + amount,
    txs: [
      { id: uid('tx'), kind: 'in', labelKey: 'pay.refundLabel', labelText, amount, at: Date.now(), method: 'wallet' },
      ...prev.txs,
    ],
  }));
}

export { push as pushTransaction };
