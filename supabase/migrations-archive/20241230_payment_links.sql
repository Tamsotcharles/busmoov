-- Table pour stocker les liens de paiement PayTweak
CREATE TABLE IF NOT EXISTS payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'paytweak',
  provider_link_id TEXT,
  payment_url TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('acompte', 'solde')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_payment_links_dossier_id ON payment_links(dossier_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_provider_link_id ON payment_links(provider_link_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_status ON payment_links(status);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_payment_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_payment_links_updated_at ON payment_links;
CREATE TRIGGER trigger_payment_links_updated_at
  BEFORE UPDATE ON payment_links
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_links_updated_at();

-- Ajouter provider et provider_payment_id a la table paiements si pas deja present
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'paiements' AND column_name = 'provider') THEN
    ALTER TABLE paiements ADD COLUMN provider TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'paiements' AND column_name = 'provider_payment_id') THEN
    ALTER TABLE paiements ADD COLUMN provider_payment_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'paiements' AND column_name = 'status') THEN
    ALTER TABLE paiements ADD COLUMN status TEXT DEFAULT 'completed';
  END IF;
END
$$;

-- RLS policies
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;

-- Policy pour lecture (admin et client proprietaire du dossier)
CREATE POLICY "payment_links_select_policy" ON payment_links
  FOR SELECT USING (
    -- Admin peut tout voir
    auth.role() = 'authenticated'
    OR
    -- Client peut voir ses propres liens
    EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = payment_links.dossier_id
      AND d.client_email = auth.jwt() ->> 'email'
    )
  );

-- Policy pour insertion (service role only via Edge Functions)
CREATE POLICY "payment_links_insert_policy" ON payment_links
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Policy pour update (service role only via Edge Functions)
CREATE POLICY "payment_links_update_policy" ON payment_links
  FOR UPDATE USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Commentaires
COMMENT ON TABLE payment_links IS 'Liens de paiement generes via PayTweak';
COMMENT ON COLUMN payment_links.provider IS 'Fournisseur de paiement (paytweak)';
COMMENT ON COLUMN payment_links.provider_link_id IS 'ID du lien chez le fournisseur';
COMMENT ON COLUMN payment_links.type IS 'Type de paiement: acompte ou solde';
COMMENT ON COLUMN payment_links.status IS 'Statut: pending, paid, failed, expired, cancelled';
