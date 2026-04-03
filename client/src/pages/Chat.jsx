import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { getConversations, getOrCreateConversation, getMessages, uploadFile } from '../api/chat'
import ChatDetails from '../components/ChatDetails'
import CreateGroupModal from '../components/CreateGroupModal'
import { getSocket } from '../services/socket'
import { useNotifications } from '../context/NotificationContext'

export default function Chat() {
  const { userId } = useParams()
  const { unreadConversations, markAsRead, setActiveConversationId } = useNotifications()

  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)

  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const fileInputRef = useRef(null)
  const activeConvRef = useRef(null)
  const conversationsRef = useRef([])
  const openRequestIdRef = useRef(0)

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => { conversationsRef.current = conversations }, [conversations])

  const fetchConversations = useCallback(async () => {
    try {
      const data = await getConversations()
      setConversations(data)
      return data
    } catch (err) {
      console.error(err)
      return []
    }
  }, [])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleNewMessage = (message) => {
      if (activeConvRef.current?.id === message.conversationId) {
        setMessages(prev => {
          const exists = prev.some(m => m.id === message.id)
          if (exists) return prev
          return [...prev, message]
        })
      }
      const isMyMessage = message.sender?.id === user.id || message.senderId === user.id
      if (!isMyMessage && activeConvRef.current?.id !== message.conversationId) {
        setConversations(prev => prev.map(conv =>
          conv.id === message.conversationId
            ? { ...conv, unreadCount: (conv.unreadCount || 0) + 1, messages: [message] }
            : conv
        ))
        return
      }
      setConversations(prev => prev.map(conv =>
        conv.id === message.conversationId
          ? { ...conv, messages: [message] }
          : conv
      ))
    }

    const handleTypingStart = () => setIsTyping(true)
    const handleTypingStop = () => setIsTyping(false)

    socket.on('new_message', handleNewMessage)
    socket.on('user_typing', handleTypingStart)
    socket.on('user_stop_typing', handleTypingStop)

    return () => {
      socket.off('new_message', handleNewMessage)
      socket.off('user_typing', handleTypingStart)
      socket.off('user_stop_typing', handleTypingStop)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const convs = await fetchConversations()
      if (userId) {
        const existing = convs.find(c =>
          !c.isGroup && c.participants.some(p => p.user?.id === userId)
        )
        if (existing) {
          await openConversation(existing)
        } else {
          try {
            const conv = await getOrCreateConversation(userId)
            setConversations(prev => {
              const exists = prev.some(c => c.id === conv.id)
              return exists ? prev : [conv, ...prev]
            })
            await openConversation(conv)
          } catch (err) {
            console.error(err)
          }
        }
      }
      setLoading(false)
    }
    init()
  }, [userId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      const socket = getSocket()
      if (socket && activeConvRef.current?.id) {
        socket.emit('leave_conversation', activeConvRef.current.id)
      }
      activeConvRef.current = null
      setActiveConversationId(null)
    }
  }, [])

  const openConversation = async (conversation) => {
    if (activeConvRef.current?.id === conversation.id) return
    const socket = getSocket()
    if (!socket) return

    const requestId = ++openRequestIdRef.current
    if (activeConvRef.current) socket.emit('leave_conversation', activeConvRef.current.id)

    activeConvRef.current = conversation
    setActiveConversation(conversation)
    setShowDetails(false)
    setActiveConversationId(conversation.id)
    markAsRead(conversation.id)

    setConversations(prev => prev.map(c =>
      c.id === conversation.id ? { ...c, unreadCount: 0 } : c
    ))

    socket.emit('join_conversation', conversation.id)
    setMessages([])

    try {
      const msgs = await getMessages(conversation.id)
      if (requestId !== openRequestIdRef.current || activeConvRef.current?.id !== conversation.id) return
      setMessages(msgs)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeConvRef.current) return
    const socket = getSocket()
    if (!socket) return
    socket.emit('send_message', {
      conversationId: activeConvRef.current.id,
      content: newMessage,
    })
    setNewMessage('')
    socket.emit('stop_typing', activeConvRef.current.id)
  }

  const handleTypingInput = (e) => {
    setNewMessage(e.target.value)
    if (!activeConvRef.current) return
    const socket = getSocket()
    if (!socket) return
    socket.emit('typing', activeConvRef.current.id)
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      getSocket()?.emit('stop_typing', activeConvRef.current.id)
    }, 1500)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || !activeConvRef.current) return
    setUploadError('')
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Fajl je prevelik. Maksimalno 10MB.')
      e.target.value = ''
      return
    }
    setUploading(true)
    try {
      const { fileUrl, fileType, fileName } = await uploadFile(file)
      const socket = getSocket()
      if (!socket) return
      socket.emit('send_message', {
        conversationId: activeConvRef.current.id,
        content: fileName,
        fileUrl,
        fileType,
      })
    } catch {
      setUploadError('Greška pri uploadu.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleGroupCreated = (conv) => {
    setConversations(prev => [conv, ...prev])
    openConversation(conv)
  }

  const getOtherParticipant = (conv) => {
    if (conv?.isGroup) return null
    return conv?.participants?.find(p => p.user?.id !== user.id)?.user
  }

  const getConversationName = (conv) => {
    if (!conv) return ''
    if (conv.isGroup) return conv.name
    const other = getOtherParticipant(conv)
    return `${other?.firstName || ''} ${other?.lastName || ''}`.trim()
  }

  const getConversationAvatar = (conv) => {
    if (!conv || conv.isGroup) return null
    return getOtherParticipant(conv)?.profileImage
  }

  const getConversationInitials = (conv) => {
    if (!conv) return ''
    if (conv.isGroup) return '👥'
    const other = getOtherParticipant(conv)
    return `${other?.firstName?.[0] || ''}${other?.lastName?.[0] || ''}`
  }

  const formatTime = (date) => new Date(date).toLocaleTimeString('bs-BA', {
    hour: '2-digit', minute: '2-digit'
  })

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#EFEDE8' }}>
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar konverzacija */}
        <div className="w-80 flex flex-col flex-shrink-0 overflow-hidden"
          style={{ background: '#1C1C1E', borderRight: '1px solid #2C2C2E' }}>

          {/* Header */}
          <div className="px-5 py-5 flex items-center justify-between flex-shrink-0"
            style={{ borderBottom: '1px solid #2C2C2E' }}>
            <div>
              <h2 className="font-black text-white text-lg">Poruke</h2>
              <p className="text-xs mt-0.5" style={{ color: '#636366' }}>
                {conversations.length} konverzacija
              </p>
            </div>
            <button
              onClick={() => setShowGroupModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition hover:opacity-80"
              style={{ background: 'rgba(255,107,53,0.15)', color: '#FF6B35' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Grupa
            </button>
          </div>

          {/* Lista konverzacija */}
          <div className="flex-1 overflow-y-auto py-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-6 h-6 rounded-full border-2 animate-spin"
                  style={{ borderColor: '#FF6B35', borderTopColor: 'transparent' }} />
                <p className="text-xs" style={{ color: '#636366' }}>Učitavanje...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
                <p className="text-3xl mb-3">💬</p>
                <p className="text-sm font-semibold mb-1" style={{ color: '#8E8E93' }}>
                  Nema poruka
                </p>
                <p className="text-xs" style={{ color: '#48484A' }}>
                  Pretraži studente u sidebaru
                </p>
              </div>
            ) : (
              conversations.map(conv => {
                const avatar = getConversationAvatar(conv)
                const initials = getConversationInitials(conv)
                const name = getConversationName(conv)
                const lastMsg = conv.messages?.[0]
                const isActive = activeConversation?.id === conv.id
                const isUnread = (conv.unreadCount || 0) > 0 || unreadConversations.has(conv.id)

                return (
                  <button
                    key={conv.id}
                    onClick={() => openConversation(conv)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 transition-all text-left"
                    style={{
                      background: isActive
                        ? 'rgba(255,107,53,0.12)'
                        : 'transparent',
                      borderLeft: isActive ? '3px solid #FF6B35' : '3px solid transparent',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-11 h-11 rounded-full overflow-hidden">
                        {avatar ? (
                          <img src={avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm"
                            style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }}>
                            {initials}
                          </div>
                        )}
                      </div>
                      {isUnread && !isActive && (
                        <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                          style={{ background: '#FF6B35' }}>
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className="text-sm truncate font-semibold"
                          style={{ color: isActive ? '#FF6B35' : isUnread ? '#E5E5EA' : '#8E8E93' }}>
                          {name}
                        </p>
                        {lastMsg && (
                          <span className="text-xs flex-shrink-0" style={{ color: '#48484A' }}>
                            {formatTime(lastMsg.createdAt)}
                          </span>
                        )}
                      </div>

                      {lastMsg ? (
                        <p className="text-xs truncate"
                          style={{ color: isUnread ? '#8E8E93' : '#48484A' }}>
                          {conv.isGroup && `${lastMsg.sender?.firstName}: `}
                          {lastMsg.fileType === 'image' ? '📷 Slika'
                            : lastMsg.fileType === 'file' ? `📎 ${lastMsg.content}`
                            : lastMsg.content}
                        </p>
                      ) : (
                        <p className="text-xs" style={{ color: '#48484A' }}>
                          Počni razgovor
                        </p>
                      )}
                    </div>

                    {/* Unread count */}
                    {(conv.unreadCount || 0) > 0 && !isActive && (
                      <span className="flex-shrink-0 min-w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold px-1.5"
                        style={{ background: '#FF6B35', fontSize: '10px' }}>
                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!activeConversation ? (
            <div className="flex-1 flex items-center justify-center"
              style={{ background: '#EFEDE8' }}>
              <div className="text-center">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-5"
                  style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }}>
                  💬
                </div>
                <h3 className="text-xl font-black text-gray-800 mb-2">Odaberi konverzaciju</h3>
                <p className="text-gray-500 text-sm">ili pretraži studenta u lijevom meniju</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-4 px-6 py-4 flex-shrink-0"
                style={{
                  background: '#FDFCF9',
                  borderBottom: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}>
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  {getConversationAvatar(activeConversation) ? (
                    <img src={getConversationAvatar(activeConversation)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }}>
                      {getConversationInitials(activeConversation)}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <p className="font-black text-gray-900">{getConversationName(activeConversation)}</p>
                  {activeConversation.isGroup ? (
                    <p className="text-xs text-gray-400">
                      {activeConversation.participants?.length} članova
                    </p>
                  ) : (
                    getOtherParticipant(activeConversation)?.faculty && (
                      <p className="text-xs text-gray-400">
                        {getOtherParticipant(activeConversation).faculty}
                      </p>
                    )
                  )}
                </div>

                {/* Detalji dugme */}
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="p-2.5 rounded-xl transition"
                  style={{
                    background: showDetails ? '#FFF7ED' : 'transparent',
                    color: showDetails ? '#FF6B35' : '#8E8E93',
                  }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>

              <div className="flex flex-1 overflow-hidden">
                {/* Poruke */}
                <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#EFEDE8' }}>

                  {/* Messages list */}
                  <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
                    {messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-4"
                          style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }}>
                          👋
                        </div>
                        <p className="font-bold text-gray-700 mb-1">Početak razgovora</p>
                        <p className="text-sm text-gray-400">Pošalji prvu poruku!</p>
                      </div>
                    )}

                    {messages.map((msg, idx) => {
                      const isMine = msg.senderId === user.id || msg.sender?.id === user.id
                      const prevMsg = messages[idx - 1]
                      const showAvatar = !isMine && (!prevMsg || prevMsg.senderId !== msg.senderId)
                      const showTime = !messages[idx + 1] ||
                        Math.abs(new Date(msg.createdAt) - new Date(messages[idx + 1]?.createdAt)) > 300000

                      return (
                        <div key={msg.id}>
                          <div className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                            {/* Avatar (tuđe poruke) */}
                            {!isMine && (
                              <div className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden mb-1"
                                style={{ visibility: showAvatar ? 'visible' : 'hidden' }}>
                                {msg.sender?.profileImage ? (
                                  <img src={msg.sender.profileImage} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold"
                                    style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }}>
                                    {msg.sender?.firstName?.[0]}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Bubble */}
                            <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-xs lg:max-w-sm`}>
                              {/* Ime u grupi */}
                              {activeConversation.isGroup && !isMine && showAvatar && (
                                <span className="text-xs font-semibold mb-1 ml-1" style={{ color: '#FF6B35' }}>
                                  {msg.sender?.firstName}
                                </span>
                              )}

                              <div className="px-4 py-2.5 rounded-2xl"
                                style={{
                                  background: isMine
                                    ? 'linear-gradient(135deg, #FF6B35, #FF8C5A)'
                                    : '#FDFCF9',
                                  color: isMine ? 'white' : '#1C1C1E',
                                  borderRadius: isMine
                                    ? '20px 20px 6px 20px'
                                    : '20px 20px 20px 6px',
                                  boxShadow: isMine
                                    ? '0 2px 8px rgba(255,107,53,0.3)'
                                    : '0 1px 4px rgba(0,0,0,0.08)',
                                }}>

                                {/* Slika */}
                                {msg.fileType === 'image' && msg.fileUrl && (
                                  <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                                    <img
                                      src={msg.fileUrl}
                                      alt="slika"
                                      className="rounded-xl max-w-full mb-1 cursor-pointer hover:opacity-90 transition"
                                      style={{ maxHeight: '220px' }}
                                    />
                                  </a>
                                )}

                                {/* Fajl */}
                                {msg.fileType === 'file' && msg.fileUrl && (
                                  
                                   <a href={msg.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm transition hover:opacity-80">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                      style={{
                                        background: isMine ? 'rgba(255,255,255,0.2)' : '#FFF7ED'
                                      }}>
                                      📎
                                    </div>
                                    <span className="underline truncate max-w-40"
                                      style={{ color: isMine ? 'rgba(255,255,255,0.9)' : '#FF6B35' }}>
                                      {msg.content}
                                    </span>
                                  </a>
                                )}

                                {/* Tekst */}
                                {!msg.fileType && (
                                  <p className="text-sm leading-relaxed">{msg.content}</p>
                                )}
                              </div>

                              {/* Vrijeme */}
                              {showTime && (
                                <span className="text-xs mt-1 mx-1" style={{ color: '#AEAEB2' }}>
                                  {formatTime(msg.createdAt)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Typing indicator */}
                    {isTyping && (
                      <div className="flex justify-start items-end gap-2">
                        <div className="w-7 h-7 rounded-full flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }} />
                        <div className="px-4 py-3 rounded-2xl"
                          style={{
                            background: '#FDFCF9',
                            borderRadius: '20px 20px 20px 6px',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                          }}>
                          <div className="flex gap-1 items-center">
                            {[0, 150, 300].map(delay => (
                              <div key={delay}
                                className="w-2 h-2 rounded-full animate-bounce"
                                style={{ background: '#FF6B35', animationDelay: `${delay}ms` }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Upload error */}
                  {uploadError && (
                    <div className="mx-5 mb-2 px-4 py-2.5 rounded-xl text-sm flex items-center justify-between"
                      style={{ background: '#FFF0ED', color: '#FF3B30' }}>
                      <span>⚠️ {uploadError}</span>
                      <button onClick={() => setUploadError('')} className="ml-3 hover:opacity-70">✕</button>
                    </div>
                  )}

                  {/* Input area */}
                  <div className="px-5 py-4 flex-shrink-0"
                    style={{
                      background: '#FDFCF9',
                      borderTop: '1px solid rgba(0,0,0,0.06)',
                    }}>
                    <form onSubmit={handleSend} className="flex items-center gap-3">
                      {/* File upload */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="p-2.5 rounded-xl transition flex-shrink-0"
                        style={{
                          background: uploading ? '#F0EDE8' : '#FFF7ED',
                          color: uploading ? '#C7C7CC' : '#FF6B35',
                        }}>
                        {uploading ? (
                          <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                            style={{ borderColor: '#FF6B35', borderTopColor: 'transparent' }} />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                        )}
                      </button>

                      <input
                        value={newMessage}
                        onChange={handleTypingInput}
                        placeholder="Napiši poruku..."
                        className="flex-1 px-4 py-3 rounded-2xl text-sm focus:outline-none transition"
                        style={{
                          background: '#F0EDE8',
                          color: '#1C1C1E',
                          border: '1.5px solid transparent',
                        }}
                        onFocus={e => e.target.style.borderColor = '#FF6B35'}
                        onBlur={e => e.target.style.borderColor = 'transparent'}
                      />

                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="p-3 rounded-2xl text-white transition disabled:opacity-40 flex-shrink-0"
                        style={{
                          background: newMessage.trim()
                            ? 'linear-gradient(135deg, #FF6B35, #FFB800)'
                            : '#E5E5EA',
                        }}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                    </form>
                  </div>
                </div>

                {/* Chat Details Panel */}
                {showDetails && (
                  <ChatDetails
                    conversation={activeConversation}
                    onClose={() => setShowDetails(false)}
                    currentUser={user}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {showGroupModal && (
        <CreateGroupModal
          onClose={() => setShowGroupModal(false)}
          onCreated={handleGroupCreated}
        />
      )}
    </div>
  )
}