import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, CheckCheck, Info, Truck, Euro, XCircle, ChevronDown, ChevronUp, ExternalLink, CreditCard, FileSignature, MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface NotificationCRM {
  id: string
  created_at: string
  dossier_id: string | null
  dossier_reference: string | null
  type: 'infos_voyage' | 'contact_chauffeur' | 'tarif_fournisseur' | 'refus_fournisseur' | 'paiement_echoue' | 'contrat_signe' | 'nouveau_message'
  title: string
  description: string | null
  source_type: string | null
  source_name: string | null
  source_id: string | null
  is_read: boolean
  read_at: string | null
  metadata: Record<string, any>
}

const TYPE_CONFIG = {
  infos_voyage: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Infos voyage',
  },
  contact_chauffeur: {
    icon: Truck,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Contact chauffeur',
  },
  tarif_fournisseur: {
    icon: Euro,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    label: 'Tarif fournisseur',
  },
  refus_fournisseur: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Refus fournisseur',
  },
  paiement_echoue: {
    icon: CreditCard,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Paiement CB',
  },
  contrat_signe: {
    icon: FileSignature,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    label: 'Contrat signé',
  },
  nouveau_message: {
    icon: MessageCircle,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    label: 'Message',
  },
}

interface NotificationsPanelProps {
  onOpenDossier?: (dossierId: string) => void
  maxHeight?: string
}

export function NotificationsPanel({ onOpenDossier, maxHeight = '400px' }: NotificationsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const queryClient = useQueryClient()

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications-crm', filter],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any)
        .from('notifications_crm')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (filter !== 'all') {
        if (filter === 'unread') {
          query = query.eq('is_read', false)
        } else {
          query = query.eq('type', filter)
        }
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as NotificationCRM[]
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Count unread
  const unreadCount = notifications.filter(n => !n.is_read).length

  // Mark as read mutation
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('notifications_crm')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-crm'] })
    },
  })

  // Mark all as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('notifications_crm')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('is_read', false)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-crm'] })
    },
  })

  const handleNotificationClick = (notification: NotificationCRM) => {
    // Ouvrir le dossier (sans marquer comme lu automatiquement)
    if (notification.dossier_id && onOpenDossier) {
      onOpenDossier(notification.dossier_id)
    }
  }

  const handleMarkAsReadOnly = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation() // Empêcher l'ouverture du dossier
    markAsRead.mutate(notificationId)
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "À l'instant"
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays < 7) return `Il y a ${diffDays}j`
    return formatDate(dateString)
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div
        className="p-4 bg-gradient-to-r from-purple-dark to-magenta text-white cursor-pointer flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="font-semibold">Notifications CRM</span>
          {unreadCount > 0 && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
              {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>

      {isExpanded && (
        <>
          {/* Filters */}
          <div className="p-3 border-b bg-gray-50 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={cn(
                  'px-2 py-1 text-xs rounded-full transition-colors',
                  filter === 'all' ? 'bg-purple-dark text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                )}
              >
                Toutes
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={cn(
                  'px-2 py-1 text-xs rounded-full transition-colors',
                  filter === 'unread' ? 'bg-purple-dark text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                )}
              >
                Non lues
              </button>
              {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={cn(
                    'px-2 py-1 text-xs rounded-full transition-colors flex items-center gap-1',
                    filter === key ? `${config.bgColor} ${config.color}` : 'bg-white text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <config.icon size={12} />
                  {config.label}
                </button>
              ))}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
                className="text-xs text-magenta hover:underline flex items-center gap-1"
              >
                <CheckCheck size={14} />
                Tout marquer lu
              </button>
            )}
          </div>

          {/* Notifications list */}
          <div style={{ maxHeight }} className="overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                Chargement...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                <p>Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => {
                  const config = TYPE_CONFIG[notification.type] || {
                    icon: Bell,
                    color: 'text-gray-600',
                    bgColor: 'bg-gray-100',
                    label: notification.type,
                  }
                  const Icon = config.icon

                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        'p-3 flex gap-3 cursor-pointer transition-colors hover:bg-gray-50',
                        !notification.is_read && 'bg-blue-50/50'
                      )}
                    >
                      {/* Icon */}
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', config.bgColor)}>
                        <Icon size={16} className={config.color} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={cn('text-sm font-medium', !notification.is_read && 'text-gray-900')}>
                              {notification.title}
                            </p>
                            {notification.description && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                {notification.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!notification.is_read ? (
                              <button
                                onClick={(e) => handleMarkAsReadOnly(e, notification.id)}
                                className="w-7 h-7 rounded-full bg-yellow-400 hover:bg-green-500 text-white flex items-center justify-center transition-colors"
                                title="Marquer comme lu"
                              >
                                <Check size={16} />
                              </button>
                            ) : (
                              <span className="w-7 h-7 rounded-full bg-green-100 text-green-500 flex items-center justify-center">
                                <Check size={16} />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                          <span>{formatTimeAgo(notification.created_at)}</span>
                          {notification.dossier_reference && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-magenta">
                                {notification.dossier_reference}
                                <ExternalLink size={10} />
                              </span>
                            </>
                          )}
                          {notification.source_name && (
                            <>
                              <span>•</span>
                              <span>{notification.source_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
