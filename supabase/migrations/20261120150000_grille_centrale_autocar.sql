-- Grille tarifaire Centrale Autocar appliquée à Busmoov (Adrien, 20 nov. 2026).
-- Prix TTC, marge de 30 % incluse. Plus aucune case vide : les durées et
-- amplitudes manquantes sont renseignées d'après la règle d'Adrien
-- (AR sans MAD : jamais décroissant, plafonné à 2 allers simples, > 6 jours = prix du 6e jour ;
--  AR 1 jour : case vide = prix de la colonne la plus haute disponible).

delete from public.tarifs_aller_simple;
insert into public.tarifs_aller_simple (km_min, km_max, prix_public) values
  (0, 75, 690), (75, 100, 890), (100, 150, 990), (150, 200, 1230), (200, 250, 1390),
  (250, 300, 1590), (300, 350, 2090), (350, 400, 2390);
-- au-delà de 400 km : 2 390 € + 7 €/km (code)

delete from public.tarifs_ar_1j;
insert into public.tarifs_ar_1j (km_min, km_max, prix_8h, prix_10h, prix_12h, prix_9h_coupure) values
  (0, 50, 890, 890, 890, 1030),
  (50, 75, 1090, 1090, 1090, 1400),
  (75, 100, 1190, 1290, 1290, 1500),
  (100, 150, 1290, 1390, 1390, 1590),
  (150, 200, 1490, 1590, 1590, 1690),
  (200, 250, 2090, 2190, 2190, 2290),
  (250, 300, 2490, 2490, 2490, 2550),
  (300, 350, 2550, 2550, 2550, 2590),
  (350, 400, 2690, 2690, 2690, 2690),
  (400, 450, 2790, 2790, 2790, 2790),
  (450, 500, 2970, 2970, 2970, 2970);
-- au-delà de 500 km : 2 970 € + 7 €/km (code)

-- AR avec MAD : valeurs identiques, supplément 800 €/jour au-delà de 6 jours
update public.tarifs_ar_mad set supplement_jour = 800;

delete from public.tarifs_ar_sans_mad;
insert into public.tarifs_ar_sans_mad (km_min, km_max, prix_2j, prix_3j, prix_4j, prix_5j, prix_6j, supplement_jour) values
  (0, 75, 1380, 1380, 1380, 1380, 1380, 0),
  (75, 100, 1780, 1780, 1780, 1780, 1780, 0),
  (100, 150, 1980, 1980, 1980, 1980, 1980, 0),
  (150, 200, 1990, 2460, 2460, 2460, 2460, 0),
  (200, 250, 2290, 2780, 2780, 2780, 2780, 0),
  (250, 300, 2490, 2990, 3180, 3180, 3180, 0),
  (300, 350, 2790, 3290, 3790, 4180, 4180, 0),
  (350, 400, 3090, 3590, 4090, 4590, 4780, 0),
  (400, 450, 3390, 3890, 4390, 4890, 5390, 0),
  (450, 500, 3690, 4190, 4690, 5190, 5690, 0);
alter table public.tarifs_ar_sans_mad alter column supplement_jour set default 0;

-- Zone difficile : +5 % sur la liste, 0 ailleurs
update public.majorations_regions set majoration_percent = case
  when region_code in ('01','02','04','05','09','10','11','14','22','25','26','27','28','29','30','32','35','37','38','39','40','42','45','47','49','50','51','53','54','56','60','61','64','65','68','70','72','76','83','84','89') then 5
  else 0 end;

-- Minibus automatique jusqu'à 19 passagers
update public.capacites_vehicules set places_max = 19 where code = 'minibus';
update public.capacites_vehicules set places_min = 20 where code = 'standard';
