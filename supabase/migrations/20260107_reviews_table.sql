-- Migration: Création de la table des avis clients
-- Date: 2026-01-07
-- Description: Table pour collecter et gérer les avis clients après leurs voyages

-- Table des avis clients
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  token VARCHAR(64) UNIQUE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  client_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected', 'featured')),
  is_public BOOLEAN DEFAULT false,
  admin_response TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour recherches rapides
CREATE INDEX IF NOT EXISTS idx_reviews_dossier_id ON reviews(dossier_id);
CREATE INDEX IF NOT EXISTS idx_reviews_token ON reviews(token);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_is_public ON reviews(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating) WHERE status IN ('approved', 'featured');

-- Ajouter colonne completed_at sur dossiers si pas existante
ALTER TABLE dossiers ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reviews_updated_at ON reviews;
CREATE TRIGGER trigger_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();

-- RLS policies
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes si elles existent
DROP POLICY IF EXISTS "Public can read approved public reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;
DROP POLICY IF EXISTS "Anyone can submit review with valid token" ON reviews;

-- Lecture publique des avis approuvés et publics
CREATE POLICY "Public can read approved public reviews" ON reviews
  FOR SELECT USING (status IN ('approved', 'featured') AND is_public = true);

-- Les admins peuvent tout voir et modifier
CREATE POLICY "Admins can manage reviews" ON reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

-- Lecture via token (pour le formulaire d'avis)
CREATE POLICY "Anyone can read review by token" ON reviews
  FOR SELECT USING (true);

-- Mise à jour via token (pour soumettre l'avis)
CREATE POLICY "Anyone can update pending review" ON reviews
  FOR UPDATE USING (status = 'pending');

-- Template email pour demande d'avis
INSERT INTO email_templates (key, name, subject, html_content, is_active, description)
VALUES (
  'review_request',
  'Demande d''avis après voyage',
  'Comment s''est passé votre voyage ? - Réf. {{reference}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
    <div style="background: linear-gradient(135deg, #7c3aed, #ec4899); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">Busmoov</h1>
    </div>

    <div style="padding: 30px;">
      <h2 style="color: #1f2937; margin-top: 0;">Bonjour {{client_name}},</h2>

      <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">
        Nous espérons que votre voyage s''est bien passé !
      </p>

      <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">
        Votre avis est précieux pour nous. Il nous aide à améliorer nos services et guide les futurs voyageurs dans leur choix.
      </p>

      <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">
        <strong>Cela ne prend que 2 minutes !</strong>
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="{{lien_avis}}"
           style="background: linear-gradient(135deg, #7c3aed, #ec4899);
                  color: white;
                  padding: 16px 40px;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: bold;
                  font-size: 16px;
                  display: inline-block;
                  box-shadow: 0 4px 6px rgba(124, 58, 237, 0.3);">
          ⭐ Donner mon avis
        </a>
      </div>

      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-top: 30px;">
        <p style="color: #6b7280; font-size: 14px; margin: 0;">
          <strong>Référence :</strong> {{reference}}<br>
          Si vous avez des questions ou des remarques, n''hésitez pas à nous contacter au 01 76 31 12 83.
        </p>
      </div>
    </div>

    <div style="padding: 20px; text-align: center; background: #f9fafb; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        © 2025 Busmoov - Groupe Centrale Autocar<br>
        41 Rue Barrault, 75013 Paris
      </p>
    </div>
  </div>',
  true,
  'Email envoyé automatiquement après le voyage pour demander un avis au client'
) ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  description = EXCLUDED.description;

-- Commentaires
COMMENT ON TABLE reviews IS 'Avis clients après leur voyage';
COMMENT ON COLUMN reviews.status IS 'pending=en attente, submitted=soumis, approved=approuvé, rejected=rejeté, featured=mis en avant sur le site';
COMMENT ON COLUMN reviews.is_public IS 'Si true, l''avis sera affiché sur le site public (section témoignages)';
COMMENT ON COLUMN reviews.token IS 'Token unique envoyé par email pour permettre au client de soumettre son avis';
