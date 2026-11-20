import { Check, Circle, AlertTriangle, ListChecks } from 'lucide-react'
import { cn, formatDate, formatPrice } from '@/lib/utils'

/* Types structurels minimaux : le composant ne dépend que des champs qu'il lit. */
interface DossierLike {
  id: string
  status?: string | null
  created_at?: string | null
  contract_signed_at?: string | null
  price_ttc?: number | null
  departure_date?: string | null
  return_date?: string | null
  chauffeur_name?: string | null
}
interface DevisLike { status?: string | null; sent_at?: string | null; created_at?: string | null }
interface ContratLike { signed_at?: string | null; price_ttc?: number | null; acompte_amount?: number | null }
interface PaiementLike { amount?: number | null; payment_date?: string | null; type?: string | null }
interface FactureLike { type?: string | null; status?: string | null; amount_ttc?: number | null }
interface VoyageInfoLike {
  aller_adresse_depart?: string | null
  validated_at?: string | null
  admin_validated_at?: string | null
  updated_at?: string | null
  created_at?: string | null
  chauffeur_aller_nom?: string | null
  chauffeur_info_recue_at?: string | null
  demande_chauffeur_envoyee_at?: string | null
  feuille_route_envoyee_at?: string | null
}
interface DemandeFournisseurLike { status?: string | null; bpa_received_at?: string | null; sent_at?: string | null; created_at?: string | null }
interface DemandeChauffeurLike { status?: string | null; sent_at?: string | null; created_at?: string | null; received_at?: string | null }
interface TimelineLike { type?: string | null; created_at?: string | null }

interface Props {
  dossier: DossierLike
  devis: DevisLike[]
  contrat: ContratLike | null | undefined
  paiements: PaiementLike[]
  factures: FactureLike[]
  voyageInfo: VoyageInfoLike | null | undefined
  demandesFournisseurs: DemandeFournisseurLike[]
  demandesChauffeur: DemandeChauffeurLike[]
  timeline: TimelineLike[]
}

type StepState = 'done' | 'current' | 'todo'

interface Step {
  key: string
  label: string
  state: StepState
  /** Date de réalisation (si faite) ou d'avancement partiel. */
  date?: string | null
  /** Précision affichée sous le libellé. */
  detail?: string
  /** Ce qu'il reste à faire quand c'est l'étape en cours. */
  hint?: string
  /** Avancement partiel (ex. BPA envoyé mais pas confirmé). */
  partial?: boolean
}

const firstDate = (...dates: (string | null | undefined)[]) =>
  dates.filter((d): d is string => !!d).sort()[0] ?? null
const lastDate = (...dates: (string | null | undefined)[]) =>
  dates.filter((d): d is string => !!d).sort().slice(-1)[0] ?? null

/** Construit la check-list d'avancement d'un dossier à partir des données, sans aucune saisie manuelle. */
function buildPipelineSteps(p: Props): Step[] {
  const { dossier, devis, contrat, paiements, voyageInfo, demandesFournisseurs, demandesChauffeur, timeline } = p
  const total = dossier.price_ttc || contrat?.price_ttc || 0
  const paid = paiements.reduce((s, x) => s + (x.amount || 0), 0)
  const acompte = contrat?.acompte_amount ?? 0
  const paiementTotal = acompte > 0 && acompte >= total - 0.01
  const tl = (type: string) => timeline.find((t) => t.type === type)?.created_at ?? null

  const steps: (Omit<Step, 'state'> & { done: boolean })[] = []
  const push = (s: Omit<Step, 'state'> & { done: boolean }) => steps.push(s)

  push({ key: 'demande', label: 'Demande reçue', done: true, date: dossier.created_at })

  const devisEnvoyes = devis.filter((d) => d.status && d.status !== 'draft')
  push({
    key: 'devis',
    label: 'Devis envoyés',
    done: devisEnvoyes.length > 0,
    date: firstDate(...devisEnvoyes.map((d) => d.sent_at || d.created_at)),
    detail: devisEnvoyes.length > 0 ? `${devisEnvoyes.length} devis` : undefined,
    hint: 'Envoyer au moins un devis au client.',
  })

  const signedAt = contrat?.signed_at || dossier.contract_signed_at
  push({
    key: 'contrat',
    label: 'Contrat signé',
    done: !!signedAt,
    date: signedAt,
    detail: signedAt && total ? formatPrice(total) : undefined,
    hint: 'En attente de la signature du client (relance devis possible).',
  })

  const lastPaymentDate = lastDate(...paiements.map((x) => x.payment_date))
  if (paiementTotal || !acompte) {
    push({
      key: 'paiement',
      label: 'Paiement encaissé',
      done: total > 0 && paid >= total - 0.01,
      date: lastPaymentDate,
      detail: total ? `${formatPrice(paid)} / ${formatPrice(total)}` : undefined,
      partial: paid > 0 && paid < total - 0.01,
      hint: 'Le client doit régler la totalité (départ proche).',
    })
  } else {
    push({
      key: 'acompte',
      label: 'Acompte encaissé',
      done: paid >= acompte - 0.01,
      date: lastPaymentDate,
      detail: `${formatPrice(Math.min(paid, acompte))} / ${formatPrice(acompte)}`,
      hint: `Relancer l'acompte de ${formatPrice(acompte)}.`,
    })
  }

  const bpa = demandesFournisseurs.find((df) => df.bpa_received_at || df.status === 'bpa_received')
  const validated = demandesFournisseurs.find((df) => df.status === 'validated')
  push({
    key: 'bpa',
    label: 'Transporteur confirmé',
    done: !!bpa,
    date: bpa?.bpa_received_at || bpa?.created_at || validated?.sent_at || validated?.created_at,
    detail: bpa ? 'BPA reçu' : validated ? 'BPA envoyé, en attente' : undefined,
    partial: !bpa && !!validated,
    hint: validated ? 'Attendre la confirmation du transporteur (BPA).' : 'Valider un fournisseur et lui envoyer le BPA.',
  })

  const hasInfos = !!voyageInfo?.aller_adresse_depart
  const infosValidees = !!(voyageInfo?.validated_at || voyageInfo?.admin_validated_at)
  push({
    key: 'infos',
    label: 'Infos voyage validées',
    done: hasInfos && infosValidees,
    date: voyageInfo?.validated_at || voyageInfo?.admin_validated_at || tl('infos_voyage_submitted') || voyageInfo?.updated_at,
    detail: hasInfos && !infosValidees ? 'Reçues du client, à valider' : hasInfos ? 'Validées' : undefined,
    partial: hasInfos && !infosValidees,
    hint: hasInfos ? 'Vérifier et valider les informations voyage du client.' : 'Le client doit renseigner ses informations voyage.',
  })

  const chauffeurRecu = !!(voyageInfo?.chauffeur_info_recue_at || voyageInfo?.chauffeur_aller_nom || dossier.chauffeur_name)
  const demandeChauffeur = demandesChauffeur.find((dc) => dc.status === 'pending' || dc.status === 'sent')
  push({
    key: 'chauffeur',
    label: 'Infos chauffeur reçues',
    done: chauffeurRecu,
    date: voyageInfo?.chauffeur_info_recue_at || tl('chauffeur_info_received') || tl('chauffeur_info') || demandeChauffeur?.sent_at || voyageInfo?.demande_chauffeur_envoyee_at,
    detail: !chauffeurRecu && (demandeChauffeur || voyageInfo?.demande_chauffeur_envoyee_at) ? 'Demandées au transporteur' : undefined,
    partial: !chauffeurRecu && !!(demandeChauffeur || voyageInfo?.demande_chauffeur_envoyee_at),
    hint: demandeChauffeur ? 'Attendre la réponse du transporteur ou saisir les infos à la main.' : 'Demander les coordonnées du chauffeur au transporteur.',
  })

  const feuilleRoute = voyageInfo?.feuille_route_envoyee_at || tl('feuille_route_sent') || tl('feuille_route')
  push({
    key: 'feuille',
    label: 'Feuille de route envoyée',
    done: !!feuilleRoute,
    date: feuilleRoute,
    hint: 'Envoyer la feuille de route au client.',
  })

  const endDate = dossier.return_date || dossier.departure_date
  const voyagePasse = !!endDate && new Date(endDate).getTime() < Date.now()
  const termine = dossier.status === 'completed' || (voyagePasse && !!signedAt)
  const avis = tl('review_request')
  push({
    key: 'voyage',
    label: 'Voyage effectué',
    done: termine,
    date: termine ? endDate : null,
    detail: termine ? (avis ? 'Avis demandé' : dossier.status === 'completed' ? 'Dossier clôturé' : 'Date passée') : endDate ? `Départ le ${formatDate(endDate)}` : undefined,
    hint: 'Le voyage n’a pas encore eu lieu.',
  })

  // Première étape non faite = étape en cours (sauf dossier annulé/archivé).
  const closed = dossier.status === 'cancelled' || dossier.status === 'archived'
  let currentFound = false
  return steps.map(({ done, ...s }) => {
    let state: StepState = done ? 'done' : 'todo'
    if (!done && !currentFound && !closed) {
      state = 'current'
      currentFound = true
    }
    return { ...s, state }
  })
}

/** Carte « Avancement du dossier » : check-list à progression automatique, dérivée des données. */
export function DossierPipeline(props: Props) {
  const steps = buildPipelineSteps(props)
  const done = steps.filter((s) => s.state === 'done').length
  const current = steps.find((s) => s.state === 'current')
  const closed = props.dossier.status === 'cancelled' || props.dossier.status === 'archived'

  const total = props.dossier.price_ttc || props.contrat?.price_ttc || 0
  const paid = props.paiements.reduce((s, x) => s + (x.amount || 0), 0)
  const facture = props.factures
    .filter((f) => f.type !== 'avoir' && f.status !== 'cancelled')
    .reduce((s, f) => s + (f.amount_ttc || 0), 0)
  const facturationEnRetard = paid > facture + 0.01

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <h2 className="font-display text-lg font-semibold text-purple-dark flex items-center gap-2">
          <ListChecks size={20} className="text-magenta" />
          Avancement du dossier
        </h2>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span>
            <strong className="text-purple-dark">{done}</strong> / {steps.length} étapes
          </span>
          <div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full gradient-bg transition-all" style={{ width: `${(done / steps.length) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Stepper horizontal (défilement sur petits écrans) */}
      <div className="overflow-x-auto -mx-2 px-2 pb-1">
        <ol className="flex items-start min-w-[56rem]">
          {steps.map((s, i) => {
            const isLast = i === steps.length - 1
            const lineDone = s.state === 'done' && steps[i + 1]?.state === 'done'
            return (
              <li key={s.key} className="relative flex-1 flex flex-col items-center text-center px-1">
                {!isLast && (
                  <div
                    className={cn('absolute top-4 left-1/2 w-full h-0.5', lineDone ? 'bg-emerald-400' : 'bg-gray-200')}
                    aria-hidden
                  />
                )}
                <div
                  className={cn(
                    'relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white',
                    s.state === 'done' && 'bg-emerald-500 border-emerald-500 text-white',
                    s.state === 'current' && !s.partial && 'border-magenta text-magenta ring-4 ring-magenta/15',
                    s.state === 'current' && s.partial && 'border-amber-500 text-amber-600 ring-4 ring-amber-100',
                    s.state === 'todo' && 'border-gray-300 text-gray-300',
                  )}
                  title={s.hint}
                >
                  {s.state === 'done' ? <Check size={16} strokeWidth={3} /> : s.partial ? <AlertTriangle size={14} /> : <Circle size={10} fill="currentColor" />}
                </div>
                <p
                  className={cn(
                    'mt-2 text-xs font-semibold leading-tight',
                    s.state === 'done' && 'text-gray-800',
                    s.state === 'current' && 'text-purple-dark',
                    s.state === 'todo' && 'text-gray-400',
                  )}
                >
                  {s.label}
                </p>
                <p className={cn('text-[11px] leading-tight mt-0.5', s.state === 'todo' ? 'text-gray-300' : 'text-gray-500')}>
                  {s.state === 'done' && s.date ? formatDate(s.date) : s.detail || (s.state === 'current' ? 'En cours' : '—')}
                </p>
                {s.state === 'done' && s.detail && <p className="text-[11px] text-gray-400 leading-tight">{s.detail}</p>}
                {s.state === 'current' && s.date && <p className="text-[11px] text-gray-400 leading-tight">{formatDate(s.date)}</p>}
              </li>
            )
          })}
        </ol>
      </div>

      {/* Prochaine action + facturation */}
      <div className="mt-4 flex flex-col sm:flex-row gap-3 text-sm">
        {closed ? (
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-600">
            Dossier {props.dossier.status === 'cancelled' ? 'annulé' : 'archivé'} : plus d'action attendue.
          </div>
        ) : current ? (
          <div
            className={cn(
              'flex-1 rounded-xl px-4 py-3 border',
              current.partial ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-magenta/5 border-magenta/20 text-purple-dark',
            )}
          >
            <span className="font-semibold">Prochaine étape : {current.label}.</span> {current.hint}
          </div>
        ) : (
          <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-emerald-800 font-medium">
            Toutes les étapes sont faites.
          </div>
        )}
        {total > 0 && (
          <div
            className={cn(
              'sm:w-72 rounded-xl px-4 py-3 border flex items-center gap-2',
              facturationEnRetard ? 'bg-red-50 border-red-200 text-red-800' : 'bg-gray-50 border-gray-200 text-gray-600',
            )}
            title="Factures émises (hors avoirs) comparées aux encaissements"
          >
            {facturationEnRetard && <AlertTriangle size={16} className="flex-shrink-0" />}
            <span>
              <span className="font-semibold">Facturé {formatPrice(facture)}</span> sur {formatPrice(paid)} encaissé
              {facturationEnRetard && ' : facture à émettre'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
