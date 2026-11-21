-- WIDRIVE — schéma initial minimal (profiles, listings, bookings, wallet_transactions).
-- Voir docs/BACKEND.md. Aucun secret ici ; AUCUN PIN n'est stocké dans ces tables
-- (le PIN relève de l'authentification, géré côté serveur plus tard).
-- Montants : integer en XOF (pas de décimales). Horodatages : timestamptz (UTC).

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
-- btree_gist : contrainte d'exclusion anti-chevauchement des réservations.
create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------------------
-- Types énumérés
-- ---------------------------------------------------------------------------
create type public.listing_kind as enum ('vehicle_sale', 'vehicle_rental', 'housing');
create type public.booking_status as enum ('pending', 'confirmed', 'cancelled');
create type public.payment_method as enum ('wallet', 'momo', 'cash');
create type public.wallet_tx_kind as enum ('in', 'out');
create type public.wallet_tx_status as enum ('pending', 'completed', 'failed');

-- ---------------------------------------------------------------------------
-- Fonction utilitaire : updated_at
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles (1–1 avec auth.users) — jamais de PIN ici
-- ---------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  phone        text unique,
  first_name   text not null default '',
  last_name    text not null default '',
  email        text,
  country_code text not null default 'BJ' check (country_code ~ '^[A-Z]{2}$'),
  lang         text not null default 'fr' check (lang in ('fr', 'en')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Crée le profil automatiquement à la création d'un utilisateur Auth.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, phone, first_name, last_name, email, country_code)
  values (
    new.id,
    nullif(new.phone, ''),
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    nullif(new.email, ''),
    coalesce(nullif(upper(new.raw_user_meta_data ->> 'country_code'), ''), 'BJ')
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- listings (véhicules à vendre, véhicules en location, logements)
-- ---------------------------------------------------------------------------
create table public.listings (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid references public.profiles (id) on delete set null,
  kind         public.listing_kind not null,
  title        text not null check (char_length(title) between 1 and 200),
  description  jsonb not null default '{}'::jsonb,       -- ex. {"fr": "...", "en": "..."}
  city         text,
  lat          double precision check (lat between -90 and 90),
  lng          double precision check (lng between -180 and 180),
  price        integer not null check (price >= 0),       -- XOF
  price_unit   text not null check (price_unit in ('total', 'day', 'month')),
  attributes   jsonb not null default '{}'::jsonb,        -- spécifique au type (km, sièges, pièces…)
  image_urls   text[] not null default '{}',
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index listings_kind_published_idx on public.listings (kind, is_published);
create index listings_owner_idx on public.listings (owner_id);

create trigger listings_set_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------------
create table public.bookings (
  id             uuid primary key default gen_random_uuid(),
  ref            text not null unique
                   default ('WD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  listing_id     uuid not null references public.listings (id) on delete restrict,
  title_snapshot text not null,                           -- titre figé au moment de la réservation
  start_at       timestamptz not null,
  end_at         timestamptz not null,
  amount         integer not null check (amount >= 0),    -- XOF
  deposit        integer not null default 0 check (deposit >= 0),
  paid           integer not null default 0 check (paid >= 0),
  method         public.payment_method,
  status         public.booking_status not null default 'pending',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint bookings_range_chk check (end_at > start_at),
  constraint bookings_deposit_chk check (deposit <= amount),
  constraint bookings_paid_chk check (paid <= amount),
  -- Interdit deux réservations actives qui se chevauchent sur la même annonce.
  constraint bookings_no_overlap exclude using gist (
    listing_id with =,
    tstzrange(start_at, end_at) with &&
  ) where (status <> 'cancelled')
);

create index bookings_user_created_idx on public.bookings (user_id, created_at desc);
create index bookings_listing_idx on public.bookings (listing_id);

create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- wallet_transactions : grand livre. Le solde = somme(in) - somme(out) des
-- lignes 'completed'. Écrit uniquement par le serveur (RPC / Edge Functions).
-- ---------------------------------------------------------------------------
create table public.wallet_transactions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  kind            public.wallet_tx_kind not null,
  amount          integer not null check (amount > 0),     -- XOF
  currency        text not null default 'XOF' check (currency = 'XOF'),
  method          public.payment_method,
  status          public.wallet_tx_status not null default 'pending',
  label_key       text,                                    -- clé i18n (ex. 'home.deposit')
  label_text      text,
  label_vars      jsonb not null default '{}'::jsonb,
  booking_id      uuid references public.bookings (id) on delete set null,
  idempotency_key text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint wallet_tx_idem_uniq unique (user_id, idempotency_key)
);

create index wallet_tx_user_created_idx on public.wallet_transactions (user_id, created_at desc);
create index wallet_tx_booking_idx on public.wallet_transactions (booking_id);

create trigger wallet_transactions_set_updated_at
  before update on public.wallet_transactions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Créneaux occupés (sans données personnelles), lisibles par tout utilisateur
-- connecté pour afficher le calendrier. SECURITY DEFINER car la RLS de
-- `bookings` masque les réservations des autres.
-- ---------------------------------------------------------------------------
create function public.get_busy_slots(
  p_listing_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns table (start_at timestamptz, end_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select b.start_at, b.end_at
  from public.bookings b
  where b.listing_id = p_listing_id
    and b.status <> 'cancelled'
    and b.start_at < p_to
    and b.end_at > p_from
  order by b.start_at;
$$;

revoke execute on function public.get_busy_slots(uuid, timestamptz, timestamptz) from public, anon;
grant execute on function public.get_busy_slots(uuid, timestamptz, timestamptz) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security : activée partout, refus par défaut.
-- ---------------------------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.listings            enable row level security;
alter table public.bookings            enable row level security;
alter table public.wallet_transactions enable row level security;

-- profiles : chacun lit et modifie uniquement son profil. Pas d'INSERT/DELETE
-- côté client (création par trigger, suppression via Auth).
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- listings : annonces publiées lisibles par les utilisateurs connectés ;
-- le propriétaire gère les siennes, mais ne peut pas les publier lui-même
-- (publication/modération par un administrateur via service role).
create policy "listings_select_published_or_own" on public.listings
  for select to authenticated
  using (is_published or owner_id = (select auth.uid()));

create policy "listings_insert_own_unpublished" on public.listings
  for insert to authenticated
  with check (owner_id = (select auth.uid()) and not is_published);

create policy "listings_update_own_unpublished" on public.listings
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()) and not is_published);

create policy "listings_delete_own" on public.listings
  for delete to authenticated
  using (owner_id = (select auth.uid()));

-- bookings : privées. Le client peut lire les siennes et en créer une
-- 'pending' non payée sur une annonce publiée. Toute autre transition
-- (paiement, confirmation, annulation) passera par RPC serveur plus tard.
create policy "bookings_select_own" on public.bookings
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "bookings_insert_own_pending" on public.bookings
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending'
    and paid = 0
    and exists (
      select 1 from public.listings l
      where l.id = listing_id and l.is_published
    )
  );

-- wallet_transactions : lecture de son propre historique uniquement.
-- Aucune politique INSERT/UPDATE/DELETE : seul le serveur (service role,
-- fonctions SECURITY DEFINER) écrit dans le grand livre.
create policy "wallet_tx_select_own" on public.wallet_transactions
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Droits SQL : retire l'accès anonyme aux tables, limite l'écriture au strict nécessaire.
revoke all on public.profiles, public.listings, public.bookings, public.wallet_transactions from anon;
revoke insert, update, delete on public.wallet_transactions from authenticated;
revoke delete on public.bookings from authenticated;
revoke update on public.bookings from authenticated;
revoke insert, delete on public.profiles from authenticated;
-- Lecture publique du catalogue publié, pour que l'écran « Véhicules » fonctionne
-- AVANT la migration de l'authentification (l'app utilise encore l'auth locale, donc
-- aucune session Supabase : les requêtes passent par le rôle `anon`).
--
-- Périmètre volontairement étroit :
--   * uniquement les annonces `is_published = true` ;
--   * uniquement des colonnes publiques (PAS `owner_id`) ;
--   * lecture seule.
-- Réversible : une migration future peut retirer la politique et le grant une fois
-- l'authentification Supabase en place.

create policy "listings_select_published_anon" on public.listings
  for select to anon
  using (is_published);

grant select (
  id, kind, title, description, city, lat, lng,
  price, price_unit, attributes, image_urls, is_published, created_at, updated_at
) on public.listings to anon;
-- WIDRIVE — 0003 : rôles/admin, durcissement RLS, RPC atomiques (réservations,
-- portefeuille), journal d'audit, verrouillage anti brute-force du PIN.
-- Principe : le client demande, le serveur décide. Aucun PIN stocké ici.

-- ---------------------------------------------------------------------------
-- Rôles
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('admin');

create table public.user_roles (
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       public.app_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);
alter table public.user_roles enable row level security;
-- Aucune politique : table lisible/écrite uniquement par le service role et is_admin().
revoke all on public.user_roles from anon, authenticated;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles r
    where r.user_id = (select auth.uid()) and r.role = 'admin'
  );
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- profiles : blocage + colonnes modifiables restreintes
-- ---------------------------------------------------------------------------
alter table public.profiles add column is_blocked boolean not null default false;

revoke update on public.profiles from authenticated;
grant update (first_name, last_name, email, lang, country_code) on public.profiles to authenticated;

create policy "profiles_select_admin" on public.profiles
  for select to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Journal d'audit (append-only, écrit par les RPC admin)
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id         bigint generated always as identity primary key,
  actor_id   uuid references auth.users (id) on delete set null,
  action     text not null,
  entity     text not null,
  entity_id  text,
  meta       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_log enable row level security;
create policy "audit_select_admin" on public.audit_log
  for select to authenticated using (public.is_admin());
revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;

create function public.log_audit(p_action text, p_entity text, p_entity_id text, p_meta jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_log (actor_id, action, entity, entity_id, meta)
  values ((select auth.uid()), p_action, p_entity, p_entity_id, coalesce(p_meta, '{}'::jsonb));
$$;
revoke execute on function public.log_audit(text, text, text, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Verrouillage PIN (utilisé par l'Edge Function auth-pin avec service role)
-- ---------------------------------------------------------------------------
create table public.auth_attempts (
  phone        text primary key,
  attempts     integer not null default 0,
  locked_until timestamptz,
  updated_at   timestamptz not null default now()
);
alter table public.auth_attempts enable row level security;
revoke all on public.auth_attempts from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Lecture admin sur les tables métier
-- ---------------------------------------------------------------------------
create policy "listings_admin_all" on public.listings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "bookings_select_admin" on public.bookings
  for select to authenticated using (public.is_admin());
create policy "wallet_tx_select_admin" on public.wallet_transactions
  for select to authenticated using (public.is_admin());

-- Les clients ne créent plus de réservation directement : RPC create_booking.
drop policy "bookings_insert_own_pending" on public.bookings;
revoke insert on public.bookings from authenticated;

-- ---------------------------------------------------------------------------
-- Solde (completed in − completed out − retraits en attente)
-- ---------------------------------------------------------------------------
create function public.wallet_balance_of(p_user uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(case when kind = 'in' then amount else -amount end), 0)::integer
  from public.wallet_transactions
  where user_id = p_user
    and (status = 'completed' or (kind = 'out' and status = 'pending'));
$$;
revoke execute on function public.wallet_balance_of(uuid) from public, anon, authenticated;

create function public.wallet_balance()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select public.wallet_balance_of((select auth.uid()));
$$;
revoke execute on function public.wallet_balance() from public, anon;
grant execute on function public.wallet_balance() to authenticated;

-- ---------------------------------------------------------------------------
-- create_booking : montant calculé côté serveur
-- ---------------------------------------------------------------------------
create function public.create_booking(
  p_listing_id uuid,
  p_start timestamptz,
  p_end timestamptz,
  p_deposit integer default 0
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_l public.listings;
  v_amount integer;
  v_days integer;
  v_row public.bookings;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if exists (select 1 from public.profiles where id = v_uid and is_blocked) then
    raise exception 'account_blocked' using errcode = '42501';
  end if;
  if p_end <= p_start then raise exception 'invalid_range' using errcode = '22023'; end if;

  select * into v_l from public.listings where id = p_listing_id and is_published;
  if not found then raise exception 'listing_not_found' using errcode = 'P0002'; end if;

  v_days := greatest(1, ceil(extract(epoch from (p_end - p_start)) / 86400.0)::integer);
  v_amount := case v_l.price_unit
    when 'day'   then v_l.price * v_days
    when 'month' then v_l.price * greatest(1, ceil(v_days / 30.0)::integer)
    else v_l.price
  end;

  if p_deposit < 0 or p_deposit > v_amount then
    raise exception 'invalid_deposit' using errcode = '22023';
  end if;

  insert into public.bookings (user_id, listing_id, title_snapshot, start_at, end_at, amount, deposit)
  values (v_uid, v_l.id, v_l.title, p_start, p_end, v_amount, p_deposit)
  returning * into v_row;
  return v_row;
exception when exclusion_violation then
  raise exception 'slot_unavailable' using errcode = '23P01';
end;
$$;
revoke execute on function public.create_booking(uuid, timestamptz, timestamptz, integer) from public, anon;
grant execute on function public.create_booking(uuid, timestamptz, timestamptz, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- pay_booking_wallet : débit + confirmation atomiques
-- ---------------------------------------------------------------------------
create function public.pay_booking_wallet(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_b public.bookings;
  v_due integer;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  -- Verrou du profil : sérialise les opérations de portefeuille de l'utilisateur.
  perform 1 from public.profiles where id = v_uid for update;

  select * into v_b from public.bookings where id = p_booking_id and user_id = v_uid for update;
  if not found then raise exception 'booking_not_found' using errcode = 'P0002'; end if;
  if v_b.status <> 'pending' then raise exception 'booking_not_pending' using errcode = '22023'; end if;

  v_due := case when v_b.deposit > 0 then v_b.deposit else v_b.amount end;
  if public.wallet_balance_of(v_uid) < v_due then
    raise exception 'insufficient_funds' using errcode = '53400';
  end if;

  insert into public.wallet_transactions
    (user_id, kind, amount, method, status, label_key, label_vars, booking_id, idempotency_key)
  values
    (v_uid, 'out', v_due, 'wallet', 'completed', 'wallet.booking_payment',
     jsonb_build_object('ref', v_b.ref), v_b.id, 'pay:' || v_b.id);

  update public.bookings
     set paid = v_due, method = 'wallet', status = 'confirmed'
   where id = v_b.id
  returning * into v_b;
  return v_b;
end;
$$;
revoke execute on function public.pay_booking_wallet(uuid) from public, anon;
grant execute on function public.pay_booking_wallet(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- cancel_booking : annule et rembourse ce qui a été payé par portefeuille
-- ---------------------------------------------------------------------------
create function public.cancel_booking(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_b public.bookings;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  perform 1 from public.profiles where id = v_uid for update;

  select * into v_b from public.bookings where id = p_booking_id and user_id = v_uid for update;
  if not found then raise exception 'booking_not_found' using errcode = 'P0002'; end if;
  if v_b.status = 'cancelled' then return v_b; end if;

  if v_b.paid > 0 and v_b.method = 'wallet' then
    insert into public.wallet_transactions
      (user_id, kind, amount, method, status, label_key, label_vars, booking_id, idempotency_key)
    values
      (v_uid, 'in', v_b.paid, 'wallet', 'completed', 'wallet.booking_refund',
       jsonb_build_object('ref', v_b.ref), v_b.id, 'refund:' || v_b.id)
    on conflict (user_id, idempotency_key) do nothing;
  end if;

  update public.bookings set status = 'cancelled' where id = v_b.id returning * into v_b;
  return v_b;
end;
$$;
revoke execute on function public.cancel_booking(uuid) from public, anon;
grant execute on function public.cancel_booking(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Retrait : réserve le montant (pending), l'admin valide ou rejette
-- ---------------------------------------------------------------------------
create function public.request_withdrawal(p_amount integer, p_method public.payment_method)
returns public.wallet_transactions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_row public.wallet_transactions;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'invalid_amount' using errcode = '22023'; end if;
  perform 1 from public.profiles where id = v_uid for update;
  if public.wallet_balance_of(v_uid) < p_amount then
    raise exception 'insufficient_funds' using errcode = '53400';
  end if;
  insert into public.wallet_transactions (user_id, kind, amount, method, status, label_key)
  values (v_uid, 'out', p_amount, p_method, 'pending', 'wallet.withdrawal')
  returning * into v_row;
  return v_row;
end;
$$;
revoke execute on function public.request_withdrawal(integer, public.payment_method) from public, anon;
grant execute on function public.request_withdrawal(integer, public.payment_method) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC administrateur (toutes vérifient is_admin() et écrivent l'audit)
-- ---------------------------------------------------------------------------
create function public.admin_resolve_withdrawal(p_tx_id uuid, p_approve boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.wallet_transactions
     set status = case when p_approve then 'completed' else 'failed' end
   where id = p_tx_id and kind = 'out' and status = 'pending' and label_key = 'wallet.withdrawal';
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  perform public.log_audit('withdrawal.' || case when p_approve then 'approve' else 'reject' end,
                           'wallet_transactions', p_tx_id::text, '{}'::jsonb);
end;
$$;

create function public.admin_wallet_adjust(p_user uuid, p_amount integer, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_amount = 0 or p_reason is null or char_length(trim(p_reason)) < 3 then
    raise exception 'invalid_input' using errcode = '22023';
  end if;
  perform 1 from public.profiles where id = p_user for update;
  if not found then raise exception 'user_not_found' using errcode = 'P0002'; end if;
  if p_amount < 0 and public.wallet_balance_of(p_user) < -p_amount then
    raise exception 'insufficient_funds' using errcode = '53400';
  end if;
  insert into public.wallet_transactions (user_id, kind, amount, method, status, label_key, label_text)
  values (p_user, case when p_amount > 0 then 'in' else 'out' end, abs(p_amount), null,
          'completed', 'wallet.admin_adjust', p_reason);
  perform public.log_audit('wallet.adjust', 'profiles', p_user::text,
                           jsonb_build_object('amount', p_amount, 'reason', p_reason));
end;
$$;

create function public.admin_set_user_blocked(p_user uuid, p_blocked boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_user = (select auth.uid()) then raise exception 'cannot_block_self' using errcode = '22023'; end if;
  update public.profiles set is_blocked = p_blocked where id = p_user;
  perform public.log_audit(case when p_blocked then 'user.block' else 'user.unblock' end,
                           'profiles', p_user::text, '{}'::jsonb);
end;
$$;

create function public.admin_set_booking_status(p_booking_id uuid, p_status public.booking_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_b public.bookings;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into v_b from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  -- Remboursement automatique si annulation d'une réservation payée par portefeuille.
  if p_status = 'cancelled' and v_b.status <> 'cancelled' and v_b.paid > 0 and v_b.method = 'wallet' then
    insert into public.wallet_transactions
      (user_id, kind, amount, method, status, label_key, label_vars, booking_id, idempotency_key)
    values (v_b.user_id, 'in', v_b.paid, 'wallet', 'completed', 'wallet.booking_refund',
            jsonb_build_object('ref', v_b.ref), v_b.id, 'refund:' || v_b.id)
    on conflict (user_id, idempotency_key) do nothing;
  end if;
  update public.bookings set status = p_status where id = p_booking_id;
  perform public.log_audit('booking.set_status', 'bookings', p_booking_id::text,
                           jsonb_build_object('status', p_status));
end;
$$;

create function public.admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return jsonb_build_object(
    'users',               (select count(*) from public.profiles),
    'listings_published',  (select count(*) from public.listings where is_published),
    'listings_pending',    (select count(*) from public.listings where not is_published),
    'bookings_confirmed',  (select count(*) from public.bookings where status = 'confirmed'),
    'bookings_pending',    (select count(*) from public.bookings where status = 'pending'),
    'revenue_xof',         (select coalesce(sum(paid), 0) from public.bookings where status = 'confirmed'),
    'withdrawals_pending', (select count(*) from public.wallet_transactions
                             where kind = 'out' and status = 'pending' and label_key = 'wallet.withdrawal')
  );
end;
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'admin_resolve_withdrawal(uuid, boolean)',
    'admin_wallet_adjust(uuid, integer, text)',
    'admin_set_user_blocked(uuid, boolean)',
    'admin_set_booking_status(uuid, public.booking_status)',
    'admin_dashboard_stats()'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
-- WIDRIVE — 0004 : catalogue de location/logement en base (clé `legacy_id` = ids de
-- src/data/catalog.ts) + RPC de réservation/paiement pilotées par le serveur.
-- Le client n'envoie ni montant ni acompte : tout est calculé ici.

alter table public.listings add column legacy_id text unique;

insert into public.listings (legacy_id, kind, title, city, lat, lng, price, price_unit, attributes, is_published) values
  ('r1', 'vehicle_rental', 'Toyota Yaris',   'Godomey · Calavi',    6.3889, 2.345,  20000, 'day', '{"driver_per_day":10000}', true),
  ('r2', 'vehicle_rental', 'Toyota Corolla', 'Calavi centre · Calavi', 6.4489, 2.3556, 30000, 'day', '{"driver_per_day":10000}', true),
  ('r3', 'vehicle_rental', 'Toyota RAV4',    'Arconville · Calavi', 6.4406, 2.3811, 45000, 'day', '{"driver_per_day":10000}', true),
  ('r4', 'vehicle_rental', 'Toyota Hilux',   'Akassato · Calavi',   6.4936, 2.3619, 55000, 'day', '{"driver_per_day":10000}', true),
  ('r5', 'vehicle_rental', 'Hyundai H1',     'Tankpè · Calavi',     6.4319, 2.3389, 60000, 'day', '{"driver_per_day":10000}', true),
  ('a1', 'housing', 'Studio meublé',        'Abomey-Calavi', 6.4, 2.35, 150000, 'month', '{}', true),
  ('a2', 'housing', 'Appartement 2 pièces', 'Abomey-Calavi', 6.4, 2.35, 250000, 'month', '{}', true),
  ('a3', 'housing', 'Appartement 3 pièces', 'Abomey-Calavi', 6.4, 2.35, 400000, 'month', '{}', true),
  ('a4', 'housing', 'Villa avec jardin',    'Abomey-Calavi', 6.4, 2.35, 700000, 'month', '{}', true)
on conflict (legacy_id) do nothing;

-- Annule l'ancienne signature de 0003 (remplacée ci-dessous).
drop function public.create_booking(uuid, timestamptz, timestamptz, integer);
drop function public.pay_booking_wallet(uuid);

-- Réservation par id « legacy » (ou UUID en texte) : montant et acompte calculés ici.
create function public.create_booking(
  p_listing text,
  p_start timestamptz,
  p_end timestamptz,
  p_with_driver boolean default false
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_l public.listings;
  v_days integer;
  v_amount integer;
  v_row public.bookings;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if exists (select 1 from public.profiles where id = v_uid and is_blocked) then
    raise exception 'account_blocked' using errcode = '42501';
  end if;
  if p_end <= p_start then raise exception 'invalid_range' using errcode = '22023'; end if;

  select * into v_l from public.listings
   where is_published and (legacy_id = p_listing or id::text = p_listing)
     and kind in ('vehicle_rental', 'housing');
  if not found then raise exception 'listing_not_found' using errcode = 'P0002'; end if;

  v_days := greatest(1, ceil(extract(epoch from (p_end - p_start)) / 86400.0)::integer);
  v_amount := case v_l.price_unit
    when 'day'   then v_l.price * v_days
    when 'month' then v_l.price * greatest(1, ceil(v_days / 30.0)::integer)
    else v_l.price end;
  if p_with_driver and v_l.kind = 'vehicle_rental' then
    v_amount := v_amount + coalesce((v_l.attributes ->> 'driver_per_day')::integer, 0) * v_days;
  end if;

  insert into public.bookings (user_id, listing_id, title_snapshot, start_at, end_at, amount, deposit)
  values (v_uid, v_l.id, v_l.title, p_start, p_end, v_amount, round(v_amount * 0.3)::integer)
  returning * into v_row;
  return v_row;
exception when exclusion_violation then
  raise exception 'slot_unavailable' using errcode = '23P01';
end;
$$;
revoke execute on function public.create_booking(text, timestamptz, timestamptz, boolean) from public, anon;
grant execute on function public.create_booking(text, timestamptz, timestamptz, boolean) to authenticated;

-- Paiement par portefeuille : acompte (30 %) ou totalité, débit + confirmation atomiques.
create function public.pay_booking_wallet(p_booking_id uuid, p_full boolean default true)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_b public.bookings;
  v_due integer;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  perform 1 from public.profiles where id = v_uid for update;

  select * into v_b from public.bookings where id = p_booking_id and user_id = v_uid for update;
  if not found then raise exception 'booking_not_found' using errcode = 'P0002'; end if;
  if v_b.status <> 'pending' then raise exception 'booking_not_pending' using errcode = '22023'; end if;

  v_due := case when p_full or v_b.deposit = 0 or v_b.deposit >= v_b.amount then v_b.amount else v_b.deposit end;
  if public.wallet_balance_of(v_uid) < v_due then
    raise exception 'insufficient_funds' using errcode = '53400';
  end if;

  insert into public.wallet_transactions
    (user_id, kind, amount, method, status, label_key, label_text, booking_id, idempotency_key)
  values
    (v_uid, 'out', v_due, 'wallet', 'completed', 'pay.txLabel', v_b.title_snapshot, v_b.id, 'pay:' || v_b.id);

  update public.bookings set paid = v_due, method = 'wallet', status = 'confirmed'
   where id = v_b.id returning * into v_b;
  return v_b;
end;
$$;
revoke execute on function public.pay_booking_wallet(uuid, boolean) from public, anon;
grant execute on function public.pay_booking_wallet(uuid, boolean) to authenticated;

-- Libellés alignés sur l'i18n existant pour les remboursements.
create or replace function public.cancel_booking(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_b public.bookings;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  perform 1 from public.profiles where id = v_uid for update;
  select * into v_b from public.bookings where id = p_booking_id and user_id = v_uid for update;
  if not found then raise exception 'booking_not_found' using errcode = 'P0002'; end if;
  if v_b.status = 'cancelled' then return v_b; end if;
  if v_b.paid > 0 and v_b.method = 'wallet' then
    insert into public.wallet_transactions
      (user_id, kind, amount, method, status, label_key, label_text, booking_id, idempotency_key)
    values (v_uid, 'in', v_b.paid, 'wallet', 'completed', 'pay.refundLabel', v_b.title_snapshot, v_b.id, 'refund:' || v_b.id)
    on conflict (user_id, idempotency_key) do nothing;
  end if;
  update public.bookings set status = 'cancelled' where id = v_b.id returning * into v_b;
  return v_b;
end;
$$;

-- Créneaux occupés de TOUTES les annonces (sans donnée personnelle) pour les calendriers.
create function public.get_all_busy_slots(p_from timestamptz, p_to timestamptz)
returns table (listing_ref text, start_at timestamptz, end_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(l.legacy_id, l.id::text), b.start_at, b.end_at
  from public.bookings b
  join public.listings l on l.id = b.listing_id
  where b.status <> 'cancelled' and b.start_at < p_to and b.end_at > p_from;
$$;
revoke execute on function public.get_all_busy_slots(timestamptz, timestamptz) from public, anon;
grant execute on function public.get_all_busy_slots(timestamptz, timestamptz) to authenticated;
-- Corrige deux fonctions admin dont les expressions CASE étaient typées text (détecté par `supabase db lint`).
create or replace function public.admin_resolve_withdrawal(p_tx_id uuid, p_approve boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.wallet_transactions
     set status = (case when p_approve then 'completed' else 'failed' end)::public.wallet_tx_status
   where id = p_tx_id and kind = 'out' and status = 'pending' and label_key = 'wallet.withdrawal';
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  perform public.log_audit('withdrawal.' || case when p_approve then 'approve' else 'reject' end,
                           'wallet_transactions', p_tx_id::text, '{}'::jsonb);
end; $$;

create or replace function public.admin_wallet_adjust(p_user uuid, p_amount integer, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_amount = 0 or p_reason is null or char_length(trim(p_reason)) < 3 then
    raise exception 'invalid_input' using errcode = '22023';
  end if;
  perform 1 from public.profiles where id = p_user for update;
  if not found then raise exception 'user_not_found' using errcode = 'P0002'; end if;
  if p_amount < 0 and public.wallet_balance_of(p_user) < -p_amount then
    raise exception 'insufficient_funds' using errcode = '53400';
  end if;
  insert into public.wallet_transactions (user_id, kind, amount, method, status, label_key, label_text)
  values (p_user, (case when p_amount > 0 then 'in' else 'out' end)::public.wallet_tx_kind, abs(p_amount), null,
          'completed', 'wallet.admin_adjust', p_reason);
  perform public.log_audit('wallet.adjust', 'profiles', p_user::text,
                           jsonb_build_object('amount', p_amount, 'reason', p_reason));
end; $$;
