import { isTransporteurFictif } from '@/lib/utils'

type TransporteurOption = {
  id: string
  number?: string | null
  name?: string | null
  city?: string | null
  tags?: string[] | null
}

/**
 * Options d'un <select> transporteur : les transporteurs fictifs (tag
 * `fictif`) sont regroupés en tête. Ils servent à envoyer un devis au client
 * avant d'avoir trouvé le fournisseur réel ; le client ne voit que leur
 * numéro TR, jamais leur nom.
 */
export function TransporteurOptions({
  transporteurs,
  withCity = false,
}: {
  transporteurs: TransporteurOption[]
  withCity?: boolean
}) {
  const fictifs = transporteurs.filter(isTransporteurFictif)
  const reels = transporteurs.filter((t) => !isTransporteurFictif(t))
  const label = (t: TransporteurOption) =>
    `${t.number} - ${t.name}${withCity && t.city ? ` (${t.city})` : ''}`

  return (
    <>
      {fictifs.length > 0 && (
        <optgroup label="🎭 Fictifs — devis sans fournisseur (à trouver ensuite)">
          {fictifs.map((t) => (
            <option key={t.id} value={t.id}>{label(t)} [fictif]</option>
          ))}
        </optgroup>
      )}
      <optgroup label="Transporteurs">
        {reels.map((t) => (
          <option key={t.id} value={t.id}>{label(t)}</option>
        ))}
      </optgroup>
    </>
  )
}
