import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Star, Check, X, Eye, EyeOff, Award, MessageSquare, Search, Filter } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'

interface Review {
  id: string
  dossier_id: string
  token: string
  rating: number | null
  comment: string | null
  client_name: string | null
  status: string
  is_public: boolean
  admin_response: string | null
  submitted_at: string | null
  reviewed_at: string | null
  created_at: string
  dossier: {
    reference: string
    departure: string
    arrival: string
    departure_date: string
    client_name: string
    client_email: string
  } | null
}

type FilterStatus = 'all' | 'pending' | 'submitted' | 'approved' | 'rejected' | 'featured'

export function ReviewsPage() {
  const queryClient = useQueryClient()
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('submitted')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [adminResponse, setAdminResponse] = useState('')

  // Charger les avis
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          dossier:dossiers(reference, departure, arrival, departure_date, client_name, client_email)
        `)
        .order('submitted_at', { ascending: false, nullsFirst: false })

      if (error) throw error
      return (data || []) as unknown as Review[]
    },
  })

  // Mutation pour mettre à jour un avis
  const updateReview = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Review>
    }) => {
      const { error } = await supabase
        .from('reviews')
        .update({
          ...updates,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      setSelectedReview(null)
      setAdminResponse('')
    },
  })

  // Filtrer les avis
  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      // Filter by status
      if (filterStatus !== 'all' && review.status !== filterStatus) {
        return false
      }

      // Filter by search
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          review.dossier?.reference?.toLowerCase().includes(query) ||
          review.client_name?.toLowerCase().includes(query) ||
          review.dossier?.client_name?.toLowerCase().includes(query) ||
          review.comment?.toLowerCase().includes(query)
        )
      }

      return true
    })
  }, [reviews, filterStatus, searchQuery])

  // Stats
  const stats = useMemo(() => {
    const submitted = reviews.filter((r) => r.status === 'submitted').length
    const approved = reviews.filter((r) => r.status === 'approved').length
    const featured = reviews.filter((r) => r.status === 'featured').length
    const avgRating =
      reviews.filter((r) => r.rating).reduce((sum, r) => sum + (r.rating || 0), 0) /
      (reviews.filter((r) => r.rating).length || 1)

    return { submitted, approved, featured, avgRating }
  }, [reviews])

  const handleApprove = (review: Review, makeFeatured = false) => {
    updateReview.mutate({
      id: review.id,
      updates: {
        status: makeFeatured ? 'featured' : 'approved',
        is_public: true,
        admin_response: adminResponse || null,
      },
    })
  }

  const handleReject = (review: Review) => {
    updateReview.mutate({
      id: review.id,
      updates: {
        status: 'rejected',
        is_public: false,
        admin_response: adminResponse || null,
      },
    })
  }

  const handleTogglePublic = (review: Review) => {
    updateReview.mutate({
      id: review.id,
      updates: {
        is_public: !review.is_public,
      },
    })
  }

  const handleToggleFeatured = (review: Review) => {
    updateReview.mutate({
      id: review.id,
      updates: {
        status: review.status === 'featured' ? 'approved' : 'featured',
      },
    })
  }

  const renderStars = (rating: number | null) => {
    if (!rating) return null
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={cn(
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            )}
          />
        ))}
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-700',
      submitted: 'bg-blue-100 text-blue-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      featured: 'bg-purple-100 text-purple-700',
    }
    const labels: Record<string, string> = {
      pending: 'En attente',
      submitted: 'À modérer',
      approved: 'Approuvé',
      rejected: 'Rejeté',
      featured: 'Mis en avant',
    }
    return (
      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', styles[status])}>
        {labels[status]}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Avis clients</h1>
        <p className="text-gray-600">
          Gérez les avis clients et sélectionnez ceux à afficher sur le site
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.submitted}</p>
              <p className="text-sm text-gray-500">À modérer</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Check size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
              <p className="text-sm text-gray-500">Approuvés</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Award size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.featured}</p>
              <p className="text-sm text-gray-500">Mis en avant</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star size={20} className="text-yellow-600 fill-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.avgRating.toFixed(1)}
              </p>
              <p className="text-sm text-gray-500">Note moyenne</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Rechercher par référence, nom, commentaire..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className="input"
          >
            <option value="all">Tous les avis</option>
            <option value="submitted">À modérer</option>
            <option value="approved">Approuvés</option>
            <option value="featured">Mis en avant</option>
            <option value="rejected">Rejetés</option>
            <option value="pending">En attente de soumission</option>
          </select>
        </div>
      </div>

      {/* Reviews list */}
      {isLoading ? (
        <div className="bg-white rounded-xl p-8 text-center">
          <div className="animate-pulse text-gray-500">Chargement...</div>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center">
          <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Aucun avis trouvé</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className={cn(
                'bg-white rounded-xl border p-6',
                review.status === 'submitted' && 'border-blue-200 bg-blue-50/30'
              )}
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                {/* Left: Review content */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    {renderStars(review.rating)}
                    {getStatusBadge(review.status)}
                    {review.is_public && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 flex items-center gap-1">
                        <Eye size={12} />
                        Public
                      </span>
                    )}
                  </div>

                  {review.comment && (
                    <p className="text-gray-700 italic">"{review.comment}"</p>
                  )}

                  <div className="text-sm text-gray-500 space-y-1">
                    <p>
                      <span className="font-medium text-gray-700">
                        {review.client_name || review.dossier?.client_name || 'Anonyme'}
                      </span>
                      {review.dossier && (
                        <>
                          {' '}• {review.dossier.departure} → {review.dossier.arrival}
                        </>
                      )}
                    </p>
                    <p>
                      Réf. {review.dossier?.reference}
                      {review.submitted_at && (
                        <> • Soumis le {formatDate(review.submitted_at)}</>
                      )}
                    </p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap gap-2 lg:flex-col">
                  {review.status === 'submitted' && (
                    <>
                      <button
                        onClick={() => handleApprove(review)}
                        className="btn btn-sm bg-green-100 text-green-700 hover:bg-green-200"
                      >
                        <Check size={16} />
                        Approuver
                      </button>
                      <button
                        onClick={() => handleApprove(review, true)}
                        className="btn btn-sm bg-purple-100 text-purple-700 hover:bg-purple-200"
                      >
                        <Award size={16} />
                        Mettre en avant
                      </button>
                      <button
                        onClick={() => setSelectedReview(review)}
                        className="btn btn-sm bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        <X size={16} />
                        Rejeter
                      </button>
                    </>
                  )}

                  {(review.status === 'approved' || review.status === 'featured') && (
                    <>
                      <button
                        onClick={() => handleToggleFeatured(review)}
                        className={cn(
                          'btn btn-sm',
                          review.status === 'featured'
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        )}
                      >
                        <Award size={16} />
                        {review.status === 'featured' ? 'Retirer mise en avant' : 'Mettre en avant'}
                      </button>
                      <button
                        onClick={() => handleTogglePublic(review)}
                        className="btn btn-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        {review.is_public ? <EyeOff size={16} /> : <Eye size={16} />}
                        {review.is_public ? 'Masquer' : 'Publier'}
                      </button>
                    </>
                  )}

                  {review.status === 'rejected' && (
                    <button
                      onClick={() => handleApprove(review)}
                      className="btn btn-sm bg-green-100 text-green-700 hover:bg-green-200"
                    >
                      <Check size={16} />
                      Réapprouver
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de rejet */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Rejeter cet avis ?
            </h3>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              {renderStars(selectedReview.rating)}
              <p className="text-gray-700 italic mt-2">"{selectedReview.comment}"</p>
              <p className="text-sm text-gray-500 mt-2">
                - {selectedReview.client_name || 'Anonyme'}
              </p>
            </div>

            <div className="mb-4">
              <label className="label">Raison du rejet (optionnel)</label>
              <textarea
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                rows={3}
                className="input"
                placeholder="Cette information n'est pas partagée avec le client"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedReview(null)
                  setAdminResponse('')
                }}
                className="btn btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={() => handleReject(selectedReview)}
                className="btn bg-red-500 text-white hover:bg-red-600 flex-1"
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
