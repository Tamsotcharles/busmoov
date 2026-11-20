/**
 * URL publique du site pour les liens envoyés aux clients et transporteurs.
 *
 * Le secret APP_URL a longtemps valu https://busmoov.fr : ce domaine est une
 * page OVH « Site en construction » sans HTTPS. Tout lien construit dessus
 * (infos voyage, paiement, espace client, retour Mollie) était mort. On
 * n'accepte donc qu'une URL busmoov.com ; tout le reste retombe sur www.busmoov.com.
 */
export function getSiteUrl(): string {
  const raw = (Deno.env.get('PUBLIC_SITE_URL') || Deno.env.get('APP_URL') || '').trim().replace(/\/+$/, '')
  if (!raw || !/^https:\/\/(www\.)?busmoov\.com$/i.test(raw)) return 'https://www.busmoov.com'
  return raw
}
