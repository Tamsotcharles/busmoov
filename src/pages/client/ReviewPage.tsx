import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Star, Send, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface ReviewData {
  id: string
  token: string
  rating: number | null
  comment: string | null
  client_name: string | null
  status: string
  dossier_id: string
  dossier: {
    reference: string
    departure: string
    arrival: string
    departure_date: string
    client_name: string
  } | null
}

export function ReviewPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [review, setReview] = useState<ReviewData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [clientName, setClientName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Lien invalide. Veuillez utiliser le lien reçu par email.')
      setLoading(false)
      return
    }

    loadReview()
  }, [token])

  const loadReview = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('reviews')
        .select(`
          id,
          token,
          rating,
          comment,
          client_name,
          status,
          dossier_id,
          dossier:dossiers(reference, departure, arrival, departure_date, client_name)
        `)
        .eq('token', token as string)
        .single()

      if (fetchError || !data) {
        setError('Avis introuvable. Le lien est peut-être expiré ou invalide.')
        return
      }

      const reviewData = data as unknown as ReviewData
      if (reviewData.status !== 'pending') {
        setSubmitted(true)
        setRating(reviewData.rating || 0)
        setComment(reviewData.comment || '')
      }

      setReview(reviewData)
      setClientName(reviewData.dossier?.client_name || '')
    } catch (err) {
      console.error('Error loading review:', err)
      setError('Une erreur est survenue lors du chargement.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      setError('Veuillez sélectionner une note.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('reviews')
        .update({
          rating,
          comment: comment.trim() || null,
          client_name: clientName.trim() || review?.dossier?.client_name || 'Client anonyme',
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('token', token as string)
        .eq('status', 'pending')

      if (updateError) {
        throw updateError
      }

      // Ajouter à la timeline
      if (review?.dossier_id) {
        await supabase.from('timeline').insert({
          dossier_id: review.dossier_id,
          type: 'review_received',
          content: `⭐ Avis client reçu : ${rating}/5${comment ? ` - "${comment.substring(0, 80)}${comment.length > 80 ? '...' : ''}"` : ''}`,
        })
      }

      setSubmitted(true)
    } catch (err) {
      console.error('Error submitting review:', err)
      setError('Une erreur est survenue lors de l\'envoi. Veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showAdminLink={false} />
        <main className="pt-24 pb-16">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error && !review) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showAdminLink={false} />
        <main className="pt-24 pb-16">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Lien invalide</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link to="/" className="btn btn-primary">
                Retour à l'accueil
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showAdminLink={false} />
        <main className="pt-24 pb-16">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-emerald-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Merci pour votre avis !
              </h1>
              <p className="text-gray-600 mb-6">
                Votre retour est précieux et nous aide à améliorer nos services.
                {rating >= 4 && (
                  <> Nous sommes ravis que votre expérience vous ait satisfait !</>
                )}
              </p>

              {rating > 0 && (
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <div className="flex justify-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={32}
                        className={cn(
                          star <= rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        )}
                      />
                    ))}
                  </div>
                  {comment && (
                    <p className="text-gray-600 italic">"{comment}"</p>
                  )}
                </div>
              )}

              <Link to="/" className="btn btn-primary">
                Retour à l'accueil
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showAdminLink={false} />

      <main className="pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-magenta mb-6 transition-colors"
          >
            <ArrowLeft size={18} />
            Retour à l'accueil
          </Link>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple to-magenta px-8 py-6 text-white">
              <h1 className="text-2xl font-bold mb-2">Donnez votre avis</h1>
              <p className="text-white/80">
                Votre retour nous aide à améliorer nos services
              </p>
            </div>

            {/* Voyage info */}
            {review?.dossier && (
              <div className="bg-gray-50 px-8 py-4 border-b border-gray-100">
                <p className="text-sm text-gray-500">Votre voyage</p>
                <p className="font-medium text-gray-900">
                  {review.dossier.departure} → {review.dossier.arrival}
                </p>
                <p className="text-sm text-gray-600">
                  {formatDate(review.dossier.departure_date)} • Réf. {review.dossier.reference}
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Rating */}
              <div>
                <label className="label mb-3">
                  Comment évaluez-vous votre expérience ? *
                </label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        size={40}
                        className={cn(
                          'transition-colors',
                          star <= (hoverRating || rating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        )}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm text-gray-500 mt-2">
                  {rating === 0 && 'Cliquez sur les étoiles pour noter'}
                  {rating === 1 && 'Très insatisfait'}
                  {rating === 2 && 'Insatisfait'}
                  {rating === 3 && 'Correct'}
                  {rating === 4 && 'Satisfait'}
                  {rating === 5 && 'Très satisfait'}
                </p>
              </div>

              {/* Comment */}
              <div>
                <label className="label">
                  Partagez votre expérience (optionnel)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="input"
                  placeholder="Qu'avez-vous apprécié ? Que pourrions-nous améliorer ?"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Votre commentaire pourra être publié sur notre site (de façon anonyme si vous le souhaitez)
                </p>
              </div>

              {/* Name */}
              <div>
                <label className="label">
                  Votre nom (pour le témoignage)
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="input"
                  placeholder={review?.dossier?.client_name || 'Votre nom'}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Laissez vide pour rester anonyme
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || rating === 0}
                className="btn btn-primary w-full btn-lg"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Envoyer mon avis
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
