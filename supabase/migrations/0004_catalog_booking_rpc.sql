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
