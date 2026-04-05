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
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
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
    if (unreadConversations.has(conversationId)) {
      setUnreadMessagesCount(prev => Math.max(0, prev - 1))
    }
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
        setUnreadMessagesCount(prev => prev + 1)
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
      unreadMessagesCount,
      setUnreadMessagesCount,
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
        if (prev <= 0) { clearInterval(timer); handleClose(); return 0 }
        return prev - step
      })
    }, interval)
    return () => clearInterval(timer)
  }, [])

  const TYPE_CONFIG = {
    message: { bar: '#FF6B35', avatar: '#FF6B35' },
    group: { bar: '#FFB800', avatar: '#FFB800' },
    connection: { bar: 'linear-gradient(135deg, #FF6B35, #FFB800)', avatar: '#FF6B35' },
    activity: { bar: '#FFB800', avatar: '#FFB800' },
  }

  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.message

  return (
    <div style={{
      pointerEvents: 'auto',
      transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.96)',
    }}>
      <div
        onClick={onAction}
        style={{
          background: '#1C1C1E',
          border: '1px solid #2C2C2E',
          borderRadius: '18px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          overflow: 'hidden',
          width: '320px',
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#2C2C2E'}
        onMouseLeave={e => e.currentTarget.style.background = '#1C1C1E'}
      >
        <div style={{ height: '2px', background: '#2C2C2E' }}>
          <div style={{
            height: '100%',
            background: config.bar,
            width: `${progress}%`,
            transition: 'width 50ms linear',
          }} />
        </div>

        <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '50%',
              background: config.avatar,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
              color: 'white', fontWeight: '700', fontSize: '13px',
            }}>
              {notification.avatar ? (
                <img src={notification.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span>{notification.initials}</span>
              )}
            </div>
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              width: '10px', height: '10px', borderRadius: '50%',
              background: '#4ADE80', border: '2px solid #1C1C1E',
            }} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '2px' }}>
              <p style={{
                color: 'white', fontSize: '13px', fontWeight: '700',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {notification.title}
              </p>
              <span style={{ color: '#48484A', fontSize: '11px', flexShrink: 0 }}>upravo</span>
            </div>
            <p style={{
              color: '#8E8E93', fontSize: '12px', lineHeight: '1.4',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {notification.body}
            </p>
          </div>

          <button
            onClick={e => { e.stopPropagation(); handleClose() }}
            style={{
              color: '#48484A', background: 'transparent', border: 'none',
              cursor: 'pointer', padding: '2px', flexShrink: 0,
              fontSize: '14px', lineHeight: 1,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#8E8E93'}
            onMouseLeave={e => e.currentTarget.style.color = '#48484A'}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

export const useNotifications = () => useContext(NotificationContext)