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
