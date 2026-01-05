import { useState, useEffect, useRef, useMemo } from 'react'
import { MessageCircle, Send, Search, ChevronRight, User, Truck, Clock, Check, RefreshCw, Bell } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDateTime, formatTime, cn } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { useChatNotifications, useNotificationPermission } from '@/hooks/useNotifications'

interface Conversation {
  dossierId: string
  dossierRef: string
  clientName: string
  clientEmail: string
  devisId: string | null
  supplierNum: number | null // Numéro du fournisseur simulé (1, 2, 3...)
  transporteurName: string | null
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
  messages: Message[]
}

interface Message {
  id: string
  content: string
  sender: 'admin' | 'client'
  created_at: string
  read_by_admin: boolean
  read_by_client: boolean
  dossier_id: string
  devis_id: string | null
}

interface DossierGroup {
  dossierId: string
  dossierRef: string
  clientName: string
  clientEmail: string
  conversations: Conversation[]
  totalUnread: number
}

export function MessagesPage() {
  const queryClient = useQueryClient()
  const [dossierGroups, setDossierGroups] = useState<DossierGroup[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const previousUnreadRef = useRef<number>(0)

  // Notifications
  useNotificationPermission()
  const { notifyNewMessage } = useChatNotifications()

  // Charger toutes les conversations
  const loadConversations = async () => {
    try {
      // Récupérer tous les messages avec infos dossier et devis
      const { data: allMessages, error } = await supabase
        .from('messages')
        .select(`
          *,
          dossier:dossiers!messages_dossier_id_fkey (
            id,
            reference,
            client_name,
            client_email
          ),
          devis:devis!messages_devis_id_fkey (
            id,
            reference,
            transporteur:transporteurs (
              id,
              name,
              number
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Grouper les messages par dossier puis par devis
      const groupsMap = new Map<string, DossierGroup>()

      allMessages?.forEach((msg: any) => {
        if (!msg.dossier) return

        const dossierId = msg.dossier.id
        const dossierRef = msg.dossier.reference
        const clientName = msg.dossier.client_name
        const clientEmail = msg.dossier.client_email
        const devisId = msg.devis_id || 'general'
        const conversationKey = `${dossierId}-${devisId}`

        // Créer ou récupérer le groupe dossier
        if (!groupsMap.has(dossierId)) {
          groupsMap.set(dossierId, {
            dossierId,
            dossierRef,
            clientName,
            clientEmail,
            conversations: [],
            totalUnread: 0,
          })
        }

        const dossierGroup = groupsMap.get(dossierId)!

        // Chercher la conversation existante
        let conversation = dossierGroup.conversations.find(
          (c) => c.devisId === (msg.devis_id || null)
        )

        if (!conversation) {
          // Déterminer le numéro du fournisseur
          let supplierNum: number | null = null
          let transporteurName: string | null = null

          if (msg.devis) {
            // On va calculer le numéro du fournisseur plus tard
            transporteurName = msg.devis.transporteur?.name || null
          }

          conversation = {
            dossierId,
            dossierRef,
            clientName,
            clientEmail,
            devisId: msg.devis_id || null,
            supplierNum,
            transporteurName,
            lastMessage: msg.content,
            lastMessageAt: msg.created_at,
            unreadCount: 0,
            messages: [],
          }
          dossierGroup.conversations.push(conversation)
        }

        // Ajouter le message à la conversation
        conversation.messages.push({
          id: msg.id,
          content: msg.content,
          sender: msg.sender,
          created_at: msg.created_at,
          read_by_admin: msg.read_by_admin,
          read_by_client: msg.read_by_client,
          dossier_id: msg.dossier_id,
          devis_id: msg.devis_id,
        })

        // Compter les messages non lus
        if (msg.sender === 'client' && !msg.read_by_admin) {
          conversation.unreadCount++
          dossierGroup.totalUnread++
        }
      })

      // Trier les messages dans chaque conversation et déterminer les numéros de fournisseur
      const groups = Array.from(groupsMap.values())

      for (const group of groups) {
        // Récupérer tous les devis du dossier pour numéroter les fournisseurs
        const { data: dossiersDevis } = await supabase
          .from('devis')
          .select('id')
          .eq('dossier_id', group.dossierId)
          .order('price_ttc', { ascending: true })

        const devisOrder = (dossiersDevis || []).map((d: any) => d.id)

        group.conversations.forEach((conv) => {
          // Trier les messages par date (du plus ancien au plus récent)
          conv.messages.sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )

          // Mettre à jour le dernier message
          if (conv.messages.length > 0) {
            const lastMsg = conv.messages[conv.messages.length - 1]
            conv.lastMessage = lastMsg.content
            conv.lastMessageAt = lastMsg.created_at
          }

          // Calculer le numéro du fournisseur
          if (conv.devisId) {
            const index = devisOrder.indexOf(conv.devisId)
            conv.supplierNum = index >= 0 ? index + 1 : null
          }
        })

        // Trier les conversations par dernier message
        group.conversations.sort(
          (a, b) =>
            new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
        )
      }

      // Trier les groupes par totalUnread puis par dernier message
      groups.sort((a, b) => {
        if (a.totalUnread !== b.totalUnread) return b.totalUnread - a.totalUnread
        const aLastMsg = a.conversations[0]?.lastMessageAt || ''
        const bLastMsg = b.conversations[0]?.lastMessageAt || ''
        return new Date(bLastMsg).getTime() - new Date(aLastMsg).getTime()
      })

      // Calculer le total des non lus
      const newTotalUnread = groups.reduce((sum, g) => sum + g.totalUnread, 0)

      // Notifier si nouveaux messages non lus
      if (newTotalUnread > previousUnreadRef.current && previousUnreadRef.current > 0) {
        // Trouver le dernier message non lu d'un client
        for (const group of groups) {
          for (const conv of group.conversations) {
            const unreadClientMessages = conv.messages.filter(
              (m) => m.sender === 'client' && !m.read_by_admin
            )
            if (unreadClientMessages.length > 0) {
              const lastUnread = unreadClientMessages[unreadClientMessages.length - 1]
              notifyNewMessage(
                group.clientName || 'Client',
                lastUnread.content,
                group.dossierId
              )
              break
            }
          }
        }
      }
      previousUnreadRef.current = newTotalUnread

      setDossierGroups(groups)
    } catch (err) {
      console.error('Error loading conversations:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConversations()

    // Rafraîchir toutes les 10 secondes
    const interval = setInterval(loadConversations, 10000)
    return () => clearInterval(interval)
  }, [notifyNewMessage])

  // Charger les messages de la conversation sélectionnée
  useEffect(() => {
    if (selectedConversation) {
      setMessages(selectedConversation.messages)
      markAsRead(selectedConversation)
    }
  }, [selectedConversation])

  // Scroll en bas quand nouveaux messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Marquer les messages comme lus
  const markAsRead = async (conversation: Conversation) => {
    const unreadIds = conversation.messages
      .filter((m) => m.sender === 'client' && !m.read_by_admin)
      .map((m) => m.id)

    if (unreadIds.length === 0) return

    try {
      await supabase
        .from('messages')
        .update({ read_by_admin: true })
        .in('id', unreadIds)

      // Mettre à jour localement
      setDossierGroups((prev) =>
        prev.map((group) => {
          if (group.dossierId !== conversation.dossierId) return group

          return {
            ...group,
            totalUnread: Math.max(0, group.totalUnread - unreadIds.length),
            conversations: group.conversations.map((conv) => {
              if (conv.devisId !== conversation.devisId) return conv
              return {
                ...conv,
                unreadCount: 0,
                messages: conv.messages.map((m) =>
                  unreadIds.includes(m.id) ? { ...m, read_by_admin: true } : m
                ),
              }
            }),
          }
        })
      )
    } catch (err) {
      console.error('Error marking as read:', err)
    }
  }

  // Envoyer un message en tant qu'admin (qui se fait passer pour le fournisseur)
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    setSending(true)

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          content: newMessage.trim(),
          sender: 'admin',
          dossier_id: selectedConversation.dossierId,
          devis_id: selectedConversation.devisId,
          read_by_admin: true,
          read_by_client: false,
        })
        .select()
        .single()

      if (error) throw error

      // Ajouter une entrée dans la timeline
      const supplierLabel = selectedConversation.supplierNum
        ? `Fournisseur n°${selectedConversation.supplierNum}`
        : 'Admin'
      await supabase.from('timeline').insert({
        dossier_id: selectedConversation.dossierId,
        type: 'message',
        content: `💬 ${supplierLabel}: "${newMessage.trim().substring(0, 100)}${newMessage.trim().length > 100 ? '...' : ''}"`,
      })

      // Ajouter le message localement
      const newMsg: Message = {
        id: data.id,
        content: data.content,
        sender: 'admin',
        created_at: data.created_at || new Date().toISOString(),
        read_by_admin: true,
        read_by_client: false,
        dossier_id: data.dossier_id || selectedConversation.dossierId,
        devis_id: data.devis_id || null,
      }

      setMessages((prev) => [...prev, newMsg])
      setNewMessage('')

      // Mettre à jour la conversation dans les groupes
      setDossierGroups((prev) =>
        prev.map((group) => {
          if (group.dossierId !== selectedConversation.dossierId) return group

          return {
            ...group,
            conversations: group.conversations.map((conv) => {
              if (conv.devisId !== selectedConversation.devisId) return conv
              return {
                ...conv,
                lastMessage: newMsg.content,
                lastMessageAt: newMsg.created_at,
                messages: [...conv.messages, newMsg],
              }
            }),
          }
        })
      )

      // Invalider le cache React Query
      queryClient.invalidateQueries({ queryKey: ['messages'] })
      queryClient.invalidateQueries({ queryKey: ['timeline', selectedConversation.dossierId] })
    } catch (err) {
      console.error('Error sending message:', err)
      alert('Erreur lors de l\'envoi du message')
    } finally {
      setSending(false)
    }
  }

  // Filtrer les groupes par recherche
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return dossierGroups

    const query = searchQuery.toLowerCase()
    return dossierGroups.filter(
      (group) =>
        group.dossierRef.toLowerCase().includes(query) ||
        group.clientName.toLowerCase().includes(query) ||
        group.clientEmail.toLowerCase().includes(query)
    )
  }, [dossierGroups, searchQuery])

  // Calculer le total des messages non lus
  const totalUnread = dossierGroups.reduce((sum, g) => sum + g.totalUnread, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-magenta border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement des messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-purple-dark flex items-center gap-2">
            <MessageCircle className="text-magenta" />
            Messages clients
            {totalUnread > 0 && (
              <span className="bg-red-500 text-white text-sm px-2 py-0.5 rounded-full">
                {totalUnread}
              </span>
            )}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Répondez aux clients en vous faisant passer pour le fournisseur
          </p>
        </div>
        <button
          onClick={loadConversations}
          className="btn btn-secondary btn-sm flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Actualiser
        </button>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Liste des conversations */}
        <div className="w-96 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Recherche */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par dossier, client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-magenta"
              />
            </div>
          </div>

          {/* Liste */}
          <div className="flex-1 overflow-y-auto">
            {filteredGroups.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageCircle size={40} className="mx-auto mb-2 opacity-30" />
                <p>Aucune conversation</p>
              </div>
            ) : (
              filteredGroups.map((group) => (
                <div key={group.dossierId} className="border-b border-gray-100">
                  {/* En-tête du dossier */}
                  <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-purple-dark">
                        {group.dossierRef}
                      </span>
                      {group.totalUnread > 0 && (
                        <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                          {group.totalUnread}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{group.clientName}</span>
                  </div>

                  {/* Conversations du dossier */}
                  {group.conversations.map((conv) => (
                    <button
                      key={`${conv.dossierId}-${conv.devisId || 'general'}`}
                      onClick={() => setSelectedConversation(conv)}
                      className={cn(
                        'w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-start gap-3',
                        selectedConversation?.dossierId === conv.dossierId &&
                          selectedConversation?.devisId === conv.devisId &&
                          'bg-magenta/5 border-l-4 border-magenta'
                      )}
                    >
                      {/* Avatar fournisseur */}
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                          conv.supplierNum
                            ? 'gradient-bg text-white font-bold'
                            : 'bg-gray-200 text-gray-600'
                        )}
                      >
                        {conv.supplierNum ? `#${conv.supplierNum}` : <User size={18} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm text-purple-dark truncate">
                            {conv.supplierNum
                              ? `Fournisseur n°${conv.supplierNum}`
                              : 'Chat général'}
                          </span>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {formatTime(conv.lastMessageAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                        {conv.transporteurName && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <Truck size={12} />
                            {conv.transporteurName}
                          </p>
                        )}
                      </div>

                      {conv.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Zone de chat */}
        <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
          {selectedConversation ? (
            <>
              {/* Header du chat */}
              <div className="gradient-bg text-white p-4 flex items-center gap-3">
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center',
                    selectedConversation.supplierNum
                      ? 'bg-white/20 text-white font-bold'
                      : 'bg-white/20'
                  )}
                >
                  {selectedConversation.supplierNum ? (
                    `#${selectedConversation.supplierNum}`
                  ) : (
                    <MessageCircle size={24} />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {selectedConversation.supplierNum
                      ? `Fournisseur n°${selectedConversation.supplierNum}`
                      : 'Chat général'}
                  </h3>
                  <p className="text-sm text-white/80">
                    {selectedConversation.dossierRef} - {selectedConversation.clientName}
                  </p>
                </div>
                {selectedConversation.transporteurName && (
                  <div className="bg-white/20 rounded-lg px-3 py-1.5 text-sm flex items-center gap-2">
                    <Truck size={14} />
                    <span className="text-white/90">
                      Vrai transporteur: {selectedConversation.transporteurName}
                    </span>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <MessageCircle size={48} className="mx-auto mb-2 opacity-30" />
                    <p>Aucun message dans cette conversation</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        'max-w-[75%] p-3 rounded-xl text-sm',
                        msg.sender === 'admin'
                          ? 'ml-auto gradient-bg text-white rounded-br-sm'
                          : 'bg-white border border-gray-200 rounded-bl-sm shadow-sm'
                      )}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <div
                        className={cn(
                          'flex items-center gap-2 mt-1 text-xs',
                          msg.sender === 'admin' ? 'text-white/70 justify-end' : 'text-gray-400'
                        )}
                      >
                        <span>{formatTime(msg.created_at)}</span>
                        {msg.sender === 'admin' && (
                          <span className="flex items-center gap-1">
                            {msg.read_by_client ? (
                              <>
                                <Check size={12} />
                                <Check size={12} className="-ml-2" />
                              </>
                            ) : (
                              <Check size={12} />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      placeholder={
                        selectedConversation.supplierNum
                          ? `Répondre en tant que Fournisseur n°${selectedConversation.supplierNum}...`
                          : 'Répondre au client...'
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-magenta resize-none"
                      rows={2}
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="w-12 h-12 gradient-bg text-white rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <Send size={20} />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  {selectedConversation.supplierNum
                    ? `Le client pense parler au Fournisseur n°${selectedConversation.supplierNum}`
                    : "Message envoyé au nom de l'équipe Busmoov"}
                  {' '}• Appuyez sur Entrée pour envoyer
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageCircle size={64} className="mx-auto mb-4 opacity-30" />
                <h3 className="font-semibold text-lg text-gray-600 mb-2">
                  Sélectionnez une conversation
                </h3>
                <p className="text-sm">
                  Choisissez un client dans la liste pour voir les messages
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
