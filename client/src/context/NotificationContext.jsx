import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getSocket } from '../services/socket'

const NotificationContext = createContext(null)

const playSound = (type = 'message') => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const frequencies = type === 'group' ? [523, 659, 784] : [880, 660]
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12)
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.12)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.3)
      osc.start(ctx.currentTime + i * 0.12)
      osc.stop(ctx.currentTime + i * 0.12 + 0.3)
    })
  } catch (e) {
    console.log('Audio nije dostupan:', e)
  }
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [unreadConversations, setUnreadConversations] = useState(new Set())
  const [pendingCount, setPendingCount] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  const activeConversationRef = useRef(null)
  const registeredRef = useRef(false)
  const userId = JSON.parse(localStorage.getItem('user') || '{}')?.id || null

  useEffect(() => {
    if (!location.pathname.startsWith('/chat')) {
      activeConversationRef.current = null
    }
    if (location.pathname === '/chat') {
      activeConversationRef.current = null
    }
  }, [location.pathname])

  const addNotification = (notification) => {
    const id = Date.now() + Math.random()
    setNotifications(prev => [...prev, { ...notification, id }])
  }

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const markAsRead = (conversationId) => {
    setUnreadConversations(prev => {
      const next = new Set(prev)
      next.delete(conversationId)
      return next
    })
  }

  const setActiveConversationId = (id) => {
    activeConversationRef.current = id
  }

  const registerUser = (socket) => {
    if (!socket || !userId) return
    socket.emit('register_user', userId)
    registeredRef.current = true
  }

  useEffect(() => {
    if (!userId) return
    const socket = getSocket()
    if (!socket) return
    registeredRef.current = false

    const handleNewMessage = (message) => {
      const isMyMessage =
        message.sender?.id === userId ||
        message.senderId === userId

      if (isMyMessage) return

      const isActiveConversation =
        activeConversationRef.current === message.conversationId

      if (!isActiveConversation) {
        const isGroup = message.conversation?.isGroup
        const title = isGroup
          ? (message.conversation?.name || 'Grupna poruka')
          : `${message.sender?.firstName || ''} ${message.sender?.lastName || ''}`

        const body = message.fileType === 'image'
          ? '📷 Poslao/la sliku'
          : message.fileType === 'file'
          ? `📎 ${message.content}`
          : message.content

        addNotification({
          type: 'message',
          title,
          body,
          avatar: message.sender?.profileImage || null,
          initials: `${message.sender?.firstName?.[0] || '?'}${message.sender?.lastName?.[0] || ''}`,
          senderId: message.sender?.id || message.senderId,
          notifType: 'message',
        })

        playSound(isGroup ? 'group' : 'message')
        setUnreadConversations(prev => new Set([...prev, message.conversationId]))
      }
    }

    const handleAddedToGroup = (data) => {
      addNotification({
        type: 'group',
        title: 'Dodan/a si u grupu! 👥',
        body: `"${data.groupName}" · dodao/la ${data.addedByName}`,
        avatar: null,
        initials: '👥',
        senderId: null,
        notifType: 'group',
      })
      playSound('group')
    }

    const handleConnectionRequest = (data) => {
      setPendingCount(prev => prev + 1)
      addNotification({
        type: 'connection',
        title: 'Novi zahtjev za kolegu! 🤝',
        body: `${data.sender?.firstName} ${data.sender?.lastName} želi postati tvoj kolega`,
        avatar: data.sender?.profileImage || null,
        initials: `${data.sender?.firstName?.[0] || '?'}${data.sender?.lastName?.[0] || ''}`,
        senderId: data.sender?.id,
        notifType: 'connection',
      })
      playSound('message')
    }

    const handleConnectionAccepted = (data) => {
      addNotification({
        type: 'connection',
        title: 'Zahtjev prihvaćen! 🎉',
        body: `${data.acceptedBy?.firstName} ${data.acceptedBy?.lastName} je prihvatio/la tvoj zahtjev`,
        avatar: data.acceptedBy?.profileImage || null,
        initials: `${data.acceptedBy?.firstName?.[0] || '?'}${data.acceptedBy?.lastName?.[0] || ''}`,
        senderId: data.acceptedBy?.id,
        notifType: 'connection_accepted',
      })
      playSound('group')
    }

    const handleNewActivity = (activity) => {
      console.log('Nova aktivnost primljena:', activity)
      setPendingCount(prev => prev + 1)

      const ICONS = {
        CONNECTION_REQUEST: '🤝',
        CONNECTION_ACCEPTED: '🎉',
        BOOKING_REQUEST: '📚',
        BOOKING_CONFIRMED: '✅',
        BOOKING_CANCELLED: '❌',
        COMMUNITY_COMMENT: '💬',
        INTERNSHIP_REVIEW: '🏢',
        EVENT_REMINDER: '📅',
        GENERAL: '🔔',
      }

      addNotification({
        type: 'activity',
        title: `${ICONS[activity.type] || '🔔'} Nova aktivnost`,
        body: activity.message,
        avatar: activity.actor?.profileImage || null,
        initials: activity.actor
          ? `${activity.actor.firstName?.[0] || ''}${activity.actor.lastName?.[0] || ''}`
          : '🔔',
        senderId: null,
        notifType: 'activity',
        link: activity.link,
      })

      playSound('message')
    }

    const handleConnect = () => {
      registerUser(socket)
    }

    if (socket.connected) {
      registerUser(socket)
    }

    socket.on('connect', handleConnect)
    socket.on('new_message', handleNewMessage)
    socket.on('added_to_group', handleAddedToGroup)
    socket.on('connection_request', handleConnectionRequest)
    socket.on('connection_accepted', handleConnectionAccepted)
    socket.on('new_activity', handleNewActivity)

    const checkInterval = setInterval(() => {
      const s = getSocket()
      if (s?.connected && !registeredRef.current) {
        registerUser(s)
      }
    }, 3000)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('new_message', handleNewMessage)
      socket.off('added_to_group', handleAddedToGroup)
      socket.off('connection_request', handleConnectionRequest)
      socket.off('connection_accepted', handleConnectionAccepted)
      socket.off('new_activity', handleNewActivity)
      clearInterval(checkInterval)
    }
  }, [userId])

  return (
    <NotificationContext.Provider value={{
      addNotification,
      removeNotification,
      unreadConversations,
      markAsRead,
      setActiveConversationId,
      pendingCount,
      setPendingCount,
    }}>
      {children}

      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {notifications.map(n => (
          <NotificationToast
            key={n.id}
            notification={n}
            onClose={() => removeNotification(n.id)}
            onAction={() => {
              if (n.notifType === 'activity' && n.link) {
                navigate(n.link)
              } else if (n.notifType === 'message' && n.senderId) {
                navigate(`/chat/${n.senderId}`)
              } else if (n.notifType === 'group') {
                navigate('/chat')
              }
              removeNotification(n.id)
            }}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

function NotificationToast({ notification, onClose, onAction }) {
  const [progress, setProgress] = useState(100)
  const [visible, setVisible] = useState(false)

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))

    const duration = 5000
    const interval = 50
    const step = (interval / duration) * 100

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          clearInterval(timer)
          handleClose()
          return 0
        }
        return prev - step
      })
    }, interval)

    return () => clearInterval(timer)
  }, [])

  const TYPE_COLORS = {
    message: 'bg-indigo-500',
    group: 'bg-purple-500',
    connection: 'bg-green-500',
    activity: 'bg-amber-500',
  }

  const TYPE_BG = {
    message: 'bg-indigo-600',
    group: 'bg-purple-600',
    connection: 'bg-green-600',
    activity: 'bg-amber-600',
  }

  return (
    <div
      className={`pointer-events-auto transition-all duration-300 ease-out ${
        visible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-8 scale-95'
      }`}
    >
      <div
        onClick={onAction}
        className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden w-80 cursor-pointer hover:bg-gray-800 transition-colors"
      >
        <div className="h-0.5 bg-gray-700">
          <div
            className={`h-full ${TYPE_COLORS[notification.type] || 'bg-indigo-500'}`}
            style={{ width: `${progress}%`, transition: 'width 50ms linear' }}
          />
        </div>

        <div className="p-4 flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden ${
              TYPE_BG[notification.type] || 'bg-indigo-600'
            }`}>
              {notification.avatar ? (
                <img src={notification.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span>{notification.initials}</span>
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <p className="text-white text-sm font-semibold truncate">{notification.title}</p>
              <span className="text-gray-500 text-xs flex-shrink-0">upravo</span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">{notification.body}</p>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); handleClose() }}
            className="text-gray-600 hover:text-gray-300 transition flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export const useNotifications = () => useContext(NotificationContext)