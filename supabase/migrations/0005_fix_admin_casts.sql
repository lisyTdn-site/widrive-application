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
