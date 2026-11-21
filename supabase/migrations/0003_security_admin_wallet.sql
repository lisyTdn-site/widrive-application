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
