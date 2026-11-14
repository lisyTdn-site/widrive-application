import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Account = { firstName: string; lastName: string; email: string; country: string; pin: string };
type Accounts = Record<string, Account>;
type Remembered = { phone: string; country: string };

export type AuthError = 'exists' | 'notfound' | 'badpin';
type Result = { ok: true } | { ok: false; error: AuthError };

export type User = { phone: string; firstName: string; lastName: string; email: string; country: string };
export type RegisterInput = {
  firstName: string; lastName: string; email: string; country: string; phone: string; pin: string;
};

type AuthValue = {
  ready: boolean;
  phone: string | null;
  user: User | null;
  remembered: Remembered | null;
  rememberOn: boolean;
  setRemember: (on: boolean) => void;
  hasAccount: (phone: string) => boolean;
  register: (input: RegisterInput, remember: boolean) => Promise<Result>;
  login: (phone: string, pin: string, remember: boolean) => Promise<Result>;
  resetPin: (phone: string, pin: string) => Promise<Result>;
  signOut: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);
// Démo : stockage local. Avec le vrai backend, le PIN sera haché côté serveur.
// La session reste en mémoire seulement : le PIN est redemandé à chaque ouverture.
const K_ACCOUNTS = 'wid_accounts_v2';
const K_REMEMBER = 'wid_remember_v1';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [accounts, setAccounts] = useState<Accounts>({});
  const [phone, setPhone] = useState<string | null>(null);
  const [remembered, setRememberedState] = useState<Remembered | null>(null);

  useEffect(() => {
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        setReady(true);
      }
    };
    const timer = setTimeout(finish, 2000);

    (async () => {
      try {
        const a = await AsyncStorage.getItem(K_ACCOUNTS);
        const r = await AsyncStorage.getItem(K_REMEMBER);
        if (a) setAccounts(JSON.parse(a));
        if (r) setRememberedState(JSON.parse(r));
      } catch {}
      finish();
    })();

    return () => clearTimeout(timer);
  }, []);

  const saveAccounts = async (next: Accounts) => {
    setAccounts(next);
    try {
      await AsyncStorage.setItem(K_ACCOUNTS, JSON.stringify(next));
    } catch {}
  };

  const persistRemember = (r: Remembered | null) => {
    setRememberedState(r);
    if (r) AsyncStorage.setItem(K_REMEMBER, JSON.stringify(r)).catch(() => {});
    else AsyncStorage.removeItem(K_REMEMBER).catch(() => {});
  };

  const hasAccount = (p: string) => !!accounts[p];

  const register = async (i: RegisterInput, remember: boolean): Promise<Result> => {
    if (accounts[i.phone]) return { ok: false, error: 'exists' };
    await saveAccounts({
      ...accounts,
      [i.phone]: { firstName: i.firstName, lastName: i.lastName, email: i.email, country: i.country, pin: i.pin },
    });
    persistRemember(remember ? { phone: i.phone, country: i.country } : null);
    setPhone(i.phone);
    return { ok: true };
  };

  const login = async (p: string, pin: string, remember: boolean): Promise<Result> => {
    const acc = accounts[p];
    if (!acc) return { ok: false, error: 'notfound' };
    if (acc.pin !== pin) return { ok: false, error: 'badpin' };
    persistRemember(remember ? { phone: p, country: acc.country } : null);
    setPhone(p);
    return { ok: true };
  };

  const resetPin = async (p: string, pin: string): Promise<Result> => {
    const acc = accounts[p];
    if (!acc) return { ok: false, error: 'notfound' };
    await saveAccounts({ ...accounts, [p]: { ...acc, pin } });
    return { ok: true };
  };

  const setRemember = (on: boolean) => {
    if (!phone) return;
    persistRemember(on ? { phone, country: accounts[phone]?.country ?? '' } : null);
  };

  const signOut = () => setPhone(null);

  const acc = phone ? accounts[phone] : undefined;
  const user: User | null = phone && acc ? { phone, ...acc } : null;
  const rememberOn = !!remembered && remembered.phone === phone;

  return (
    <AuthContext.Provider
      value={{ ready, phone, user, remembered, rememberOn, setRemember, hasAccount, register, login, resetPin, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}