import { useState, useRef, useEffect, useMemo } from 'react'
import { MessageCircle, Send, X, ChevronLeft, Users, Bot, Sparkles } from 'lucide-react'
import { useMessages, useSendMessage, useVoyageInfo, useTransporteurForChat } from '@/hooks/useSupabase'
import { useMessageNotificationWatcher, useNotificationPermission } from '@/hooks/useNotifications'
import { formatTime, cn } from '@/lib/utils'
import { getAutoResponse, getFaqSuggestions, isGreeting, getGreetingResponse } from '@/lib/chatAutoResponses'
import { getChatTranslations, getLanguageFromCountryCode, type ChatLanguage } from '@/lib/chatTranslations'

interface Supplier {
  devisId: string
  supplierNum: number
}

interface ChatWidgetProps {
  dossierId: string
  isClient?: boolean
  suppliers?: Supplier[] // List of suppliers for client to chat with
  externalOpen?: boolean // Controlled open state from parent
  onOpenChange?: (isOpen: boolean) => void // Callback when open state changes
  preSelectedSupplier?: Supplier | null // Pre-select a specific supplier
  singleSupplierMode?: boolean // If true, only show chat for the pre-selected supplier (no list)
  countryCode?: string | null // Country code for language detection
}

export function ChatWidget({ dossierId, isClient = true, suppliers = [], externalOpen, onOpenChange, preSelectedSupplier, singleSupplierMode = false, countryCode }: ChatWidgetProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  // Déterminer la langue à partir du code pays
  const language: ChatLanguage = useMemo(() => getLanguageFromCountryCode(countryCode), [countryCode])
  const t = useMemo(() => getChatTranslations(language), [language])
  const faqSuggestions = useMemo(() => getFaqSuggestions(language), [language])

  // Use external state if provided, otherwise use internal state
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen
  const setIsOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open)
    }
    setInternalOpen(open)
  }
  const [message, setMessage] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(preSelectedSupplier || null)
  const [autoResponses, setAutoResponses] = useState<Array<{ id: string; content: string; timestamp: Date }>>([])

  // Récupérer les infos voyage et transporteur pour les réponses automatiques (côté client uniquement)
  // useTransporteurForChat ne récupère QUE le nom et numéro d'astreinte - pas de données sensibles
  const { data: voyageInfo } = useVoyageInfo(dossierId)
  const { data: transporteur } = useTransporteurForChat(dossierId)

  // Update selectedSupplier when preSelectedSupplier changes
  useEffect(() => {
    if (preSelectedSupplier) {
      setSelectedSupplier(preSelectedSupplier)
    }
  }, [preSelectedSupplier])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get messages - either for specific supplier or all messages for admin
  const { data: messages = [] } = useMessages(
    dossierId,
    isClient && selectedSupplier ? selectedSupplier.devisId : undefined
  )
  const sendMessage = useSendMessage()

  // For admin view, get all messages to count unread
  const { data: allMessages = [] } = useMessages(dossierId)

  const unreadCount = allMessages.filter(
    m => (isClient ? !m.read_by_client && m.sender === 'admin' : !m.read_by_admin && m.sender === 'client')
  ).length

  // Demander la permission pour les notifications
  useNotificationPermission()

  // Surveiller les nouveaux messages pour les notifications
  useMessageNotificationWatcher(messages, isClient)

  useEffect(() => {
    if (isOpen && (selectedSupplier || !singleSupplierMode)) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, autoResponses, isOpen, selectedSupplier, singleSupplierMode])

  const handleSend = async (customMessage?: string) => {
    const msgToSend = customMessage || message.trim()
    if (!msgToSend) return

    try {
      // Envoyer le message du client
      await sendMessage.mutateAsync({
        dossier_id: dossierId,
        devis_id: selectedSupplier?.devisId || null,
        sender: isClient ? 'client' : 'admin',
        content: msgToSend,
        read_by_client: !isClient,
        read_by_admin: isClient,
      })
      setMessage('')

      // Si c'est un client, vérifier si une réponse automatique est possible
      if (isClient) {
        // Petit délai pour que le message apparaisse d'abord
        setTimeout(() => {
          // Vérifier d'abord si c'est une salutation
          if (isGreeting(msgToSend, language)) {
            const greetingResponse = getGreetingResponse(language)
            setAutoResponses(prev => [...prev, {
              id: `auto-${Date.now()}`,
              content: greetingResponse,
              timestamp: new Date()
            }])
            return
          }

          // Sinon, vérifier les questions FAQ
          const autoResponse = getAutoResponse(msgToSend, voyageInfo, transporteur, language)
          if (autoResponse.matched && autoResponse.response) {
            setAutoResponses(prev => [...prev, {
              id: `auto-${Date.now()}`,
              content: autoResponse.response!,
              timestamp: new Date()
            }])
          }
        }, 500)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  // Gérer le clic sur une suggestion FAQ
  const handleFaqClick = (faqMessage: string) => {
    handleSend(faqMessage)
  }

  // Count unread messages per supplier
  const getUnreadCountForSupplier = (devisId: string) => {
    return allMessages.filter(
      m => m.devis_id === devisId && !m.read_by_client && m.sender === 'admin'
    ).length
  }

  // Client view - show supplier selection first (but not in single supplier mode)
  const showSupplierList = isClient && suppliers.length > 0 && !selectedSupplier && !singleSupplierMode

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="gradient-bg text-white p-4 flex items-center gap-3">
            {selectedSupplier && isClient && !singleSupplierMode && (
              <button
                onClick={() => setSelectedSupplier(null)}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              {showSupplierList ? <Users size={20} /> : '🚌'}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">
                {showSupplierList
                  ? t.chooseSupplier
                  : selectedSupplier
                  ? `${t.supplier} n°${selectedSupplier.supplierNum}`
                  : isClient
                  ? t.yourTransporter
                  : t.clientChat}
              </h4>
              <span className="text-xs opacity-80">
                {showSupplierList
                  ? `${suppliers.length} ${t.suppliersAvailable}`
                  : t.usuallyReplies}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Supplier Selection (for clients) */}
          {showSupplierList ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              <p className="text-sm text-gray-500 text-center mb-4">
                {t.selectSupplierPrompt}
              </p>
              {suppliers.map((supplier) => {
                const unread = getUnreadCountForSupplier(supplier.devisId)
                return (
                  <button
                    key={supplier.devisId}
                    onClick={() => setSelectedSupplier(supplier)}
                    className="w-full p-4 bg-white rounded-xl border border-gray-200 hover:border-magenta hover:shadow-md transition-all flex items-center gap-4"
                  >
                    <div className="w-12 h-12 gradient-bg rounded-full flex items-center justify-center text-white font-bold">
                      #{supplier.supplierNum}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-purple-dark">
                        {t.supplier} n°{supplier.supplierNum}
                      </div>
                      <div className="text-xs text-gray-500">
                        {t.clickToChat}
                      </div>
                    </div>
                    {unread > 0 && (
                      <span className="w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {unread}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.length === 0 && autoResponses.length === 0 ? (
                  <div className="text-center py-6 text-gray-400">
                    <Bot size={40} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t.welcomeAssistance}</p>
                    <p className="text-xs mt-2 mb-4">
                      {isClient ? t.askQuestionOrChoose : t.startConversation}
                    </p>
                    {/* Suggestions FAQ pour les clients */}
                    {isClient && (
                      <div className="flex flex-wrap justify-center gap-2 mt-3">
                        {faqSuggestions.slice(0, 4).map((faq, index) => (
                          <button
                            key={index}
                            onClick={() => handleFaqClick(faq.message)}
                            className="px-3 py-1.5 bg-white border border-purple-200 rounded-full text-xs text-purple-dark hover:bg-purple-50 hover:border-magenta transition-colors"
                          >
                            {faq.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Messages normaux et réponses auto combinés */}
                    {(() => {
                      // Combiner messages et réponses auto pour un affichage chronologique
                      const allItems = [
                        ...messages.map(msg => ({
                          type: 'message' as const,
                          id: msg.id,
                          content: msg.content,
                          sender: msg.sender,
                          timestamp: new Date(msg.created_at || Date.now())
                        })),
                        ...autoResponses.map(ar => ({
                          type: 'auto' as const,
                          id: ar.id,
                          content: ar.content,
                          sender: 'bot' as const,
                          timestamp: ar.timestamp
                        }))
                      ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

                      return allItems.map((item) => {
                        if (item.type === 'auto') {
                          // Réponse automatique (bot)
                          return (
                            <div
                              key={item.id}
                              className="max-w-[90%] p-3 rounded-xl text-sm bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-bl-sm"
                            >
                              <div className="flex items-center gap-1.5 mb-1.5 text-magenta">
                                <Sparkles size={12} />
                                <span className="text-xs font-medium">{t.assistantName}</span>
                              </div>
                              <div className="text-gray-700 whitespace-pre-wrap text-xs leading-relaxed">
                                {item.content.split('\n').map((line, i) => {
                                  // Formatage markdown simple
                                  if (line.startsWith('**') && line.endsWith('**')) {
                                    return <p key={i} className="font-semibold text-purple-dark mt-2 first:mt-0">{line.replace(/\*\*/g, '')}</p>
                                  }
                                  if (line.startsWith('• ')) {
                                    return <p key={i} className="ml-2">{line}</p>
                                  }
                                  return <p key={i}>{line}</p>
                                })}
                              </div>
                              <p className="text-xs opacity-50 mt-1.5">
                                {formatTime(item.timestamp.toISOString())}
                              </p>
                            </div>
                          )
                        }

                        // Message normal
                        return (
                          <div
                            key={item.id}
                            className={cn(
                              'max-w-[85%] p-3 rounded-xl text-sm',
                              (isClient ? item.sender === 'client' : item.sender === 'admin')
                                ? 'ml-auto gradient-bg text-white rounded-br-sm'
                                : 'bg-white border border-gray-200 rounded-bl-sm'
                            )}
                          >
                            <p>{item.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {item.sender === 'client' ? t.you : isClient ? t.supplierLabel : t.client} • {formatTime(item.timestamp.toISOString())}
                            </p>
                          </div>
                        )
                      })
                    })()}

                    {/* Suggestions après quelques messages */}
                    {isClient && messages.length > 0 && messages.length < 5 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {faqSuggestions.slice(0, 3).map((faq, index) => (
                          <button
                            key={index}
                            onClick={() => handleFaqClick(faq.message)}
                            className="px-2 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:bg-purple-50 hover:border-magenta hover:text-purple-dark transition-colors"
                          >
                            {faq.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-gray-200 bg-white flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={t.yourMessage}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-magenta"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!message.trim() || sendMessage.isPending}
                  className="w-10 h-10 gradient-bg text-white rounded-full flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 gradient-bg text-white rounded-full flex items-center justify-center shadow-lg shadow-magenta/40 hover:scale-110 transition-transform"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  )
}
