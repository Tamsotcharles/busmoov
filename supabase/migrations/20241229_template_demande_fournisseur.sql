-- ============================================
-- TEMPLATE EMAIL POUR DEMANDE FOURNISSEUR
-- Permet de personnaliser l'email envoyé aux transporteurs
-- Toutes les variables sont disponibles, utilisez celles dont vous avez besoin
-- ============================================

-- Template: Demande fournisseur (confirmation de commande)
INSERT INTO email_templates (key, name, description, subject, body, html_content, variables, is_active, type)
VALUES (
  'demande_fournisseur',
  'Confirmation de commande fournisseur',
  'Email envoyé au transporteur pour confirmer une commande. Personnalisez le contenu selon vos besoins.',
  'Confirmation de commande - {{reference}}',
  'Bonjour,

Suite à votre proposition, nous vous confirmons la réservation suivante :

Référence dossier : {{reference}}
Trajet : {{departure}} - {{arrival}}
Date aller : {{departure_date}}{{#if heure_depart}} à {{heure_depart}}{{/if}}
{{#if return_date}}Date retour : {{return_date}}{{#if heure_retour}} à {{heure_retour}}{{/if}}{{/if}}
{{#if passengers}}Nombre de passagers : {{passengers}}{{/if}}
{{#if nb_cars}}Nombre de cars : {{nb_cars}}{{/if}}
{{#if nb_chauffeurs}}Nombre de chauffeurs : {{nb_chauffeurs}}{{/if}}
{{#if vehicle_type}}Type de véhicule : {{vehicle_type}}{{/if}}
{{#if mise_a_dispo}}Mise à disposition : {{mise_a_dispo}}{{/if}}
Montant convenu : {{prix_achat}} EUR HT

{{#if lien_validation}}
Pour valider cette commande, cliquez sur le lien suivant :
{{lien_validation}}
{{else}}
Merci de nous retourner le Bon Pour Accord (BPA) signé afin de finaliser cette réservation.
{{/if}}

Cordialement,
L''équipe Busmoov',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #4A1A6B 0%, #E91E63 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Confirmation de commande</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p>Bonjour,</p>

    <p>Suite à votre proposition, nous vous confirmons la réservation suivante :</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4A1A6B;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Référence :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{reference}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Trajet :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{departure}} - {{arrival}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Date aller :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{departure_date}}{{#if heure_depart}} à {{heure_depart}}{{/if}}</td>
        </tr>
        {{#if return_date}}
        <tr>
          <td style="padding: 8px 0; color: #666;">Date retour :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{return_date}}{{#if heure_retour}} à {{heure_retour}}{{/if}}</td>
        </tr>
        {{/if}}
        {{#if passengers}}
        <tr>
          <td style="padding: 8px 0; color: #666;">Passagers :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{passengers}}</td>
        </tr>
        {{/if}}
        {{#if nb_cars}}
        <tr>
          <td style="padding: 8px 0; color: #666;">Nombre de cars :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{nb_cars}}</td>
        </tr>
        {{/if}}
        {{#if nb_chauffeurs}}
        <tr>
          <td style="padding: 8px 0; color: #666;">Nombre de chauffeurs :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{nb_chauffeurs}}</td>
        </tr>
        {{/if}}
        {{#if vehicle_type}}
        <tr>
          <td style="padding: 8px 0; color: #666;">Type de véhicule :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{vehicle_type}}</td>
        </tr>
        {{/if}}
        {{#if mise_a_dispo}}
        <tr>
          <td style="padding: 8px 0; color: #666;">Mise à disposition :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{mise_a_dispo}}</td>
        </tr>
        {{/if}}
        <tr>
          <td style="padding: 8px 0; color: #666;">Montant convenu :</td>
          <td style="padding: 8px 0; font-weight: bold; color: #4A1A6B;">{{prix_achat}} EUR HT</td>
        </tr>
      </table>
    </div>

    {{#if lien_validation}}
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{lien_validation}}" style="display: inline-block; background: linear-gradient(135deg, #4A1A6B 0%, #E91E63 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Valider la commande
      </a>
    </div>
    <p style="text-align: center; color: #666; font-size: 14px;">
      Ce lien vous permet de confirmer la commande en un clic, sans avoir à nous renvoyer de document.
    </p>
    {{else}}
    <p>Merci de nous retourner le <strong>Bon Pour Accord (BPA)</strong> signé afin de finaliser cette réservation.</p>
    {{/if}}

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="margin-top: 30px;">
      Cordialement,<br>
      <strong>L''équipe Busmoov</strong>
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>Busmoov SAS - 41 Rue Barrault, 75013 Paris</p>
  </div>
</body>
</html>',
  '[
    {"name": "reference", "description": "Référence du dossier"},
    {"name": "departure", "description": "Ville de départ"},
    {"name": "arrival", "description": "Ville d''arrivée"},
    {"name": "departure_date", "description": "Date de départ"},
    {"name": "return_date", "description": "Date de retour"},
    {"name": "heure_depart", "description": "Heure de départ"},
    {"name": "heure_retour", "description": "Heure de retour"},
    {"name": "passengers", "description": "Nombre de passagers"},
    {"name": "nb_cars", "description": "Nombre de cars"},
    {"name": "nb_chauffeurs", "description": "Nombre de chauffeurs"},
    {"name": "vehicle_type", "description": "Type de véhicule"},
    {"name": "mise_a_dispo", "description": "Mise à disposition (Oui/Non)"},
    {"name": "prix_achat", "description": "Prix d''achat HT"},
    {"name": "lien_validation", "description": "Lien de validation BPA (auto)"},
    {"name": "transporteur_name", "description": "Nom du transporteur"}
  ]'::jsonb,
  true,
  'workflow'
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  html_content = EXCLUDED.html_content,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- ============================================
-- TEMPLATE 2: DEMANDE DE PRIX FOURNISSEUR
-- Email envoyé pour demander un devis/prix au transporteur
-- ============================================

INSERT INTO email_templates (key, name, description, subject, body, html_content, variables, is_active, type)
VALUES (
  'demande_prix_fournisseur',
  'Demande de prix fournisseur',
  'Email envoyé au transporteur pour demander un devis. Personnalisez les informations à inclure.',
  'Demande de disponibilité - {{reference}}',
  'Bonjour,

Pouvez-vous me faire une proposition pour la prestation suivante :

Trajet : {{departure}} - {{arrival}}
Date départ : {{departure_date}}{{#if heure_depart}} à {{heure_depart}}{{/if}}
{{#if return_date}}Date retour : {{return_date}}{{#if heure_retour}} à {{heure_retour}}{{/if}}{{/if}}
{{#if trip_mode}}Type : {{trip_mode}}{{/if}}
{{#if passengers}}Passagers : {{passengers}}{{/if}}
{{#if vehicle_type}}Type de véhicule : {{vehicle_type}}{{/if}}

{{#if departure_address}}Adresse départ : {{departure_address}}{{/if}}
{{#if arrival_address}}Adresse arrivée : {{arrival_address}}{{/if}}

{{#if special_requests}}Remarques : {{special_requests}}{{/if}}

Merci de me faire parvenir votre meilleur tarif.

Cordialement,
L''équipe Busmoov',
  NULL,
  '[
    {"name": "reference", "description": "Référence du dossier"},
    {"name": "departure", "description": "Ville de départ"},
    {"name": "arrival", "description": "Ville d''arrivée"},
    {"name": "departure_date", "description": "Date de départ"},
    {"name": "return_date", "description": "Date de retour"},
    {"name": "heure_depart", "description": "Heure de départ"},
    {"name": "heure_retour", "description": "Heure de retour"},
    {"name": "trip_mode", "description": "Type de trajet (Aller simple, Aller-Retour, Circuit)"},
    {"name": "passengers", "description": "Nombre de passagers"},
    {"name": "vehicle_type", "description": "Type de véhicule"},
    {"name": "departure_address", "description": "Adresse de départ"},
    {"name": "arrival_address", "description": "Adresse d''arrivée"},
    {"name": "special_requests", "description": "Remarques/demandes spéciales"},
    {"name": "transporteur_name", "description": "Nom du transporteur"}
  ]'::jsonb,
  true,
  'workflow'
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  html_content = EXCLUDED.html_content,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- Vérification
SELECT 'Templates créés:' as info, key, name FROM email_templates WHERE key IN ('demande_fournisseur', 'demande_prix_fournisseur');
