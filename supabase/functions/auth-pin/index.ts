// WIDRIVE — Edge Function `auth-pin` : inscription / connexion téléphone + PIN.
// Le PIN n'est jamais stocké ni journalisé : on dérive un mot de passe
// HMAC-SHA256(PIN_PEPPER, "phone:pin") que Supabase Auth hache (bcrypt).
// Secrets requis (supabase secrets set) : PIN_PEPPER (≥ 32 car. aléatoires).
// SUPABASE_URL, SUPABASE_ANON_KEY et SUPABASE_SERVICE_ROLE_KEY sont injectés par la plateforme.
// Verrouillage : 5 échecs → 15 min (table auth_attempts).
// Limite connue : sans fournisseur SMS, la propriété du numéro n'est pas vérifiée
// et la réinitialisation du PIN est volontairement absente (voir docs/BACKEND.md).
import { createClient } from 'npm:@supabase/supabase-js@2';

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const url = Deno.env.get('SUPABASE_URL')!;
const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});
const anon = () =>
  createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false } });

async function derive(phone: string, pin: string): Promise<string> {
  const pepper = Deno.env.get('PIN_PEPPER');
  if (!pepper || pepper.length < 32) throw new Error('PIN_PEPPER manquant');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pepper),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${phone}:${pin}`));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Identifiant technique : évite de dépendre du fournisseur « Phone » de Supabase Auth
// (inutile sans SMS). L'utilisateur ne le voit jamais ; profiles.email reste vide.
const techEmail = (phone: string) => `p${phone.replace(/\D/g, '')}@phone.widrive.app`;

const validPhone = (p: unknown): p is string => typeof p === 'string' && /^\+[1-9]\d{7,14}$/.test(p);
const validPin = (p: unknown): p is string => typeof p === 'string' && /^\d{4}$/.test(p);
const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

async function lockedUntil(phone: string): Promise<Date | null> {
  const { data } = await admin.from('auth_attempts').select('locked_until').eq('phone', phone).maybeSingle();
  const d = data?.locked_until ? new Date(data.locked_until) : null;
  return d && d > new Date() ? d : null;
}
async function recordFailure(phone: string) {
  const { data } = await admin.from('auth_attempts').select('attempts').eq('phone', phone).maybeSingle();
  const attempts = (data?.attempts ?? 0) + 1;
  const lock = attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString() : null;
  await admin.from('auth_attempts').upsert({
    phone, attempts: lock ? 0 : attempts, locked_until: lock, updated_at: new Date().toISOString(),
  });
}
const clearFailures = (phone: string) => admin.from('auth_attempts').delete().eq('phone', phone);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: 'invalid_json' }, 400); }

  const { action, phone, pin } = body;
  if (!validPhone(phone) || !validPin(pin)) return json({ error: 'invalid_credentials_format' }, 400);

  const until = await lockedUntil(phone);
  if (until) return json({ error: 'locked', retry_at: until.toISOString() }, 429);

  const password = await derive(phone, pin);

  if (action === 'register') {
    const { data: created, error } = await admin.auth.admin.createUser({
      email: techEmail(phone), email_confirm: true,
      phone, password, phone_confirm: true,
      user_metadata: {
        first_name: clean(body.firstName, 80),
        last_name: clean(body.lastName, 80),
        country_code: clean(body.country, 2).toUpperCase() || 'BJ',
      },
    });
    if (error) {
      const exists = /already|registered|exists/i.test(error.message);
      return json({ error: exists ? 'phone_taken' : 'register_failed' }, exists ? 409 : 400);
    }
    // Le profil ne doit pas exposer l'e-mail technique.
    if (created?.user) await admin.from('profiles').update({ email: null }).eq('id', created.user.id);
    // enchaîne sur une connexion pour renvoyer la session
  } else if (action !== 'login') {
    return json({ error: 'unknown_action' }, 400);
  }

  let { data, error } = await anon().auth.signInWithPassword({ email: techEmail(phone), password });
  // Comptes créés avant ce changement (identifiant téléphone seul) : tentative de repli.
  if (error || !data.session) ({ data, error } = await anon().auth.signInWithPassword({ phone, password }));
  if (error || !data.session) {
    // Diagnostic (sans PIN ni mot de passe dérivé) : visible dans les logs de la fonction.
    console.error(`auth-pin ${String(action)} signIn failed:`, error?.status, error?.code, error?.message);
    await recordFailure(phone);
    return json({ error: 'invalid_credentials' }, 401); // message identique : pas d'énumération
  }

  const { data: prof } = await admin.from('profiles').select('is_blocked').eq('id', data.user.id).maybeSingle();
  if (prof?.is_blocked) return json({ error: 'account_blocked' }, 403);

  await clearFailures(phone);
  return json({
    session: { access_token: data.session.access_token, refresh_token: data.session.refresh_token },
  });
});
