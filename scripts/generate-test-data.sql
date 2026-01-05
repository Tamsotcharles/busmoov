-- =====================================================
-- Script de génération de données de test massives
-- Pour Busmoov CRM - Phase de test de stabilité
-- =====================================================

-- IMPORTANT: Exécuter ce script dans un environnement de test uniquement!
-- Ce script génère des données fictives pour tester les workflows.

-- =====================================================
-- 1. CLIENTS DE TEST
-- =====================================================

INSERT INTO clients (id, name, company, email, phone, billing_address, billing_zip, billing_city)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Jean Dupont', 'École Saint-Joseph', 'jean.dupont@test.com', '0612345678', '10 rue de la Paix', '75001', 'Paris'),
  ('22222222-2222-2222-2222-222222222222', 'Marie Martin', 'Lycée Victor Hugo', 'marie.martin@test.com', '0687654321', '25 avenue des Champs', '69001', 'Lyon'),
  ('33333333-3333-3333-3333-333333333333', 'Pierre Durand', 'Association Sport Loisirs', 'pierre.durand@test.com', '0611223344', '5 place du Marché', '31000', 'Toulouse'),
  ('44444444-4444-4444-4444-444444444444', 'Sophie Bernard', 'Comité d''Entreprise SNCF', 'sophie.bernard@test.com', '0699887766', '100 boulevard Haussmann', '75008', 'Paris'),
  ('55555555-5555-5555-5555-555555555555', 'Lucas Petit', 'Mairie de Bordeaux', 'lucas.petit@test.com', '0655443322', '1 place Pey-Berland', '33000', 'Bordeaux')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. DEMANDES DE TEST (différents statuts)
-- =====================================================

-- Demande 1: Nouvelle demande
INSERT INTO demandes (id, reference, client_email, client_name, client_phone, departure_city, arrival_city, departure_date, return_date, passengers, voyage_type, trip_type, status, created_at)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'DEM-TEST-001', 'test1@example.com', 'Test Client 1', '0612345678', 'Paris', 'Lyon', NOW() + INTERVAL '30 days', NOW() + INTERVAL '32 days', '45', 'scolaire', 'round-trip', 'new', NOW() - INTERVAL '1 day')
ON CONFLICT (reference) DO NOTHING;

-- Demande 2: En cours de traitement
INSERT INTO demandes (id, reference, client_email, client_name, client_phone, departure_city, arrival_city, departure_date, return_date, passengers, voyage_type, trip_type, status, created_at)
VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'DEM-TEST-002', 'test2@example.com', 'Test Client 2', '0623456789', 'Marseille', 'Nice', NOW() + INTERVAL '15 days', NULL, '30', 'tourisme', 'one-way', 'processing', NOW() - INTERVAL '3 days')
ON CONFLICT (reference) DO NOTHING;

-- Demande 3: Devis envoyés
INSERT INTO demandes (id, reference, client_email, client_name, client_phone, departure_city, arrival_city, departure_date, return_date, passengers, voyage_type, trip_type, status, created_at)
VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'DEM-TEST-003', 'test3@example.com', 'Test Client 3', '0634567890', 'Lille', 'Bruxelles', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days', '55', 'professionnel', 'round-trip', 'quoted', NOW() - INTERVAL '5 days')
ON CONFLICT (reference) DO NOTHING;

-- =====================================================
-- 3. DOSSIERS DE TEST (différents statuts)
-- =====================================================

-- Dossier 1: En attente de paiement (cas critique)
INSERT INTO dossiers (id, reference, demande_id, client_name, client_email, client_phone, departure, arrival, departure_date, return_date, passengers, vehicle_type, price_ht, price_ttc, status, created_at)
VALUES
  ('d1111111-1111-1111-1111-111111111111', 'DOS-TEST-001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Jean Dupont', 'jean.dupont@test.com', '0612345678', 'Paris', 'Lyon', NOW() + INTERVAL '30 days', NOW() + INTERVAL '32 days', 45, 'autocar_standard', 1800.00, 1980.00, 'pending-payment', NOW() - INTERVAL '2 days')
ON CONFLICT (reference) DO NOTHING;

-- Dossier 2: En attente de réservation transporteur
INSERT INTO dossiers (id, reference, demande_id, client_name, client_email, client_phone, departure, arrival, departure_date, return_date, passengers, vehicle_type, price_ht, price_ttc, status, created_at)
VALUES
  ('d2222222-2222-2222-2222-222222222222', 'DOS-TEST-002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Marie Martin', 'marie.martin@test.com', '0687654321', 'Marseille', 'Nice', NOW() + INTERVAL '15 days', NULL, 30, 'minibus', 900.00, 990.00, 'pending-reservation', NOW() - INTERVAL '5 days')
ON CONFLICT (reference) DO NOTHING;

-- Dossier 3: En attente d'infos voyage (URGENT - 5 jours)
INSERT INTO dossiers (id, reference, demande_id, client_name, client_email, client_phone, departure, arrival, departure_date, return_date, passengers, vehicle_type, price_ht, price_ttc, status, created_at)
VALUES
  ('d3333333-3333-3333-3333-333333333333', 'DOS-TEST-003', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Pierre Durand', 'pierre.durand@test.com', '0611223344', 'Lille', 'Bruxelles', NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days', 55, 'autocar_grand_tourisme', 2500.00, 2750.00, 'pending-info', NOW() - INTERVAL '10 days')
ON CONFLICT (reference) DO NOTHING;

-- Dossier 4: En attente de chauffeur (URGENT - 3 jours)
INSERT INTO dossiers (id, reference, client_name, client_email, client_phone, departure, arrival, departure_date, return_date, passengers, vehicle_type, price_ht, price_ttc, status, created_at)
VALUES
  ('d4444444-4444-4444-4444-444444444444', 'DOS-TEST-004', 'Sophie Bernard', 'sophie.bernard@test.com', '0699887766', 'Paris', 'Versailles', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days', 40, 'autocar_standard', 600.00, 660.00, 'pending-driver', NOW() - INTERVAL '15 days')
ON CONFLICT (reference) DO NOTHING;

-- Dossier 5: Confirmé (voyage dans 10 jours)
INSERT INTO dossiers (id, reference, client_name, client_email, client_phone, departure, arrival, departure_date, return_date, passengers, vehicle_type, price_ht, price_ttc, status, chauffeur_name, chauffeur_phone, created_at)
VALUES
  ('d5555555-5555-5555-5555-555555555555', 'DOS-TEST-005', 'Lucas Petit', 'lucas.petit@test.com', '0655443322', 'Bordeaux', 'Arcachon', NOW() + INTERVAL '10 days', NOW() + INTERVAL '10 days', 25, 'minibus', 450.00, 495.00, 'confirmed', 'Michel Legrand', '0677889900', NOW() - INTERVAL '20 days')
ON CONFLICT (reference) DO NOTHING;

-- Dossier 6: Complété (pour historique)
INSERT INTO dossiers (id, reference, client_name, client_email, client_phone, departure, arrival, departure_date, return_date, passengers, vehicle_type, price_ht, price_ttc, status, created_at)
VALUES
  ('d6666666-6666-6666-6666-666666666666', 'DOS-TEST-006', 'Alice Martin', 'alice.martin@test.com', '0633221100', 'Nantes', 'Rennes', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', 35, 'autocar_standard', 800.00, 880.00, 'completed', NOW() - INTERVAL '30 days')
ON CONFLICT (reference) DO NOTHING;

-- Dossier 7: Solde en retard (CRITIQUE)
INSERT INTO dossiers (id, reference, client_name, client_email, client_phone, departure, arrival, departure_date, return_date, passengers, vehicle_type, price_ht, price_ttc, status, created_at)
VALUES
  ('d7777777-7777-7777-7777-777777777777', 'DOS-TEST-007', 'Robert Noir', 'robert.noir@test.com', '0644556677', 'Strasbourg', 'Munich', NOW() + INTERVAL '2 days', NOW() + INTERVAL '4 days', 50, 'autocar_grand_tourisme', 3200.00, 3520.00, 'confirmed', NOW() - INTERVAL '25 days')
ON CONFLICT (reference) DO NOTHING;

-- =====================================================
-- 4. DEVIS DE TEST
-- =====================================================

-- Devis pour dossier 1
INSERT INTO devis (id, reference, demande_id, dossier_id, transporteur_id, vehicle_type, price_ht, price_ttc, price_achat_ht, status, created_at)
SELECT
  'e1111111-1111-1111-1111-111111111111',
  'DEV-TEST-001',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'd1111111-1111-1111-1111-111111111111',
  t.id,
  'autocar_standard',
  1800.00,
  1980.00,
  1400.00,
  'accepted',
  NOW() - INTERVAL '2 days'
FROM transporteurs t LIMIT 1
ON CONFLICT (reference) DO NOTHING;

-- Devis concurrent (rejeté)
INSERT INTO devis (id, reference, demande_id, dossier_id, transporteur_id, vehicle_type, price_ht, price_ttc, price_achat_ht, status, created_at)
SELECT
  'e2222222-2222-2222-2222-222222222222',
  'DEV-TEST-002',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'd1111111-1111-1111-1111-111111111111',
  t.id,
  'autocar_standard',
  2100.00,
  2310.00,
  1700.00,
  'rejected',
  NOW() - INTERVAL '2 days'
FROM transporteurs t OFFSET 1 LIMIT 1
ON CONFLICT (reference) DO NOTHING;

-- Devis en attente (pour dossier 2)
INSERT INTO devis (id, reference, demande_id, dossier_id, transporteur_id, vehicle_type, price_ht, price_ttc, price_achat_ht, status, created_at)
SELECT
  'e3333333-3333-3333-3333-333333333333',
  'DEV-TEST-003',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'd2222222-2222-2222-2222-222222222222',
  t.id,
  'minibus',
  900.00,
  990.00,
  700.00,
  'sent',
  NOW() - INTERVAL '3 days'
FROM transporteurs t LIMIT 1
ON CONFLICT (reference) DO NOTHING;

-- =====================================================
-- 5. CONTRATS DE TEST
-- =====================================================

-- Contrat signé pour dossier 1
INSERT INTO contrats (id, reference, dossier_id, devis_id, price_ttc, acompte_amount, solde_amount, signed_at, signed_by_client, client_name, client_email)
VALUES
  ('f1111111-1111-1111-1111-111111111111', 'CON-TEST-001', 'd1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 1980.00, 594.00, 1386.00, NOW() - INTERVAL '1 day', true, 'Jean Dupont', 'jean.dupont@test.com')
ON CONFLICT (reference) DO NOTHING;

-- Contrat pour dossier 7 (solde en retard)
INSERT INTO contrats (id, reference, dossier_id, price_ttc, acompte_amount, solde_amount, signed_at, signed_by_client, client_name, client_email)
VALUES
  ('f7777777-7777-7777-7777-777777777777', 'CON-TEST-007', 'd7777777-7777-7777-7777-777777777777', 3520.00, 1056.00, 2464.00, NOW() - INTERVAL '20 days', true, 'Robert Noir', 'robert.noir@test.com')
ON CONFLICT (reference) DO NOTHING;

-- =====================================================
-- 6. FACTURES DE TEST
-- =====================================================

-- Facture acompte en attente (dossier 1)
INSERT INTO factures (id, reference, dossier_id, contrat_id, type, amount_ht, amount_tva, amount_ttc, status, created_at)
VALUES
  ('fa111111-1111-1111-1111-111111111111', 'FAC-TEST-001', 'd1111111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111', 'acompte', 540.00, 54.00, 594.00, 'pending', NOW() - INTERVAL '1 day')
ON CONFLICT (reference) DO NOTHING;

-- Facture acompte payée (dossier 7)
INSERT INTO factures (id, reference, dossier_id, contrat_id, type, amount_ht, amount_tva, amount_ttc, status, paid_at, created_at)
VALUES
  ('fa777777-7777-7777-7777-777777777771', 'FAC-TEST-007A', 'd7777777-7777-7777-7777-777777777777', 'f7777777-7777-7777-7777-777777777777', 'acompte', 960.00, 96.00, 1056.00, 'paid', NOW() - INTERVAL '18 days', NOW() - INTERVAL '20 days')
ON CONFLICT (reference) DO NOTHING;

-- Facture solde en attente (dossier 7 - CRITIQUE)
INSERT INTO factures (id, reference, dossier_id, contrat_id, type, amount_ht, amount_tva, amount_ttc, status, created_at)
VALUES
  ('fa777777-7777-7777-7777-777777777772', 'FAC-TEST-007S', 'd7777777-7777-7777-7777-777777777777', 'f7777777-7777-7777-7777-777777777777', 'solde', 2240.00, 224.00, 2464.00, 'pending', NOW() - INTERVAL '10 days')
ON CONFLICT (reference) DO NOTHING;

-- =====================================================
-- 7. PAIEMENTS DE TEST
-- =====================================================

-- Paiement acompte dossier 7
INSERT INTO paiements (id, dossier_id, contrat_id, type, amount, payment_date, reference)
VALUES
  ('pa777777-7777-7777-7777-777777777777', 'd7777777-7777-7777-7777-777777777777', 'f7777777-7777-7777-7777-777777777777', 'cb', 1056.00, NOW() - INTERVAL '18 days', 'PAY-STRIPE-TEST-001')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 8. VOYAGE INFOS DE TEST
-- =====================================================

-- Voyage info validé (dossier 4 - en attente chauffeur)
INSERT INTO voyage_infos (id, dossier_id, aller_date, aller_heure, aller_passagers, aller_adresse_depart, aller_adresse_arrivee, retour_date, retour_heure, retour_passagers, retour_adresse_depart, retour_adresse_arrivee, contact_nom, contact_prenom, contact_tel, contact_email, validated_at, client_validated_at)
VALUES
  ('vi444444-4444-4444-4444-444444444444', 'd4444444-4444-4444-4444-444444444444', NOW() + INTERVAL '3 days', '08:00', 40, '15 rue de Rivoli, 75001 Paris', 'Château de Versailles, 78000 Versailles', NOW() + INTERVAL '3 days', '18:00', 40, 'Château de Versailles, 78000 Versailles', '15 rue de Rivoli, 75001 Paris', 'Bernard', 'Sophie', '0699887766', 'sophie.bernard@test.com', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days')
ON CONFLICT (dossier_id) DO NOTHING;

-- Voyage info confirmé (dossier 5)
INSERT INTO voyage_infos (id, dossier_id, aller_date, aller_heure, aller_passagers, aller_adresse_depart, aller_adresse_arrivee, retour_date, retour_heure, retour_passagers, retour_adresse_depart, retour_adresse_arrivee, contact_nom, contact_prenom, contact_tel, contact_email, validated_at, client_validated_at, chauffeur_aller_nom, chauffeur_aller_tel)
VALUES
  ('vi555555-5555-5555-5555-555555555555', 'd5555555-5555-5555-5555-555555555555', NOW() + INTERVAL '10 days', '09:00', 25, 'Place de la Comédie, 33000 Bordeaux', 'Dune du Pilat, 33115 Pyla-sur-Mer', NOW() + INTERVAL '10 days', '17:00', 25, 'Dune du Pilat, 33115 Pyla-sur-Mer', 'Place de la Comédie, 33000 Bordeaux', 'Petit', 'Lucas', '0655443322', 'lucas.petit@test.com', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', 'Michel Legrand', '0677889900')
ON CONFLICT (dossier_id) DO NOTHING;

-- Voyage info solde en retard (dossier 7)
INSERT INTO voyage_infos (id, dossier_id, aller_date, aller_heure, aller_passagers, aller_adresse_depart, aller_adresse_arrivee, retour_date, retour_heure, retour_passagers, retour_adresse_depart, retour_adresse_arrivee, contact_nom, contact_prenom, contact_tel, contact_email, validated_at, client_validated_at, chauffeur_aller_nom, chauffeur_aller_tel)
VALUES
  ('vi777777-7777-7777-7777-777777777777', 'd7777777-7777-7777-7777-777777777777', NOW() + INTERVAL '2 days', '07:00', 50, 'Place Kléber, 67000 Strasbourg', 'Marienplatz, 80331 Munich', NOW() + INTERVAL '4 days', '16:00', 50, 'Marienplatz, 80331 Munich', 'Place Kléber, 67000 Strasbourg', 'Noir', 'Robert', '0644556677', 'robert.noir@test.com', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', 'Hans Schmidt', '0049171234567')
ON CONFLICT (dossier_id) DO NOTHING;

-- =====================================================
-- 9. DEMANDES CHAUFFEUR DE TEST
-- =====================================================

-- Demande chauffeur en attente (dossier 4)
INSERT INTO demandes_chauffeur (id, dossier_id, transporteur_id, type, mode, token, status, sent_at, expires_at)
SELECT
  'dc444444-4444-4444-4444-444444444444',
  'd4444444-4444-4444-4444-444444444444',
  t.id,
  'aller_retour',
  'individuel',
  'test-token-chauffeur-444',
  'pending',
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '6 days'
FROM transporteurs t LIMIT 1
ON CONFLICT DO NOTHING;

-- =====================================================
-- 10. TIMELINE DE TEST
-- =====================================================

-- Événements pour dossier 1
INSERT INTO timeline (dossier_id, type, content, created_at) VALUES
  ('d1111111-1111-1111-1111-111111111111', 'creation', 'Dossier créé', NOW() - INTERVAL '2 days'),
  ('d1111111-1111-1111-1111-111111111111', 'devis', 'Devis DEV-TEST-001 envoyé au client', NOW() - INTERVAL '2 days' + INTERVAL '1 hour'),
  ('d1111111-1111-1111-1111-111111111111', 'devis_accepte', 'Devis DEV-TEST-001 accepté par le client', NOW() - INTERVAL '1 day'),
  ('d1111111-1111-1111-1111-111111111111', 'contrat', 'Contrat CON-TEST-001 signé', NOW() - INTERVAL '1 day' + INTERVAL '30 minutes')
ON CONFLICT DO NOTHING;

-- Événements pour dossier 7
INSERT INTO timeline (dossier_id, type, content, created_at) VALUES
  ('d7777777-7777-7777-7777-777777777777', 'creation', 'Dossier créé', NOW() - INTERVAL '25 days'),
  ('d7777777-7777-7777-7777-777777777777', 'contrat', 'Contrat signé', NOW() - INTERVAL '20 days'),
  ('d7777777-7777-7777-7777-777777777777', 'paiement', 'Acompte reçu: 1056.00€', NOW() - INTERVAL '18 days'),
  ('d7777777-7777-7777-7777-777777777777', 'infos_voyage', 'Informations voyage validées', NOW() - INTERVAL '10 days'),
  ('d7777777-7777-7777-7777-777777777777', 'relance', 'Relance solde envoyée', NOW() - INTERVAL '5 days'),
  ('d7777777-7777-7777-7777-777777777777', 'relance', 'Relance solde URGENTE envoyée', NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 11. DEMANDES FOURNISSEURS DE TEST
-- =====================================================

-- Demande fournisseur avec BPA reçu
INSERT INTO demandes_fournisseurs (id, dossier_id, devis_id, transporteur_id, prix_propose, status, sent_at, responded_at, bpa_received_at, validation_token)
SELECT
  'df111111-1111-1111-1111-111111111111',
  'd1111111-1111-1111-1111-111111111111',
  'e1111111-1111-1111-1111-111111111111',
  t.id,
  1400.00,
  'bpa_received',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days',
  'token-bpa-test-111'
FROM transporteurs t LIMIT 1
ON CONFLICT DO NOTHING;

-- =====================================================
-- 12. MESSAGES DE TEST
-- =====================================================

-- Messages de conversation
INSERT INTO messages (dossier_id, sender, content, read_by_client, read_by_admin, created_at) VALUES
  ('d1111111-1111-1111-1111-111111111111', 'admin', 'Bonjour, votre dossier est en attente de paiement de l''acompte.', true, true, NOW() - INTERVAL '1 day'),
  ('d1111111-1111-1111-1111-111111111111', 'client', 'Merci, je vais effectuer le paiement aujourd''hui.', true, true, NOW() - INTERVAL '1 day' + INTERVAL '2 hours'),
  ('d7777777-7777-7777-7777-777777777777', 'admin', 'URGENT: Votre solde de 2464€ est en retard. Le voyage a lieu dans 2 jours.', false, true, NOW() - INTERVAL '1 hour')
ON CONFLICT DO NOTHING;

-- =====================================================
-- RÉSUMÉ DES DONNÉES CRÉÉES
-- =====================================================
-- 5 clients
-- 3 demandes (différents statuts)
-- 7 dossiers (tous les statuts possibles)
-- 3 devis (accepté, rejeté, en attente)
-- 2 contrats
-- 3 factures (acompte pending, acompte paid, solde pending critique)
-- 1 paiement
-- 3 voyage_infos
-- 1 demande_chauffeur
-- Plusieurs entrées timeline
-- 1 demande_fournisseur avec BPA
-- 3 messages

SELECT 'Données de test générées avec succès!' as result;
