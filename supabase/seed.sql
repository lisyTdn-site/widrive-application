-- Données de DÉVELOPPEMENT uniquement (non sensibles, fictives).
-- Exécuté par `supabase db reset` en local. NE JAMAIS l'appliquer en production.
-- Annonces sans propriétaire (owner_id null) et déjà publiées.

insert into public.listings (kind, title, description, city, lat, lng, price, price_unit, attributes, is_published)
values
  ('vehicle_rental', 'Toyota Yaris',
   '{"fr": "Citadine économique et facile à conduire.", "en": "Economical and easy to drive city car."}',
   'Godomey · Calavi', 6.3889, 2.345, 20000, 'day',
   '{"category": "city", "seats": 5, "gearbox": "manual", "fuel": "petrol"}', true),
  ('vehicle_rental', 'Toyota RAV4',
   '{"fr": "SUV confortable pour la ville et la route.", "en": "Comfortable SUV for city and road."}',
   'Abomey-Calavi', 6.4489, 2.3556, 45000, 'day',
   '{"category": "suv", "seats": 5, "gearbox": "auto", "fuel": "petrol"}', true),
  ('vehicle_sale', 'Toyota Corolla 2016',
   '{"fr": "Berline en très bon état.", "en": "Sedan in very good condition."}',
   'Abomey-Calavi', 6.4489, 2.3556, 6500000, 'total',
   '{"brand": "Toyota", "model": "Corolla", "year": 2016, "km": 98000, "fuel": "petrol", "gearbox": "auto", "drive": "twoWheel", "category": "sedan", "status": "available", "engine": "veryGood", "paint": "good", "interior": "veryGood", "ac": "works", "equipment": ["bluetooth", "camera", "windows"], "documentKey": "vehicle.docs.1"}', true),
  ('vehicle_sale', 'Toyota Hilux 2018',
   '{"fr": "Pick-up 4x4 robuste.", "en": "Rugged 4x4 pickup."}',
   'Abomey-Calavi', 6.4319, 2.3389, 14500000, 'total',
   '{"brand": "Toyota", "model": "Hilux", "year": 2018, "km": 76000, "fuel": "diesel", "gearbox": "manual", "drive": "fourWheel", "category": "pickup", "status": "available", "engine": "excellent", "paint": "veryGood", "interior": "good", "ac": "works", "equipment": ["screen", "roof"], "documentKey": "vehicle.docs.2"}', true),
  ('vehicle_sale', 'Toyota Land Cruiser Prado 2015',
   '{"fr": "SUV 4x4 confortable.", "en": "Comfortable 4x4 SUV."}',
   'Abomey-Calavi', 6.4406, 2.3811, 17000000, 'total',
   '{"brand": "Toyota", "model": "Land Cruiser Prado", "year": 2015, "km": 120000, "fuel": "diesel", "gearbox": "auto", "drive": "fourWheel", "category": "suv", "status": "reserved", "engine": "good", "paint": "good", "interior": "veryGood", "ac": "works", "equipment": ["sunroof", "leather", "gps"], "documentKey": "vehicle.docs.3"}', true),
  ('housing', 'Studio meublé',
   '{"fr": "Studio meublé et climatisé.", "en": "Furnished air-conditioned studio."}',
   'Godomey', 6.3889, 2.345, 150000, 'month',
   '{"type": "studio", "beds": 1, "baths": 1}', true),
  ('housing', 'Appartement 2 pièces',
   '{"fr": "Appartement lumineux de deux pièces.", "en": "Bright two-room apartment."}',
   'Calavi centre', 6.4489, 2.3556, 250000, 'month',
   '{"type": "two", "beds": 2, "baths": 1}', true);
