import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { getSupabase } from '@/lib/supabase';
import { refreshBookings, resetBookings } from '@/lib/bookings';
import { refreshWallet, resetWallet } from '@/lib/wallet';

type Profile = { firstName: string; lastName: string; email: string; country: string };
type Remembered = { phone: string; country: string };

export type AuthError = 'exists' | 'notfound' | 'badpin' | 'locked' | 'blocked' | 'network' | 'resetunavailable';
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
  register: (input: RegisterInput, remember: boolean) => Promise<Result>;
  login: (phone: string, pin: string, remember: boolean) => Promise<Result>;
  resetPin: (phone: string, pin: string) => Promise<Result>;
  signOut: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);
// Auth : téléphone + PIN via l'Edge Function `auth-pin` (le PIN n'est ni stocké ni haché ici :
// il transite en TLS et est traité côté serveur). La session reste en mémoire côté UI :
// le PIN est redemandé à chaque ouverture. Seuls téléphone + pays « mémorisés » sont en local.
const K_REMEMBER = 'wid_remember_v1';

type FnResponse = { session?: { access_token: string; refresh_token: string }; error?: string };

async function callAuth(action: 'login' | 'register', body: Record<string, unknown>): Promise<FnResponse> {
  try {
    const { data, error } = await getSupabase().functions.invoke('auth-pin', { body: { action, ...body } });
    if (error) {
      // FunctionsHttpError : le corps JSON contient le code d'erreur.
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === 'function') {
        try {
          return (await ctx.json()) as FnResponse;
        } catch {}
      }
      return { error: 'network' };
    }
    return data as FnResponse;
  } catch {
    return { error: 'network' };
  }
}

function mapError(code?: string): AuthError {
  switch (code) {
    case 'phone_taken': return 'exists';
    case 'locked': return 'locked';
    case 'account_blocked': return 'blocked';
    case 'invalid_credentials': return 'badpin';
    default: return 'network';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
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
        const r = await AsyncStorage.getItem(K_REMEMBER);
        if (r) setRememberedState(JSON.parse(r));
        // Pas de reconnexion automatique : on purge toute session résiduelle.
        await getSupabase().auth.signOut({ scope: 'local' });
      } catch {}
      finish();
    })();
    return () => clearTimeout(timer);
  }, []);

  const persistRemember = (r: Remembered | null) => {
    setRememberedState(r);
    if (r) AsyncStorage.setItem(K_REMEMBER, JSON.stringify(r)).catch(() => {});
    else AsyncStorage.removeItem(K_REMEMBER).catch(() => {});
  };

  const openSession = async (session: NonNullable<FnResponse['session']>) => {
    const sb = getSupabase();
    const { error } = await sb.auth.setSession(session);
    return !error;
  };

  const loadProfile = async (fallbackCountry: string): Promise<Profile> => {
    const { data } = await getSupabase()
      .from('profiles')
      .select('first_name,last_name,email,country_code')
      .maybeSingle();
    return {
      firstName: data?.first_name ?? '',
      lastName: data?.last_name ?? '',
      email: data?.email ?? '',
      country: data?.country_code ?? fallbackCountry,
    };
  };

  const register = async (i: RegisterInput, remember: boolean): Promise<Result> => {
    const r = await callAuth('register', {
      phone: i.phone, pin: i.pin, firstName: i.firstName, lastName: i.lastName, country: i.country,
    });
    if (!r.session) return { ok: false, error: mapError(r.error) };
    if (await openSession(r.session)) {
      if (i.email) await getSupabase().from('profiles').update({ email: i.email }).not('id', 'is', null);
      await getSupabase().auth.signOut({ scope: 'local' });
    }
    persistRemember(remember ? { phone: i.phone, country: i.country } : null);
    // Volontairement : pas de connexion automatique (le PIN est ressaisi sur l'écran de connexion).
    return { ok: true };
  };

  const login = async (p: string, pin: string, remember: boolean): Promise<Result> => {
    const r = await callAuth('login', { phone: p, pin });
    if (!r.session) return { ok: false, error: mapError(r.error) };
    if (!(await openSession(r.session))) return { ok: false, error: 'network' };
    const prof = await loadProfile(remembered?.country ?? '');
    setProfile(prof);
    persistRemember(remember ? { phone: p, country: prof.country } : null);
    setPhone(p);
    void Promise.all([refreshWallet(), refreshBookings()]);
    return { ok: true };
  };

  // Sans vérification SMS du numéro, une réinitialisation serait une prise de compte :
  // désactivée tant qu'un fournisseur SMS n'est pas branché (docs/BACKEND.md).
  const resetPin = async (_phone: string, _pin: string): Promise<Result> => ({
    ok: false,
    error: 'resetunavailable',
  });

  const setRemember = (on: boolean) => {
    if (!phone) return;
    persistRemember(on ? { phone, country: profile?.country ?? '' } : null);
  };

  const signOut = () => {
    setPhone(null);
    setProfile(null);
    resetWallet();
    resetBookings();
    getSupabase().auth.signOut({ scope: 'local' }).catch(() => {});
  };

  const user: User | null = phone && profile ? { phone, ...profile } : null;
  const rememberOn = !!remembered && remembered.phone === phone;

  return (
    <AuthContext.Provider
      value={{ ready, phone, user, remembered, rememberOn, setRemember, register, login, resetPin, signOut }}
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