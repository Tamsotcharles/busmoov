/**
 * Génération de factures électroniques XML
 * - Factur-X / ZUGFeRD (France & Allemagne)
 * - FacturaE (Espagne)
 *
 * Conformité :
 * - EN 16931 (norme européenne)
 * - Factur-X MINIMUM / BASIC (FR)
 * - ZUGFeRD 2.1 (DE)
 * - FacturaE 3.2.x (ES)
 */

// Types pour les données de facture électronique
export interface EInvoiceData {
  // Identifiants
  invoiceNumber: string
  invoiceDate: string // ISO format YYYY-MM-DD
  dueDate?: string

  // Type
  type: 'acompte' | 'solde' | 'avoir'

  // Émetteur (Busmoov)
  seller: {
    name: string
    address: string
    zipCode: string
    city: string
    country: string // Code ISO 2 lettres (FR, DE, ES)
    vatNumber: string // N° TVA intracommunautaire
    siret?: string // SIRET (FR) / CIF (ES) / HRB (DE)
    email?: string
    phone?: string
  }

  // Client
  buyer: {
    name: string
    address?: string
    zipCode?: string
    city?: string
    country?: string
    vatNumber?: string // N° TVA intracommunautaire client
    email?: string
    leitwegId?: string // Leitweg-ID pour facturation B2G allemande
    dir3Code?: string // Code DIR3 pour facturation B2G espagnole
  }

  // Référence commande client (marchés publics)
  orderReference?: string

  // Lignes de facture
  lines: {
    description: string
    quantity: number
    unitPrice: number // HT
    vatRate: number // en %
    totalHT: number
    totalTTC: number
  }[]

  // Totaux
  totalHT: number
  totalVAT: number
  totalTTC: number
  vatRate: number

  // Référence dossier
  dossierReference?: string

  // Devise
  currency: string // EUR, GBP

  // Pays pour déterminer le format
  countryCode: 'FR' | 'DE' | 'ES' | 'GB'
}

/**
 * Génère le XML Factur-X / ZUGFeRD (compatible FR et DE)
 * Profil BASIC conforme EN 16931
 */
export function generateFacturXML(data: EInvoiceData): string {
  const isCredit = data.type === 'avoir'
  const typeCode = isCredit ? '381' : '380' // 380 = facture, 381 = avoir

  // Format date pour XML (YYYYMMDD)
  const formatXMLDate = (isoDate: string) => isoDate.replace(/-/g, '')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
    xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
    xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">

  <!-- Contexte du document -->
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:factur-x.eu:1p0:basicwl</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>

  <!-- En-tête du document -->
  <rsm:ExchangedDocument>
    <ram:ID>${escapeXml(data.invoiceNumber)}</ram:ID>
    <ram:TypeCode>${typeCode}</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${formatXMLDate(data.invoiceDate)}</udt:DateTimeString>
    </ram:IssueDateTime>
    ${data.dossierReference ? `<ram:IncludedNote>
      <ram:Content>Dossier: ${escapeXml(data.dossierReference)}</ram:Content>
    </ram:IncludedNote>` : ''}
  </rsm:ExchangedDocument>

  <!-- Transaction commerciale -->
  <rsm:SupplyChainTradeTransaction>

    <!-- Accord commercial -->
    <ram:ApplicableHeaderTradeAgreement>
      ${data.buyer.leitwegId ? `<!-- BT-10 Buyer Reference (Leitweg-ID for German B2G) -->
      <ram:BuyerReference>${escapeXml(data.buyer.leitwegId)}</ram:BuyerReference>` : ''}

      <!-- Vendeur (Busmoov) -->
      <ram:SellerTradeParty>
        <ram:Name>${escapeXml(data.seller.name)}</ram:Name>
        ${data.seller.siret ? `<ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="${data.countryCode === 'FR' ? '0002' : data.countryCode === 'ES' ? '0003' : '0204'}">${escapeXml(data.seller.siret)}</ram:ID>
        </ram:SpecifiedLegalOrganization>` : ''}
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${escapeXml(data.seller.zipCode)}</ram:PostcodeCode>
          <ram:LineOne>${escapeXml(data.seller.address)}</ram:LineOne>
          <ram:CityName>${escapeXml(data.seller.city)}</ram:CityName>
          <ram:CountryID>${data.seller.country}</ram:CountryID>
        </ram:PostalTradeAddress>
        ${data.seller.email ? `<ram:URIUniversalCommunication>
          <ram:URIID schemeID="EM">${escapeXml(data.seller.email)}</ram:URIID>
        </ram:URIUniversalCommunication>` : ''}
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${escapeXml(data.seller.vatNumber)}</ram:ID>
        </ram:SpecifiedTaxRegistration>
      </ram:SellerTradeParty>

      <!-- Acheteur (Client) -->
      <ram:BuyerTradeParty>
        <ram:Name>${escapeXml(data.buyer.name)}</ram:Name>
        ${data.buyer.address ? `<ram:PostalTradeAddress>
          ${data.buyer.zipCode ? `<ram:PostcodeCode>${escapeXml(data.buyer.zipCode)}</ram:PostcodeCode>` : ''}
          <ram:LineOne>${escapeXml(data.buyer.address)}</ram:LineOne>
          ${data.buyer.city ? `<ram:CityName>${escapeXml(data.buyer.city)}</ram:CityName>` : ''}
          ${data.buyer.country ? `<ram:CountryID>${data.buyer.country}</ram:CountryID>` : ''}
        </ram:PostalTradeAddress>` : ''}
        ${data.buyer.email ? `<ram:URIUniversalCommunication>
          <ram:URIID schemeID="EM">${escapeXml(data.buyer.email)}</ram:URIID>
        </ram:URIUniversalCommunication>` : ''}
        ${data.buyer.vatNumber ? `<ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${escapeXml(data.buyer.vatNumber)}</ram:ID>
        </ram:SpecifiedTaxRegistration>` : ''}
      </ram:BuyerTradeParty>

      ${data.orderReference ? `<!-- BT-13 Purchase order reference -->
      <ram:BuyerOrderReferencedDocument>
        <ram:IssuerAssignedID>${escapeXml(data.orderReference)}</ram:IssuerAssignedID>
      </ram:BuyerOrderReferencedDocument>` : ''}

    </ram:ApplicableHeaderTradeAgreement>

    <!-- Livraison -->
    <ram:ApplicableHeaderTradeDelivery/>

    <!-- Règlement -->
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${data.currency}</ram:InvoiceCurrencyCode>

      <!-- TVA -->
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${data.totalVAT.toFixed(2)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${data.totalHT.toFixed(2)}</ram:BasisAmount>
        <ram:CategoryCode>S</ram:CategoryCode>
        <ram:RateApplicablePercent>${data.vatRate.toFixed(2)}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>

      <!-- Totaux -->
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${data.totalHT.toFixed(2)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${data.totalHT.toFixed(2)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${data.currency}">${data.totalVAT.toFixed(2)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${data.totalTTC.toFixed(2)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${data.totalTTC.toFixed(2)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>

    </ram:ApplicableHeaderTradeSettlement>

    <!-- Lignes de facture -->
    ${data.lines.map((line, index) => `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${index + 1}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${escapeXml(line.description)}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${line.unitPrice.toFixed(2)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="C62">${line.quantity}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>S</ram:CategoryCode>
          <ram:RateApplicablePercent>${line.vatRate.toFixed(2)}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${line.totalHT.toFixed(2)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`).join('\n')}

  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`

  return xml
}

/**
 * Génère le XML FacturaE pour l'Espagne
 * Version 3.2.2 conforme au format espagnol
 */
export function generateFacturaEXML(data: EInvoiceData): string {
  const isCredit = data.type === 'avoir'
  const invoiceClass = isCredit ? 'RC' : 'OO' // RC = Rectificativa, OO = Original
  const invoiceType = isCredit ? 'R1' : 'F1' // R1 = Rectificativa, F1 = Factura

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<fe:Facturae xmlns:fe="http://www.facturae.gob.es/formato/Versiones/Facturaev3_2_2.xml"
    xmlns:ds="http://www.w3.org/2000/09/xmldsig#">

  <FileHeader>
    <SchemaVersion>3.2.2</SchemaVersion>
    <Modality>I</Modality>
    <InvoiceIssuerType>EM</InvoiceIssuerType>
    <Batch>
      <BatchIdentifier>${escapeXml(data.invoiceNumber)}</BatchIdentifier>
      <InvoicesCount>1</InvoicesCount>
      <TotalInvoicesAmount>
        <TotalAmount>${data.totalTTC.toFixed(2)}</TotalAmount>
      </TotalInvoicesAmount>
      <TotalOutstandingAmount>
        <TotalAmount>${data.totalTTC.toFixed(2)}</TotalAmount>
      </TotalOutstandingAmount>
      <TotalExecutableAmount>
        <TotalAmount>${data.totalTTC.toFixed(2)}</TotalAmount>
      </TotalExecutableAmount>
      <InvoiceCurrencyCode>${data.currency}</InvoiceCurrencyCode>
    </Batch>
  </FileHeader>

  <Parties>
    <!-- Vendeur -->
    <SellerParty>
      <TaxIdentification>
        <PersonTypeCode>J</PersonTypeCode>
        <ResidenceTypeCode>R</ResidenceTypeCode>
        <TaxIdentificationNumber>${escapeXml(data.seller.vatNumber)}</TaxIdentificationNumber>
      </TaxIdentification>
      <LegalEntity>
        <CorporateName>${escapeXml(data.seller.name)}</CorporateName>
        <AddressInSpain>
          <Address>${escapeXml(data.seller.address)}</Address>
          <PostCode>${escapeXml(data.seller.zipCode)}</PostCode>
          <Town>${escapeXml(data.seller.city)}</Town>
          <Province>${escapeXml(data.seller.city)}</Province>
          <CountryCode>${data.seller.country}</CountryCode>
        </AddressInSpain>
      </LegalEntity>
    </SellerParty>

    <!-- Acheteur -->
    <BuyerParty>
      <TaxIdentification>
        <PersonTypeCode>F</PersonTypeCode>
        <ResidenceTypeCode>${data.buyer.country === 'ES' ? 'R' : 'U'}</ResidenceTypeCode>
        <TaxIdentificationNumber>${escapeXml(data.buyer.vatNumber || '00000000T')}</TaxIdentificationNumber>
      </TaxIdentification>
      ${data.buyer.vatNumber ? `<LegalEntity>
        <CorporateName>${escapeXml(data.buyer.name)}</CorporateName>
        ${data.buyer.address ? `<AddressInSpain>
          <Address>${escapeXml(data.buyer.address)}</Address>
          ${data.buyer.zipCode ? `<PostCode>${escapeXml(data.buyer.zipCode)}</PostCode>` : '<PostCode>00000</PostCode>'}
          ${data.buyer.city ? `<Town>${escapeXml(data.buyer.city)}</Town>` : '<Town>-</Town>'}
          ${data.buyer.city ? `<Province>${escapeXml(data.buyer.city)}</Province>` : '<Province>-</Province>'}
          <CountryCode>${data.buyer.country || 'ES'}</CountryCode>
        </AddressInSpain>` : ''}
      </LegalEntity>` : `<Individual>
        <Name>${escapeXml(data.buyer.name.split(' ')[0] || data.buyer.name)}</Name>
        <FirstSurname>${escapeXml(data.buyer.name.split(' ').slice(1).join(' ') || '-')}</FirstSurname>
        ${data.buyer.address ? `<AddressInSpain>
          <Address>${escapeXml(data.buyer.address)}</Address>
          ${data.buyer.zipCode ? `<PostCode>${escapeXml(data.buyer.zipCode)}</PostCode>` : '<PostCode>00000</PostCode>'}
          ${data.buyer.city ? `<Town>${escapeXml(data.buyer.city)}</Town>` : '<Town>-</Town>'}
          ${data.buyer.city ? `<Province>${escapeXml(data.buyer.city)}</Province>` : '<Province>-</Province>'}
          <CountryCode>${data.buyer.country || 'ES'}</CountryCode>
        </AddressInSpain>` : ''}
      </Individual>`}
    </BuyerParty>
  </Parties>

  <Invoices>
    <Invoice>
      <InvoiceHeader>
        <InvoiceNumber>${escapeXml(data.invoiceNumber)}</InvoiceNumber>
        <InvoiceDocumentType>FC</InvoiceDocumentType>
        <InvoiceClass>${invoiceClass}</InvoiceClass>
      </InvoiceHeader>

      <InvoiceIssueData>
        <IssueDate>${data.invoiceDate}</IssueDate>
        <InvoiceCurrencyCode>${data.currency}</InvoiceCurrencyCode>
        <TaxCurrencyCode>${data.currency}</TaxCurrencyCode>
        <LanguageName>es</LanguageName>
      </InvoiceIssueData>

      <TaxesOutputs>
        <Tax>
          <TaxTypeCode>01</TaxTypeCode>
          <TaxRate>${data.vatRate.toFixed(2)}</TaxRate>
          <TaxableBase>
            <TotalAmount>${data.totalHT.toFixed(2)}</TotalAmount>
          </TaxableBase>
          <TaxAmount>
            <TotalAmount>${data.totalVAT.toFixed(2)}</TotalAmount>
          </TaxAmount>
        </Tax>
      </TaxesOutputs>

      <InvoiceTotals>
        <TotalGrossAmount>${data.totalHT.toFixed(2)}</TotalGrossAmount>
        <TotalGrossAmountBeforeTaxes>${data.totalHT.toFixed(2)}</TotalGrossAmountBeforeTaxes>
        <TotalTaxOutputs>${data.totalVAT.toFixed(2)}</TotalTaxOutputs>
        <TotalTaxesWithheld>0.00</TotalTaxesWithheld>
        <InvoiceTotal>${data.totalTTC.toFixed(2)}</InvoiceTotal>
        <TotalOutstandingAmount>${data.totalTTC.toFixed(2)}</TotalOutstandingAmount>
        <TotalExecutableAmount>${data.totalTTC.toFixed(2)}</TotalExecutableAmount>
      </InvoiceTotals>

      <Items>
        ${data.lines.map((line, index) => `
        <InvoiceLine>
          <ItemDescription>${escapeXml(line.description)}</ItemDescription>
          <Quantity>${line.quantity.toFixed(2)}</Quantity>
          <UnitOfMeasure>01</UnitOfMeasure>
          <UnitPriceWithoutTax>${line.unitPrice.toFixed(6)}</UnitPriceWithoutTax>
          <TotalCost>${line.totalHT.toFixed(2)}</TotalCost>
          <GrossAmount>${line.totalHT.toFixed(2)}</GrossAmount>
          <TaxesOutputs>
            <Tax>
              <TaxTypeCode>01</TaxTypeCode>
              <TaxRate>${line.vatRate.toFixed(2)}</TaxRate>
              <TaxableBase>
                <TotalAmount>${line.totalHT.toFixed(2)}</TotalAmount>
              </TaxableBase>
              <TaxAmount>
                <TotalAmount>${(line.totalTTC - line.totalHT).toFixed(2)}</TotalAmount>
              </TaxAmount>
            </Tax>
          </TaxesOutputs>
        </InvoiceLine>`).join('\n')}
      </Items>

      ${(data.dossierReference || data.buyer.dir3Code || data.orderReference) ? `<AdditionalData>
        <InvoiceAdditionalInformation>${[
          data.dossierReference ? `Dossier: ${escapeXml(data.dossierReference)}` : '',
          data.buyer.dir3Code ? `DIR3: ${escapeXml(data.buyer.dir3Code)}` : '',
          data.orderReference ? `Ref. commande: ${escapeXml(data.orderReference)}` : ''
        ].filter(Boolean).join(' | ')}</InvoiceAdditionalInformation>
      </AdditionalData>` : ''}

    </Invoice>
  </Invoices>

</fe:Facturae>`

  return xml
}

/**
 * Génère le XML selon le pays
 */
export function generateEInvoiceXML(data: EInvoiceData): { xml: string; format: string; filename: string } {
  let xml: string
  let format: string
  let filename: string

  switch (data.countryCode) {
    case 'ES':
      xml = generateFacturaEXML(data)
      format = 'FacturaE'
      filename = `FacturaE_${data.invoiceNumber}.xml`
      break
    case 'FR':
    case 'DE':
    default:
      xml = generateFacturXML(data)
      format = data.countryCode === 'DE' ? 'ZUGFeRD' : 'Factur-X'
      filename = `${format}_${data.invoiceNumber}.xml`
      break
  }

  return { xml, format, filename }
}

/**
 * Télécharge le fichier XML
 */
export function downloadEInvoiceXML(data: EInvoiceData): void {
  const { xml, filename } = generateEInvoiceXML(data)

  const blob = new Blob([xml], { type: 'application/xml' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Convertit les données de facture Busmoov vers le format e-invoice
 */
export function convertToEInvoiceData(
  facture: {
    reference: string
    type: 'acompte' | 'solde' | 'avoir'
    amount_ht: number
    amount_ttc: number
    tva_rate?: number | null
    client_name?: string | null
    client_address?: string | null
    client_zip?: string | null
    client_city?: string | null
    created_at?: string | null
    // Nouveaux champs e-invoice
    client_vat_number?: string | null
    client_leitweg_id?: string | null
    client_dir3_code?: string | null
    client_order_reference?: string | null
    dossier?: {
      reference: string
      departure?: string
      arrival?: string
      departure_date?: string
      passengers?: number
      // Champs e-invoice depuis dossier si pas sur facture
      client_vat_number?: string | null
      client_leitweg_id?: string | null
      client_dir3_code?: string | null
      client_order_reference?: string | null
    } | null
  },
  companyInfo: {
    legalName: string
    address: string
    zipCity: string
    siret: string
    tvaIntracom: string
    email: string
    phone: string
  },
  countryCode: 'FR' | 'DE' | 'ES' | 'GB' = 'FR'
): EInvoiceData {
  const vatRate = facture.tva_rate || 10
  const vatAmount = facture.amount_ttc - facture.amount_ht

  // Extraire code postal et ville
  const zipCityParts = companyInfo.zipCity.split(' ')
  const zipCode = zipCityParts[0] || ''
  const city = zipCityParts.slice(1).join(' ') || companyInfo.zipCity

  // Description de la ligne principale
  const typeLabel = facture.type === 'acompte' ? 'Acompte' : facture.type === 'solde' ? 'Solde' : 'Avoir'
  let description = `${typeLabel} - Transport`
  if (facture.dossier) {
    description += ` ${facture.dossier.departure || ''} → ${facture.dossier.arrival || ''}`
    if (facture.dossier.departure_date) {
      description += ` (${facture.dossier.departure_date.split('T')[0]})`
    }
  }

  return {
    invoiceNumber: facture.reference,
    invoiceDate: facture.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    type: facture.type,

    seller: {
      name: companyInfo.legalName,
      address: companyInfo.address,
      zipCode: zipCode,
      city: city,
      country: countryCode,
      vatNumber: companyInfo.tvaIntracom,
      siret: companyInfo.siret,
      email: companyInfo.email,
      phone: companyInfo.phone,
    },

    buyer: {
      name: facture.client_name || 'Client',
      address: facture.client_address || undefined,
      zipCode: facture.client_zip || undefined,
      city: facture.client_city || undefined,
      country: countryCode,
      vatNumber: facture.client_vat_number || facture.dossier?.client_vat_number || undefined,
      leitwegId: facture.client_leitweg_id || facture.dossier?.client_leitweg_id || undefined,
      dir3Code: facture.client_dir3_code || facture.dossier?.client_dir3_code || undefined,
    },

    orderReference: facture.client_order_reference || facture.dossier?.client_order_reference || undefined,

    lines: [{
      description,
      quantity: 1,
      unitPrice: facture.amount_ht,
      vatRate: vatRate,
      totalHT: facture.amount_ht,
      totalTTC: facture.amount_ttc,
    }],

    totalHT: facture.amount_ht,
    totalVAT: vatAmount,
    totalTTC: facture.amount_ttc,
    vatRate: vatRate,

    dossierReference: facture.dossier?.reference,
    currency: countryCode === 'GB' ? 'GBP' : 'EUR',
    countryCode,
  }
}

// Utilitaire pour échapper les caractères XML
function escapeXml(str: string): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
