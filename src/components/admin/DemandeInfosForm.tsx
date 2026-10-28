import { useState } from 'react'
import { Save, X } from 'lucide-react'
import { useUpdateDossier, useAddTimelineEntry } from '@/hooks/useSupabase'
import type { DossierWithRelations } from '@/types/database'

/**
 * Édition en place du bloc « Informations complètes de la demande » du
 * dossier : mode de trajet, type de voyage, véhicule, bagages, options,
 * aller / retour (dates, heures, adresses, passagers), demandes spéciales.
 * Écrit dans `dossiers` (source du bloc et de l'auto-devis) ; les champs
 * vides partent en NULL (PostgREST refuse '' sur les dates).
 */

const TRIP_MODES = [
  { value: 'round-trip', label: 'Aller-Retour' },
  { value: 'one-way', label: 'Aller simple' },
  { value: 'circuit', label: 'Circuit / mise à disposition' },
]
const VOYAGE_TYPES = [
  { value: 'scolaire', label: 'Sortie scolaire' },
  { value: 'entreprise', label: 'Séminaire entreprise' },
  { value: 'mariage', label: 'Mariage / Événement' },
  { value: 'sportif', label: 'Déplacement sportif' },
  { value: 'touristique', label: 'Voyage touristique' },
  { value: 'autre', label: 'Autre' },
]
const VEHICLE_TYPES = [
  { value: 'minibus', label: 'Minibus (8-20 places)' },
  { value: 'standard', label: 'Autocar standard (21-59 places)' },
  { value: 'autocar-gt', label: 'Autocar Grand Tourisme' },
  { value: 'double_decker', label: 'Autocar à étage' },
  { value: 'midibus', label: 'Midibus' },
]
const LUGGAGE_TYPES = [
  { value: 'aucun', label: 'Aucun bagage' },
  { value: 'leger', label: 'Léger (sacs à main, petits sacs)' },
  { value: 'moyen', label: 'Moyen (valises cabine, sacs de sport)' },
  { value: 'volumineux', label: 'Volumineux (grosses valises, équipements)' },
]

const dateOnly = (v: string | null | undefined) => (v ? v.slice(0, 10) : '')
const timeOnly = (v: string | null | undefined) => (v ? v.slice(0, 5) : '')

interface Props {
  dossier: DossierWithRelations
  onCancel: () => void
  onSaved: () => void
}

export function DemandeInfosForm({ dossier, onCancel, onSaved }: Props) {
  const updateDossier = useUpdateDossier()
  const addTimelineEntry = useAddTimelineEntry()
  const [form, setForm] = useState({
    trip_mode: dossier.trip_mode || 'round-trip',
    voyage_type: dossier.voyage_type || '',
    vehicle_type: dossier.vehicle_type || '',
    luggage_type: dossier.luggage_type || '',
    accessibility: !!dossier.accessibility,
    wifi: !!dossier.wifi,
    wc: !!dossier.wc,
    departure_day: dateOnly(dossier.departure_date),
    departure_time: timeOnly(dossier.departure_time),
    departure_address: dossier.departure_address || dossier.departure || '',
    arrival_address: dossier.arrival_address || dossier.arrival || '',
    passengers: dossier.passengers || 1,
    return_day: dateOnly(dossier.return_date),
    return_time: timeOnly(dossier.return_time),
    return_departure_address: dossier.return_departure_address || '',
    return_arrival_address: dossier.return_arrival_address || '',
    special_requests: dossier.special_requests || '',
  })
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }))
  const hasReturn = form.trip_mode !== 'one-way'

  const handleSave = async () => {
    if (!form.departure_day) {
      alert('La date de départ est obligatoire.')
      return
    }
    try {
      await updateDossier.mutateAsync({
        id: dossier.id,
        trip_mode: form.trip_mode,
        voyage_type: form.voyage_type || null,
        vehicle_type: form.vehicle_type || null,
        luggage_type: form.luggage_type || null,
        accessibility: form.accessibility,
        wifi: form.wifi,
        wc: form.wc,
        departure_date: `${form.departure_day}T${form.departure_time || '00:00'}:00`,
        departure_time: form.departure_time || null,
        departure_address: form.departure_address || null,
        arrival_address: form.arrival_address || null,
        passengers: Number(form.passengers) || 1,
        return_date: hasReturn && form.return_day ? `${form.return_day}T${form.return_time || '00:00'}:00` : null,
        return_time: hasReturn ? form.return_time || null : null,
        return_departure_address: hasReturn ? form.return_departure_address || null : null,
        return_arrival_address: hasReturn ? form.return_arrival_address || null : null,
        special_requests: form.special_requests || null,
      })
      await addTimelineEntry.mutateAsync({
        dossier_id: dossier.id,
        type: 'note',
        content: '✏️ Informations de la demande modifiées par l\'équipe',
      })
      onSaved()
    } catch (error) {
      const message = error instanceof Error ? error.message : (error as { message?: string })?.message || 'Erreur inconnue'
      alert(`Impossible d'enregistrer la demande : ${message}`)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-4 gap-4">
        <div>
          <label className="label">Mode de trajet</label>
          <select className="input" value={form.trip_mode} onChange={(e) => set({ trip_mode: e.target.value })}>
            {TRIP_MODES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Type de voyage</label>
          <select className="input" value={form.voyage_type} onChange={(e) => set({ voyage_type: e.target.value })}>
            <option value="">Non précisé</option>
            {VOYAGE_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Type de véhicule</label>
          <select className="input" value={form.vehicle_type} onChange={(e) => set({ vehicle_type: e.target.value })}>
            <option value="">Non précisé</option>
            {VEHICLE_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Bagages</label>
          <select className="input" value={form.luggage_type} onChange={(e) => set({ luggage_type: e.target.value })}>
            <option value="">Non précisé</option>
            {LUGGAGE_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-6 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.accessibility} onChange={(e) => set({ accessibility: e.target.checked })} /> Accessibilité PMR</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.wifi} onChange={(e) => set({ wifi: e.target.checked })} /> Wi-Fi</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.wc} onChange={(e) => set({ wc: e.target.checked })} /> WC à bord</label>
      </div>

      <div className={`grid gap-4 ${hasReturn ? 'md:grid-cols-2' : ''}`}>
        <div className="bg-white rounded-lg p-4 border border-green-200 space-y-3">
          <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">ALLER</span>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Date</label><input type="date" className="input" value={form.departure_day} onChange={(e) => set({ departure_day: e.target.value })} /></div>
            <div><label className="label">Heure</label><input type="time" className="input" value={form.departure_time} onChange={(e) => set({ departure_time: e.target.value })} /></div>
          </div>
          <div><label className="label">Adresse de départ</label><input className="input" value={form.departure_address} onChange={(e) => set({ departure_address: e.target.value })} /></div>
          <div><label className="label">Adresse d'arrivée</label><input className="input" value={form.arrival_address} onChange={(e) => set({ arrival_address: e.target.value })} /></div>
          <div><label className="label">Passagers</label><input type="number" min={1} className="input" value={form.passengers} onChange={(e) => set({ passengers: Number(e.target.value) })} /></div>
        </div>
        {hasReturn && (
          <div className="bg-white rounded-lg p-4 border border-orange-200 space-y-3">
            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">RETOUR</span>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Date</label><input type="date" className="input" value={form.return_day} onChange={(e) => set({ return_day: e.target.value })} /></div>
              <div><label className="label">Heure</label><input type="time" className="input" value={form.return_time} onChange={(e) => set({ return_time: e.target.value })} /></div>
            </div>
            <div><label className="label">Adresse de départ</label><input className="input" placeholder="Par défaut : adresse d'arrivée de l'aller" value={form.return_departure_address} onChange={(e) => set({ return_departure_address: e.target.value })} /></div>
            <div><label className="label">Adresse d'arrivée</label><input className="input" placeholder="Par défaut : adresse de départ de l'aller" value={form.return_arrival_address} onChange={(e) => set({ return_arrival_address: e.target.value })} /></div>
          </div>
        )}
      </div>

      <div>
        <label className="label">Demandes spéciales / informations complémentaires</label>
        <textarea className="input" rows={4} value={form.special_requests} onChange={(e) => set({ special_requests: e.target.value })} />
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn btn-secondary flex items-center gap-1"><X size={14} /> Annuler</button>
        <button type="button" onClick={handleSave} disabled={updateDossier.isPending} className="btn btn-success flex items-center gap-1">
          <Save size={14} /> {updateDossier.isPending ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}
