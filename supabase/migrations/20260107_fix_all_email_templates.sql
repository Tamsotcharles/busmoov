-- ============================================
-- CORRECTION DE TOUS LES TEMPLATES D'EMAILS
-- 7 Janvier 2026
-- ============================================

-- ============================================
-- 1. CONFIRMATION DE DEMANDE (envoyé au client après soumission)
-- Problème: {{client_email}} n'était pas remplacé
-- ============================================
INSERT INTO email_templates (key, name, description, subject, body, html_content, variables, is_active, type)
VALUES (
  'confirmation_demande',
  'Confirmation de demande',
  'Email envoyé au client après soumission de sa demande de devis',
  'Votre demande de devis {{reference}} - Busmoov',
  'Bonjour {{client_name}},

Nous avons bien recu votre demande de devis et nous vous en remercions !

Recapitulatif de votre demande :
- Reference : {{reference}}
- Trajet : {{departure}} - {{arrival}}
- Date : {{departure_date}}
- Passagers : {{passengers}} personnes

Vos identifiants de connexion :
- Email : {{client_email}}
- Reference : {{reference}}

Vous pouvez suivre votre demande et consulter vos devis sur votre espace client :
{{lien_espace_client}}

Notre equipe traite votre demande et vous recevrez vos devis sous peu.

Cordialement,
L''equipe Busmoov',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 20px;">
    <h1 style="color: #E91E63; margin: 0; font-size: 28px;">Busmoov</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 10px;">
    <p style="font-size: 16px;">Bonjour <strong>{{client_name}}</strong>,</p>

    <p>Nous avons bien recu votre demande de devis et nous vous en remercions !</p>

    <div style="background: #FFF3E0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF9800;">
      <h3 style="margin-top: 0; color: #E65100;">Recapitulatif de votre demande</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Reference :</td>
          <td style="padding: 8px 0; font-weight: bold; color: #4A1A6B;">{{reference}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Trajet :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{departure}} &rarr; {{arrival}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Date :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{departure_date}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Passagers :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{passengers}} personnes</td>
        </tr>
      </table>
    </div>

    <div style="background: #E8F5E9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
      <h3 style="margin-top: 0; color: #2E7D32;">Vos identifiants de connexion</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Email :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{client_email}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Reference :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{reference}}</td>
        </tr>
      </table>
    </div>

    <p>Conservez ces informations pour acceder a votre espace client et suivre l''avancement de votre demande.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{lien_espace_client}}" style="display: inline-block; background: linear-gradient(135deg, #E91E63 0%, #9C27B0 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Acceder a mon espace client
      </a>
    </div>

    <div style="background: #E3F2FD; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; color: #1565C0; font-size: 14px;">
        Notre equipe traite votre demande et vous recevrez vos devis sous peu par email.
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="color: #666; font-size: 14px;">
      Une question ? Notre equipe est a votre disposition :<br>
      Tel: <a href="tel:+33176311283" style="color: #E91E63;">01 76 31 12 83</a><br>
      Email: <a href="mailto:infos@busmoov.com" style="color: #E91E63;">infos@busmoov.com</a>
    </p>

    <p style="margin-top: 30px;">
      Merci de votre confiance !<br>
      <strong>L''equipe Busmoov</strong>
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>Busmoov SAS - 41 Rue Barrault, 75013 Paris</p>
  </div>
</body>
</html>',
  '[
    {"name": "client_name", "description": "Nom du client"},
    {"name": "client_email", "description": "Email du client"},
    {"name": "reference", "description": "Reference de la demande"},
    {"name": "dossier_reference", "description": "Reference du dossier"},
    {"name": "departure", "description": "Ville de depart"},
    {"name": "arrival", "description": "Ville d''arrivee"},
    {"name": "departure_date", "description": "Date de depart"},
    {"name": "passengers", "description": "Nombre de passagers"},
    {"name": "lien_espace_client", "description": "Lien vers l''espace client"}
  ]'::jsonb,
  true,
  'notification'
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
-- 2. DEVIS PRETS (quote_sent) - Notification au client
-- ============================================
INSERT INTO email_templates (key, name, description, subject, body, html_content, variables, is_active, type)
VALUES (
  'quote_sent',
  'Devis prets',
  'Email envoye au client quand ses devis sont disponibles',
  'Vos devis sont prets - {{reference}}',
  'Bonjour {{client_name}},

Bonne nouvelle ! Nous avons prepare {{nb_devis}} devis pour votre demande de transport.

Reference : {{reference}}
Trajet : {{departure}} - {{arrival}}
Date : {{departure_date}}
Passagers : {{passengers}} personnes

Consultez vos devis et choisissez celui qui vous convient :
{{lien_espace_client}}

Nos devis sont valables 7 jours. N''hesitez pas a nous contacter si vous avez des questions.

Cordialement,
L''equipe Busmoov',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #E91E63 0%, #9C27B0 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Vos devis sont prets !</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Bonjour <strong>{{client_name}}</strong>,</p>

    <p>Bonne nouvelle ! Nous avons prepare <strong>{{nb_devis}} devis</strong> pour votre demande de transport.</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #E91E63;">
      <h3 style="margin-top: 0; color: #4A1A6B;">Recapitulatif</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Reference :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{reference}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Trajet :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{departure}} &rarr; {{arrival}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Date :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{departure_date}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Passagers :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{passengers}} personnes</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{lien_espace_client}}" style="display: inline-block; background: linear-gradient(135deg, #E91E63 0%, #9C27B0 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Voir mes devis
      </a>
    </div>

    <div style="background: #FFF8E1; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; color: #F57C00; font-size: 14px;">
        Nos devis sont valables 7 jours. Reservez vite pour garantir votre transport !
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="color: #666; font-size: 14px;">
      Une question ? Notre equipe est a votre disposition :<br>
      Tel: <a href="tel:+33176311283" style="color: #E91E63;">01 76 31 12 83</a><br>
      Email: <a href="mailto:infos@busmoov.com" style="color: #E91E63;">infos@busmoov.com</a>
    </p>

    <p style="margin-top: 30px;">
      Cordialement,<br>
      <strong>L''equipe Busmoov</strong>
    </p>
  </div>
</body>
</html>',
  '[
    {"name": "client_name", "description": "Nom du client"},
    {"name": "reference", "description": "Reference du dossier"},
    {"name": "nb_devis", "description": "Nombre de devis"},
    {"name": "departure", "description": "Ville de depart"},
    {"name": "arrival", "description": "Ville d''arrivee"},
    {"name": "departure_date", "description": "Date de depart"},
    {"name": "passengers", "description": "Nombre de passagers"},
    {"name": "lien_espace_client", "description": "Lien vers l''espace client"}
  ]'::jsonb,
  true,
  'notification'
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
-- 3. RAPPEL ACOMPTE (payment_reminder)
-- ============================================
INSERT INTO email_templates (key, name, description, subject, body, html_content, variables, is_active, type)
VALUES (
  'payment_reminder',
  'Rappel acompte',
  'Email de rappel pour le paiement de l''acompte',
  'Rappel : Acompte a regler - Dossier {{reference}}',
  'Bonjour {{client_name}},

Nous vous rappelons que l''acompte de votre reservation n''a pas encore ete regle.

Reference : {{reference}}
Trajet : {{departure}} - {{arrival}}
Date de depart : {{departure_date}}
Montant de l''acompte : {{montant_acompte}}

Pour confirmer definitivement votre reservation, merci de regler l''acompte :
{{lien_paiement}}

Sans reglement de votre part, votre reservation ne pourra pas etre confirmee.

Cordialement,
L''equipe Busmoov',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Rappel : Acompte a regler</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Bonjour <strong>{{client_name}}</strong>,</p>

    <p>Nous vous rappelons que l''acompte de votre reservation n''a pas encore ete regle.</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF9800;">
      <h3 style="margin-top: 0; color: #4A1A6B;">Votre reservation</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Reference :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{reference}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Trajet :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{departure}} &rarr; {{arrival}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Date de depart :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{departure_date}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Acompte a regler :</td>
          <td style="padding: 8px 0; font-weight: bold; color: #FF9800;">{{montant_acompte}}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{lien_paiement}}" style="display: inline-block; background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Regler mon acompte
      </a>
    </div>

    <div style="background: #FFEBEE; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; color: #C62828; font-size: 14px;">
        <strong>Important :</strong> Sans reglement de votre part, votre reservation ne pourra pas etre confirmee aupres du transporteur.
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="color: #666; font-size: 14px;">
      Une question ? Contactez-nous :<br>
      Tel: <a href="tel:+33176311283" style="color: #E91E63;">01 76 31 12 83</a><br>
      Email: <a href="mailto:infos@busmoov.com" style="color: #E91E63;">infos@busmoov.com</a>
    </p>
  </div>
</body>
</html>',
  '[
    {"name": "client_name", "description": "Nom du client"},
    {"name": "reference", "description": "Reference du dossier"},
    {"name": "departure", "description": "Ville de depart"},
    {"name": "arrival", "description": "Ville d''arrivee"},
    {"name": "departure_date", "description": "Date de depart"},
    {"name": "montant_acompte", "description": "Montant de l''acompte"},
    {"name": "lien_paiement", "description": "Lien de paiement"},
    {"name": "lien_espace_client", "description": "Lien vers l''espace client"}
  ]'::jsonb,
  true,
  'relance'
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
-- 4. RAPPEL SOLDE (rappel_solde)
-- ============================================
INSERT INTO email_templates (key, name, description, subject, body, html_content, variables, is_active, type)
VALUES (
  'rappel_solde',
  'Rappel solde',
  'Email de rappel pour le paiement du solde',
  'Rappel : Solde a regler - Dossier {{reference}}',
  'Bonjour {{client_name}},

Votre voyage approche ! Nous vous rappelons que le solde de votre reservation doit etre regle.

Reference : {{reference}}
Trajet : {{departure}} - {{arrival}}
Date de depart : {{departure_date}}
Solde a regler : {{montant_solde}}

Reglez votre solde en ligne :
{{lien_paiement}}

Le solde doit etre regle au moins 30 jours avant le depart pour confirmer definitivement votre reservation.

Cordialement,
L''equipe Busmoov',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #FF5722 0%, #E64A19 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Rappel : Solde a regler</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Bonjour <strong>{{client_name}}</strong>,</p>

    <p>Votre voyage approche ! Nous vous rappelons que le solde de votre reservation doit etre regle.</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF5722;">
      <h3 style="margin-top: 0; color: #4A1A6B;">Votre reservation</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Reference :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{reference}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Trajet :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{departure}} &rarr; {{arrival}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Date de depart :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{departure_date}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Solde a regler :</td>
          <td style="padding: 8px 0; font-weight: bold; color: #FF5722;">{{montant_solde}}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{lien_paiement}}" style="display: inline-block; background: linear-gradient(135deg, #FF5722 0%, #E64A19 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Regler le solde
      </a>
    </div>

    <div style="background: #FFF8E1; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; color: #F57C00; font-size: 14px;">
        Le solde doit etre regle au moins 30 jours avant le depart.
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="color: #666; font-size: 14px;">
      Tel: <a href="tel:+33176311283" style="color: #E91E63;">01 76 31 12 83</a><br>
      Email: <a href="mailto:infos@busmoov.com" style="color: #E91E63;">infos@busmoov.com</a>
    </p>
  </div>
</body>
</html>',
  '[
    {"name": "client_name", "description": "Nom du client"},
    {"name": "reference", "description": "Reference du dossier"},
    {"name": "departure", "description": "Ville de depart"},
    {"name": "arrival", "description": "Ville d''arrivee"},
    {"name": "departure_date", "description": "Date de depart"},
    {"name": "montant_solde", "description": "Montant du solde"},
    {"name": "lien_paiement", "description": "Lien de paiement"},
    {"name": "lien_espace_client", "description": "Lien vers l''espace client"}
  ]'::jsonb,
  true,
  'relance'
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
-- 5. DEMANDE INFOS VOYAGE (info_request)
-- ============================================
INSERT INTO email_templates (key, name, description, subject, body, html_content, variables, is_active, type)
VALUES (
  'info_request',
  'Demande infos voyage',
  'Email pour demander les informations du voyage au client',
  'Informations necessaires pour votre voyage - {{reference}}',
  'Bonjour {{client_name}},

Votre voyage approche ! Pour finaliser la preparation, nous avons besoin de quelques informations.

Reference : {{reference}}
Trajet : {{departure}} - {{arrival}}
Date de depart : {{departure_date}}

Merci de completer les informations de votre voyage :
{{lien_infos_voyage}}

Ces informations sont essentielles pour que le chauffeur puisse vous prendre en charge dans les meilleures conditions.

Cordialement,
L''equipe Busmoov',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Informations voyage</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Bonjour <strong>{{client_name}}</strong>,</p>

    <p>Votre voyage approche ! Pour finaliser la preparation, nous avons besoin de quelques informations.</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196F3;">
      <h3 style="margin-top: 0; color: #4A1A6B;">Votre voyage</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Reference :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{reference}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Trajet :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{departure}} &rarr; {{arrival}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Date de depart :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{departure_date}}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{lien_infos_voyage}}" style="display: inline-block; background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Completer mes informations
      </a>
    </div>

    <div style="background: #E3F2FD; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; color: #1565C0; font-size: 14px;">
        <strong>Informations necessaires :</strong> adresses exactes de prise en charge et depot, horaires, contacts sur place.
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="color: #666; font-size: 14px;">
      Tel: <a href="tel:+33176311283" style="color: #E91E63;">01 76 31 12 83</a><br>
      Email: <a href="mailto:infos@busmoov.com" style="color: #E91E63;">infos@busmoov.com</a>
    </p>
  </div>
</body>
</html>',
  '[
    {"name": "client_name", "description": "Nom du client"},
    {"name": "reference", "description": "Reference du dossier"},
    {"name": "departure", "description": "Ville de depart"},
    {"name": "arrival", "description": "Ville d''arrivee"},
    {"name": "departure_date", "description": "Date de depart"},
    {"name": "lien_infos_voyage", "description": "Lien vers le formulaire infos voyage"},
    {"name": "lien_espace_client", "description": "Lien vers l''espace client"}
  ]'::jsonb,
  true,
  'relance'
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
-- 6. INFOS CHAUFFEUR (driver_info)
-- ============================================
INSERT INTO email_templates (key, name, description, subject, body, html_content, variables, is_active, type)
VALUES (
  'driver_info',
  'Infos chauffeur',
  'Email envoye au client avec les coordonnees du chauffeur',
  'Votre feuille de route - Depart le {{departure_date}}',
  'Bonjour {{client_name}},

Votre voyage est imminent ! Voici les coordonnees de votre chauffeur.

Reference : {{reference}}
Date de depart : {{departure_date}}

Votre chauffeur :
- Nom : {{chauffeur_name}}
- Telephone : {{chauffeur_phone}}
- Transporteur : {{transporteur}}

Consultez votre feuille de route complete sur votre espace client :
{{lien_espace_client}}

Bon voyage !

Cordialement,
L''equipe Busmoov',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Votre feuille de route</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Bonjour <strong>{{client_name}}</strong>,</p>

    <p>Votre voyage est imminent ! Voici les coordonnees de votre chauffeur.</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
      <h3 style="margin-top: 0; color: #4A1A6B;">Votre chauffeur</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Nom :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{chauffeur_name}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Telephone :</td>
          <td style="padding: 8px 0; font-weight: bold;"><a href="tel:{{chauffeur_phone}}" style="color: #4CAF50;">{{chauffeur_phone}}</a></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Transporteur :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{transporteur}}</td>
        </tr>
      </table>
    </div>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9C27B0;">
      <h3 style="margin-top: 0; color: #4A1A6B;">Votre voyage</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Reference :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{reference}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Date de depart :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{departure_date}}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{lien_espace_client}}" style="display: inline-block; background: linear-gradient(135deg, #E91E63 0%, #9C27B0 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Voir ma feuille de route
      </a>
    </div>

    <div style="background: #E8F5E9; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; color: #2E7D32; font-size: 18px;">
        Bon voyage !
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="color: #666; font-size: 14px;">
      En cas d''urgence :<br>
      Tel: <a href="tel:+33176311283" style="color: #E91E63;">01 76 31 12 83</a><br>
      Email: <a href="mailto:infos@busmoov.com" style="color: #E91E63;">infos@busmoov.com</a>
    </p>
  </div>
</body>
</html>',
  '[
    {"name": "client_name", "description": "Nom du client"},
    {"name": "reference", "description": "Reference du dossier"},
    {"name": "departure_date", "description": "Date de depart"},
    {"name": "chauffeur_name", "description": "Nom du chauffeur"},
    {"name": "chauffeur_phone", "description": "Telephone du chauffeur"},
    {"name": "transporteur", "description": "Nom du transporteur"},
    {"name": "lien_espace_client", "description": "Lien vers l''espace client"}
  ]'::jsonb,
  true,
  'notification'
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
-- 7. DEMANDE CHAUFFEUR (demande_chauffeur) - au transporteur
-- ============================================
INSERT INTO email_templates (key, name, description, subject, body, html_content, variables, is_active, type)
VALUES (
  'demande_chauffeur',
  'Demande chauffeur',
  'Email envoye au transporteur pour demander les infos chauffeur',
  'Demande coordonnees chauffeur - {{reference}}',
  'Bonjour,

Le voyage suivant approche. Merci de nous communiquer les coordonnees du chauffeur.

Reference : {{reference}}
Trajet : {{departure}} - {{arrival}}
Date de depart : {{departure_date}}

{{#if lien_formulaire}}
Completez les informations du chauffeur :
{{lien_formulaire}}
{{else}}
Merci de nous communiquer :
- Nom et prenom du chauffeur
- Numero de telephone
- Immatriculation du vehicule
{{/if}}

Cordialement,
L''equipe Busmoov',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #4A1A6B 0%, #E91E63 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Demande coordonnees chauffeur</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p>Bonjour,</p>

    <p>Le voyage suivant approche. Merci de nous communiquer les coordonnees du chauffeur.</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4A1A6B;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Reference :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{reference}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Trajet :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{departure}} &rarr; {{arrival}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Date de depart :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{departure_date}}</td>
        </tr>
      </table>
    </div>

    {{#if lien_formulaire}}
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{lien_formulaire}}" style="display: inline-block; background: linear-gradient(135deg, #4A1A6B 0%, #E91E63 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Completer les infos chauffeur
      </a>
    </div>
    {{else}}
    <div style="background: #FFF3E0; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; color: #E65100; font-size: 14px;">
        <strong>Merci de nous communiquer :</strong><br>
        - Nom et prenom du chauffeur<br>
        - Numero de telephone<br>
        - Immatriculation du vehicule
      </p>
    </div>
    {{/if}}

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="margin-top: 30px;">
      Cordialement,<br>
      <strong>L''equipe Busmoov</strong>
    </p>
  </div>
</body>
</html>',
  '[
    {"name": "reference", "description": "Reference du dossier"},
    {"name": "departure", "description": "Ville de depart"},
    {"name": "arrival", "description": "Ville d''arrivee"},
    {"name": "departure_date", "description": "Date de depart"},
    {"name": "lien_formulaire", "description": "Lien vers le formulaire chauffeur"},
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
-- VERIFICATION
-- ============================================
SELECT
  key,
  name,
  CASE WHEN html_content IS NOT NULL AND html_content != '' THEN 'OK' ELSE 'MANQUANT' END as html_ok,
  jsonb_array_length(variables) as nb_variables
FROM email_templates
WHERE key IN (
  'confirmation_demande',
  'quote_sent',
  'payment_reminder',
  'rappel_solde',
  'info_request',
  'driver_info',
  'demande_chauffeur',
  'confirmation_reservation',
  'confirmation_solde',
  'demande_fournisseur'
)
ORDER BY key;
