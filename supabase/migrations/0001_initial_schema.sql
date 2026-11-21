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
