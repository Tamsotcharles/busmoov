-- Migration pour corriger le template demande_fournisseur
-- 1. Prix affiché en TTC (prix fournisseur)
-- 2. Ajout du type de prestation
-- 3. Ajout nombre de véhicules et chauffeurs
-- 4. Suppression du type de véhicule
-- 5. Labels dynamiques pour les dates (label_date_depart, label_date_retour)

UPDATE email_templates
SET
  body = 'Bonjour,

Suite à votre proposition, nous vous confirmons la réservation suivante :

Référence dossier : {{reference}}
Type de prestation : {{type_prestation}}
Trajet : {{departure}} - {{arrival}}
{{label_date_depart}} : {{departure_date}}{{#if heure_depart}} à {{heure_depart}}{{/if}}
{{#if return_date}}{{label_date_retour}} : {{return_date}}{{#if heure_retour}} à {{heure_retour}}{{/if}}{{/if}}
{{#if duree_jours}}Durée : {{duree_jours}} jour(s){{/if}}
{{#if detail_mad}}Détail mise à disposition : {{detail_mad}}{{/if}}
{{#if passengers}}Nombre de passagers : {{passengers}}{{/if}}
{{#if nb_cars}}Nombre de véhicules : {{nb_cars}}{{/if}}
{{#if nb_chauffeurs}}Nombre de chauffeurs : {{nb_chauffeurs}}{{/if}}

Montant convenu : {{prix_achat}} EUR TTC

{{#if lien_validation}}Pour valider cette commande, cliquez sur le lien suivant :
{{lien_validation}}{{else}}Merci de nous retourner le Bon Pour Accord (BPA) signé afin de finaliser cette réservation.{{/if}}

Cordialement,
L''équipe Busmoov',
  html_content = '<!DOCTYPE html>
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
          <td style="padding: 8px 0; color: #666;">Type de prestation :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{type_prestation}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Trajet :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{departure}} - {{arrival}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">{{label_date_depart}} :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{departure_date}}{{#if heure_depart}} à {{heure_depart}}{{/if}}</td>
        </tr>
        {{#if return_date}}
        <tr>
          <td style="padding: 8px 0; color: #666;">{{label_date_retour}} :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{return_date}}{{#if heure_retour}} à {{heure_retour}}{{/if}}</td>
        </tr>
        {{/if}}
        {{#if duree_jours}}
        <tr>
          <td style="padding: 8px 0; color: #666;">Durée :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{duree_jours}} jour(s)</td>
        </tr>
        {{/if}}
        {{#if detail_mad}}
        <tr>
          <td style="padding: 8px 0; color: #666;">Détail mise à disposition :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{detail_mad}}</td>
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
          <td style="padding: 8px 0; color: #666;">Nombre de véhicules :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{nb_cars}}</td>
        </tr>
        {{/if}}
        {{#if nb_chauffeurs}}
        <tr>
          <td style="padding: 8px 0; color: #666;">Nombre de chauffeurs :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{nb_chauffeurs}}</td>
        </tr>
        {{/if}}
        <tr>
          <td style="padding: 8px 0; color: #666;">Montant convenu :</td>
          <td style="padding: 8px 0; font-weight: bold; color: #4A1A6B;">{{prix_achat}} EUR TTC</td>
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
  variables = '[
    {"name": "reference", "description": "Référence du dossier"},
    {"name": "type_prestation", "description": "Type de prestation (Aller simple, Aller-Retour, Mise à disposition)"},
    {"name": "label_date_depart", "description": "Label pour date de départ (Date aller ou Date début)"},
    {"name": "label_date_retour", "description": "Label pour date de retour (Date retour ou Date fin)"},
    {"name": "departure", "description": "Ville de départ"},
    {"name": "arrival", "description": "Ville d''arrivée"},
    {"name": "departure_date", "description": "Date de départ"},
    {"name": "return_date", "description": "Date de retour/fin"},
    {"name": "heure_depart", "description": "Heure de départ"},
    {"name": "heure_retour", "description": "Heure de retour"},
    {"name": "duree_jours", "description": "Durée en jours"},
    {"name": "detail_mad", "description": "Détail de la mise à disposition"},
    {"name": "passengers", "description": "Nombre de passagers"},
    {"name": "nb_cars", "description": "Nombre de véhicules"},
    {"name": "nb_chauffeurs", "description": "Nombre de chauffeurs"},
    {"name": "prix_achat", "description": "Prix d''achat fournisseur TTC"},
    {"name": "lien_validation", "description": "Lien de validation BPA (auto)"},
    {"name": "transporteur_name", "description": "Nom du transporteur"}
  ]'::jsonb,
  updated_at = NOW()
WHERE key = 'demande_fournisseur';

-- Vérification
SELECT key,
       CASE WHEN body LIKE '%EUR TTC%' THEN 'OK' ELSE 'ERREUR' END as prix_ttc,
       CASE WHEN body LIKE '%type_prestation%' THEN 'OK' ELSE 'ERREUR' END as type_prestation,
       CASE WHEN body LIKE '%label_date_depart%' THEN 'OK' ELSE 'ERREUR' END as labels_dynamiques
FROM email_templates
WHERE key = 'demande_fournisseur';
