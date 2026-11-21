// Portefeuille WIDRIVE : solde + historique lus depuis Supabase (grand livre `wallet_transactions`).
// Le client ne modifie JAMAIS le solde : paiements/remboursements passent par les RPC
// `pay_booking_wallet` / `cancel_booking`, retraits par `request_withdrawal` (validés par un admin).
// Recharge : indisponible tant qu'un agrégateur Mobile Money n'est pas branché (WALLET_TOPUP_ENABLED).

import { getSupabase } from '@/lib/supabase';
import { createLiveStore, useStore } from '@/lib/store';

export const WALLET_TOPUP_ENABLED = false;

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

type WalletState = { balance: number; txs: Tx[]; loaded: boolean };

export const wallet = createLiveStore<WalletState>({ balance: 0, txs: [], loaded: false });

export function useWallet(): WalletState {
  return useStore(wallet);
}

export function resetWallet(): void {
  wallet.set({ balance: 0, txs: [], loaded: false });
}

/** Recharge solde + historique depuis le serveur. */
export async function refreshWallet(): Promise<void> {
  const sb = getSupabase();
  const [bal, txs] = await Promise.all([
    sb.rpc('wallet_balance'),
    sb
      .from('wallet_transactions')
      .select('id,kind,amount,method,status,label_key,label_text,label_vars,created_at')
      .neq('status', 'failed')
      .order('created_at', { ascending: false })
      .limit(200),
  ]);
  if (bal.error || txs.error) return;
  wallet.set({
    balance: Number(bal.data ?? 0),
    loaded: true,
    txs: (txs.data ?? []).map((r) => ({
      id: r.id,
      kind: r.kind,
      labelKey:
        r.label_key === 'wallet.withdrawal' ? 'home.withdraw' : (r.label_key ?? (r.kind === 'in' ? 'home.deposit' : 'home.withdraw')),
      labelText: r.label_text ?? undefined,
      vars: (r.label_vars ?? {}) as Record<string, string | number>,
      amount: r.amount,
      at: new Date(r.created_at).getTime(),
      method: (r.method ?? undefined) as TxMethod | undefined,
    })),
  });
}

/** Demande de retrait : le montant est réservé, un administrateur valide ensuite. */
export async function requestWithdrawal(amount: number, method: TxMethod): Promise<'ok' | 'insufficient' | 'error'> {
  const { error } = await getSupabase().rpc('request_withdrawal', { p_amount: amount, p_method: method });
  if (error) return /insufficient_funds/.test(error.message) ? 'insufficient' : 'error';
  await refreshWallet();
  return 'ok';
}

/** Paiement d'une réservation par portefeuille (débit + confirmation atomiques côté serveur). */
export async function payBookingWithWallet(bookingId: string, full: boolean): Promise<'ok' | 'insufficient' | 'error'> {
  const { error } = await getSupabase().rpc('pay_booking_wallet', { p_booking_id: bookingId, p_full: full });
  await refreshWallet();
  if (error) return /insufficient_funds/.test(error.message) ? 'insufficient' : 'error';
  return 'ok';
}
