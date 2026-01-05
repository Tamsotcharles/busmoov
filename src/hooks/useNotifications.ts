import { useEffect, useRef, useCallback } from 'react'

// Son de notification (petit bip)
const NOTIFICATION_SOUND = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU9vT18A'

// Demander la permission pour les notifications du navigateur
export function useNotificationPermission() {
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])
}

// Hook pour jouer un son de notification
export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Créer l'élément audio une seule fois
    audioRef.current = new Audio()
    audioRef.current.volume = 0.5

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const playSound = useCallback(() => {
    if (audioRef.current) {
      // Utiliser un son de notification simple
      audioRef.current.src = NOTIFICATION_SOUND
      audioRef.current.play().catch(() => {
        // Ignorer les erreurs si le navigateur bloque l'audio automatique
      })
    }
  }, [])

  return playSound
}

// Hook pour afficher une notification du navigateur
export function useBrowserNotification() {
  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/logo-icon.svg',
        badge: '/logo-icon.svg',
        ...options,
      })

      // Fermer automatiquement après 5 secondes
      setTimeout(() => notification.close(), 5000)

      // Cliquer sur la notification ramène au focus
      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      return notification
    }
    return null
  }, [])

  return showNotification
}

// Hook combiné pour les notifications de chat
export function useChatNotifications() {
  const playSound = useNotificationSound()
  const showNotification = useBrowserNotification()

  const notifyNewMessage = useCallback((senderName: string, content: string, dossierId?: string) => {
    // Jouer le son
    playSound()

    // Afficher la notification du navigateur si la page n'est pas au premier plan
    if (document.hidden) {
      showNotification(`Nouveau message de ${senderName}`, {
        body: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        tag: `chat-${dossierId || 'general'}`, // Évite les doublons
      })
    }
  }, [playSound, showNotification])

  return { notifyNewMessage, playSound, showNotification }
}

// Hook pour surveiller les nouveaux messages et déclencher les notifications
export function useMessageNotificationWatcher(
  messages: any[],
  isClient: boolean,
  onNewMessage?: (message: any) => void
) {
  const previousMessagesRef = useRef<any[]>([])
  const { notifyNewMessage } = useChatNotifications()

  useEffect(() => {
    const previousMessages = previousMessagesRef.current

    // Ne pas notifier au premier chargement
    if (previousMessages.length === 0) {
      previousMessagesRef.current = messages
      return
    }

    // Trouver les nouveaux messages
    const newMessages = messages.filter(
      msg => !previousMessages.find(prev => prev.id === msg.id)
    )

    // Notifier pour chaque nouveau message qui n'est pas de l'utilisateur courant
    newMessages.forEach(msg => {
      const isOwnMessage = isClient ? msg.sender === 'client' : msg.sender === 'admin'

      if (!isOwnMessage) {
        const senderName = msg.sender === 'client' ? 'Client' : msg.sender === 'admin' ? 'Fournisseur' : 'Admin'
        notifyNewMessage(senderName, msg.content, msg.dossier_id)
        onNewMessage?.(msg)
      }
    })

    previousMessagesRef.current = messages
  }, [messages, isClient, notifyNewMessage, onNewMessage])
}
