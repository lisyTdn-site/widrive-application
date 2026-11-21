import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { sb } from './supabase';
import type { Tables } from '../../src/types/database';

type Page = 'dashboard' | 'listings' | 'bookings' | 'users' | 'withdrawals' | 'audit';
const PAGES: [Page, string][] = [
  ['dashboard', 'Tableau de bord'],
  ['listings', 'Annonces'],
  ['bookings', 'Réservations'],
  ['users', 'Utilisateurs'],
  ['withdrawals', 'Retraits'],
  ['audit', "Journal d'audit"],
];

const xof = (n: number) => `${new Intl.NumberFormat('fr-FR').format(n)} FCFA`;
const dt = (s: string) => new Date(s).toLocaleString('fr-FR');

/** Message lisible pour une erreur Supabase / RPC. */
const msg = (e: { message: string } | null) =>
  !e ? '' : /forbidden/.test(e.message) ? 'Accès refusé.' : /insufficient_funds/.test(e.message) ? 'Solde insuffisant.' : e.message;

function useLoad<T>(fn: () => PromiseLike<{ data: T | null; error: { message: string } | null }>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    const r = await fn();
    setData(r.data);
    setError(msg(r.error));
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    void reload();
  }, [reload]);
  return { data, error, loading, reload };
}

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Le rôle est vérifié côté serveur : la RPC lève « forbidden » si l'utilisateur n'est pas admin.
  useEffect(() => {
    if (!session) {
      setAdmin(null);
      return;
    }
    sb.rpc('is_admin').then(({ data }) => setAdmin(data === true));
  }, [session]);

  if (!ready) return null;
  if (!session) return <Login />;
  if (admin === null) return <p style={{ padding: 24 }}>Vérification…</p>;
  if (!admin)
    return (
      <div className="login">
        <h2>Accès refusé</h2>
        <p>Ce compte n'a pas le rôle administrateur.</p>
        <button className="btn" onClick={() => sb.auth.signOut()}>Se déconnecter</button>
      </div>
    );
  return <Shell />;
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error: err } = await sb.auth.signInWithPassword({ email, password });
    setBusy(false);
    setError(err ? 'Identifiants invalides.' : '');
  };
  return (
    <form className="login" onSubmit={submit}>
      <h2>WIDRIVE — Administration</h2>
      <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
      <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
      {error && <div className="err">{error}</div>}
      <button className="btn" disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</button>
    </form>
  );
}

function Shell() {
  const [page, setPage] = useState<Page>('dashboard');
  return (
    <div className="shell">
      <nav>
        <h1>WIDRIVE Admin</h1>
        {PAGES.map(([k, label]) => (
          <button key={k} className={page === k ? 'on' : ''} onClick={() => setPage(k)}>{label}</button>
        ))}
        <button onClick={() => sb.auth.signOut()} style={{ marginTop: 'auto' }}>Déconnexion</button>
      </nav>
      <main>
        {page === 'dashboard' && <Dashboard />}
        {page === 'listings' && <Listings />}
        {page === 'bookings' && <Bookings />}
        {page === 'users' && <Users />}
        {page === 'withdrawals' && <Withdrawals />}
        {page === 'audit' && <Audit />}
      </main>
    </div>
  );
}

function State({ loading, error, children }: { loading: boolean; error: string; children: ReactNode }) {
  if (loading) return <p>Chargement…</p>;
  return (
    <>
      {error && <div className="err">{error}</div>}
      {children}
    </>
  );
}

function Dashboard() {
  const { data, error, loading } = useLoad(() => sb.rpc('admin_dashboard_stats'));
  const st = (data ?? {}) as Record<string, number>;
  const tiles: [string, string][] = [
    ['users', 'Utilisateurs'],
    ['listings_published', 'Annonces publiées'],
    ['listings_pending', 'Annonces en attente'],
    ['bookings_confirmed', 'Réservations confirmées'],
    ['bookings_pending', 'Réservations en attente'],
    ['withdrawals_pending', 'Retraits à valider'],
  ];
  return (
    <>
      <h2>Tableau de bord</h2>
      <State loading={loading} error={error}>
        <div className="grid">
          {tiles.map(([k, l]) => (
            <div className="card stat" key={k}><b>{st[k] ?? 0}</b><span>{l}</span></div>
          ))}
          <div className="card stat"><b>{xof(st.revenue_xof ?? 0)}</b><span>Encaissé (réservations confirmées)</span></div>
        </div>
      </State>
    </>
  );
}

function Listings() {
  const { data, error, loading, reload } = useLoad(() => sb.from('listings').select('*').order('created_at', { ascending: false }));
  const [err, setErr] = useState('');
  const [f, setF] = useState({ kind: 'vehicle_sale', title: '', city: '', price: '', unit: 'total' });

  const run = async (p: PromiseLike<{ error: { message: string } | null }>) => {
    const r = await p;
    setErr(msg(r.error));
    if (!r.error) await reload();
  };
  const add = async (e: FormEvent) => {
    e.preventDefault();
    await run(
      sb.from('listings').insert({
        kind: f.kind as Tables<'listings'>['kind'],
        title: f.title.trim(),
        city: f.city.trim() || null,
        price: Math.round(Number(f.price)),
        price_unit: f.unit,
        is_published: false,
      }),
    );
    setF({ ...f, title: '', price: '' });
  };

  return (
    <>
      <h2>Annonces</h2>
      <form className="row card" onSubmit={add}>
        <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
          <option value="vehicle_sale">Véhicule à vendre</option>
          <option value="vehicle_rental">Véhicule en location</option>
          <option value="housing">Logement</option>
        </select>
        <input placeholder="Titre" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required maxLength={200} />
        <input placeholder="Ville" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
        <input placeholder="Prix (XOF)" type="number" min={0} value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} required />
        <select value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })}>
          <option value="total">total</option><option value="day">/ jour</option><option value="month">/ mois</option>
        </select>
        <button className="btn">Ajouter (brouillon)</button>
      </form>
      {err && <div className="err">{err}</div>}
      <State loading={loading} error={error}>
        <div className="card scroll">
          <table>
            <thead><tr><th>Titre</th><th>Type</th><th>Ville</th><th>Prix</th><th>Statut</th><th /></tr></thead>
            <tbody>
              {(data ?? []).map((l) => (
                <tr key={l.id}>
                  <td>{l.title}</td><td>{l.kind}</td><td>{l.city ?? '—'}</td>
                  <td>{xof(l.price)} {l.price_unit !== 'total' ? `/${l.price_unit}` : ''}</td>
                  <td><span className="tag">{l.is_published ? 'Publiée' : 'Brouillon'}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn ghost" onClick={() => run(sb.from('listings').update({ is_published: !l.is_published }).eq('id', l.id))}>
                      {l.is_published ? 'Dépublier' : 'Publier'}
                    </button>{' '}
                    <button className="btn bad" onClick={() => confirm(`Supprimer « ${l.title} » ?`) && run(sb.from('listings').delete().eq('id', l.id))}>
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </State>
    </>
  );
}

function Bookings() {
  const { data, error, loading, reload } = useLoad(() => sb.from('bookings').select('*').order('created_at', { ascending: false }).limit(300));
  const [err, setErr] = useState('');
  const setStatus = async (id: string, status: Tables<'bookings'>['status']) => {
    const { error: e } = await sb.rpc('admin_set_booking_status', { p_booking_id: id, p_status: status });
    setErr(msg(e));
    if (!e) await reload();
  };
  return (
    <>
      <h2>Réservations</h2>
      {err && <div className="err">{err}</div>}
      <State loading={loading} error={error}>
        <div className="card scroll">
          <table>
            <thead><tr><th>Réf.</th><th>Bien</th><th>Période</th><th>Montant</th><th>Payé</th><th>Statut</th><th /></tr></thead>
            <tbody>
              {(data ?? []).map((b) => (
                <tr key={b.id}>
                  <td>{b.ref}</td><td>{b.title_snapshot}</td>
                  <td>{dt(b.start_at)} → {dt(b.end_at)}</td>
                  <td>{xof(b.amount)}</td><td>{xof(b.paid)}</td>
                  <td><span className="tag">{b.status}</span></td>
                  <td>
                    {b.status !== 'cancelled' && (
                      <button className="btn bad" onClick={() => confirm(`Annuler ${b.ref} (remboursement du portefeuille si payé) ?`) && setStatus(b.id, 'cancelled')}>
                        Annuler
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </State>
    </>
  );
}

function Users() {
  const { data, error, loading, reload } = useLoad(() => sb.from('profiles').select('*').order('created_at', { ascending: false }).limit(500));
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const block = async (id: string, blocked: boolean) => {
    const { error: e } = await sb.rpc('admin_set_user_blocked', { p_user: id, p_blocked: blocked });
    setErr(msg(e));
    if (!e) await reload();
  };
  const adjust = async (id: string) => {
    const a = prompt('Montant en FCFA (positif = crédit, négatif = débit) :');
    if (!a) return;
    const amount = Math.round(Number(a));
    if (!Number.isFinite(amount) || amount === 0) return setErr('Montant invalide.');
    const reason = prompt('Motif (obligatoire, enregistré dans le journal) :');
    if (!reason) return;
    const { error: e } = await sb.rpc('admin_wallet_adjust', { p_user: id, p_amount: amount, p_reason: reason });
    setErr(e ? msg(e) : 'Solde ajusté.');
  };
  const rows = (data ?? []).filter((u) => `${u.first_name} ${u.last_name} ${u.phone ?? ''}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <h2>Utilisateurs</h2>
      <div className="row"><input placeholder="Rechercher (nom, téléphone)" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {err && <div className={err === 'Solde ajusté.' ? 'ok' : 'err'}>{err}</div>}
      <State loading={loading} error={error}>
        <div className="card scroll">
          <table>
            <thead><tr><th>Nom</th><th>Téléphone</th><th>Inscrit le</th><th>État</th><th /></tr></thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td>{u.first_name} {u.last_name}</td><td>{u.phone}</td><td>{dt(u.created_at)}</td>
                  <td><span className="tag">{u.is_blocked ? 'Bloqué' : 'Actif'}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn ghost" onClick={() => adjust(u.id)}>Ajuster solde</button>{' '}
                    <button className={`btn ${u.is_blocked ? 'ghost' : 'bad'}`} onClick={() => block(u.id, !u.is_blocked)}>
                      {u.is_blocked ? 'Débloquer' : 'Bloquer'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </State>
    </>
  );
}

function Withdrawals() {
  const { data, error, loading, reload } = useLoad(() =>
    sb.from('wallet_transactions').select('*').eq('kind', 'out').eq('status', 'pending').eq('label_key', 'wallet.withdrawal').order('created_at'),
  );
  const [err, setErr] = useState('');
  const resolve = async (id: string, approve: boolean) => {
    const { error: e } = await sb.rpc('admin_resolve_withdrawal', { p_tx_id: id, p_approve: approve });
    setErr(msg(e));
    if (!e) await reload();
  };
  return (
    <>
      <h2>Retraits à valider</h2>
      <p style={{ color: 'var(--muted)' }}>Approuver = vous avez versé l'argent à l'utilisateur. Rejeter = le montant lui est restitué.</p>
      {err && <div className="err">{err}</div>}
      <State loading={loading} error={error}>
        <div className="card scroll">
          <table>
            <thead><tr><th>Date</th><th>Utilisateur</th><th>Montant</th><th>Méthode</th><th /></tr></thead>
            <tbody>
              {(data ?? []).map((t) => (
                <tr key={t.id}>
                  <td>{dt(t.created_at)}</td><td style={{ fontFamily: 'monospace' }}>{t.user_id.slice(0, 8)}</td>
                  <td>{xof(t.amount)}</td><td>{t.method}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn" onClick={() => confirm(`Confirmer le versement de ${xof(t.amount)} ?`) && resolve(t.id, true)}>Approuver</button>{' '}
                    <button className="btn bad" onClick={() => resolve(t.id, false)}>Rejeter</button>
                  </td>
                </tr>
              ))}
              {(data ?? []).length === 0 && <tr><td colSpan={5}>Aucun retrait en attente.</td></tr>}
            </tbody>
          </table>
        </div>
      </State>
    </>
  );
}

function Audit() {
  const { data, error, loading } = useLoad(() => sb.from('audit_log').select('*').order('id', { ascending: false }).limit(200));
  return (
    <>
      <h2>Journal d'audit</h2>
      <State loading={loading} error={error}>
        <div className="card scroll">
          <table>
            <thead><tr><th>Date</th><th>Action</th><th>Entité</th><th>Détails</th></tr></thead>
            <tbody>
              {(data ?? []).map((a) => (
                <tr key={a.id}>
                  <td>{dt(a.created_at)}</td><td>{a.action}</td><td>{a.entity} {a.entity_id?.slice(0, 8)}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{JSON.stringify(a.meta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </State>
    </>
  );
}
