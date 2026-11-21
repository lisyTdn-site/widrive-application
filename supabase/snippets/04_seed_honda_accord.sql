-- 04 — Annonce : Honda Accord 2010 (vente directe).
-- Prérequis : migration 0006 appliquée ET les 4 photos envoyées dans le bucket "listings"
-- (dossier honda-accord/, voir SETUP.md). À exécuter dans Supabase > SQL Editor.
-- Idempotent : peut être relancé (met à jour l'annonce existante).
-- À VÉRIFIER avec le vendeur : ville, kilométrage (inconnu → non affiché), état de la peinture.

insert into public.listings
  (legacy_id, kind, title, description, city, lat, lng, price, price_unit, attributes, image_urls, is_published)
values (
  'v-honda-accord-2010',
  'vehicle_sale',
  'Honda Accord',
  jsonb_build_object(
    'fr', E'Honda Accord 2010 — série BH. Berline, moteur 4 cylindres essence, boîte automatique. Moteur en très très bon état. Peinture blanche. Intérieur cuir beige. Climatisation d''origine. Toit ouvrant.\n\nPrix de départ : 1 800 000 FCFA, négociable. Vente directe. Commission : 100 000 FCFA. Documents non à jour. Batterie à plat (off).\n\nNB : le véhicule démarre et roule ; aucune réparation n''est prévue, hormis la vidange.',
    'en', E'2010 Honda Accord — BH series. Sedan, 4-cylinder petrol engine, automatic gearbox. Engine in very, very good condition. White paint. Beige leather interior. Original air conditioning. Sunroof.\n\nStarting price: 1,800,000 FCFA, negotiable. Direct sale. Commission: 100,000 FCFA. Documents not up to date. Battery is flat (off).\n\nNB: the vehicle starts and drives; no repairs are planned, except an oil change.'
  ),
  'Abomey-Calavi', 6.4489, 2.3556,
  1800000, 'total',
  '{"brand":"Honda","model":"Accord","year":2010,"km":0,"fuel":"petrol","gearbox":"auto","drive":"twoWheel","category":"sedan","status":"available","engine":"excellent","paint":"good","interior":"veryGood","ac":"good","equipment":["leather","sunroof"],"documentKey":"vehicle.docs.4","negotiable":true}'::jsonb,
  array[
    'https://dtlutzalxszgovqtgrzv.supabase.co/storage/v1/object/public/listings/honda-accord/1-avant.jpg',
    'https://dtlutzalxszgovqtgrzv.supabase.co/storage/v1/object/public/listings/honda-accord/2-profil.jpg',
    'https://dtlutzalxszgovqtgrzv.supabase.co/storage/v1/object/public/listings/honda-accord/3-arriere.jpg',
    'https://dtlutzalxszgovqtgrzv.supabase.co/storage/v1/object/public/listings/honda-accord/4-interieur.jpg'
  ],
  true
)
on conflict (legacy_id) do update set
  title = excluded.title, description = excluded.description, city = excluded.city,
  price = excluded.price, attributes = excluded.attributes, image_urls = excluded.image_urls,
  is_published = excluded.is_published;
