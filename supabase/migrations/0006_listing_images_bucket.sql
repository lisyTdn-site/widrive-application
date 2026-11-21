-- WIDRIVE — 0006 : bucket Storage public pour les photos d'annonces.
-- Lecture publique (par URL) ; écriture réservée aux administrateurs (is_admin()).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listings', 'listings', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "listings_images_admin_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'listings' and public.is_admin())
  with check (bucket_id = 'listings' and public.is_admin());
