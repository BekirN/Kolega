import { io } from 'socket.io-client'

// Socket URL se izvlaci iz VITE_API_URL (bez /api), da radi i s telefona/deploya
const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')

let socket = null
let isInitialized = false

export const initSocket = () => {
  if (isInitialized && socket) return socket

  const token = localStorage.getItem('token')
  if (!token) return null

  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
  }

  socket = io(SOCKET_URL, {
    auth: (cb) => cb({ token: localStorage.getItem('token') }),
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 5000,
    transports: ['websocket', 'polling'],
  })

  socket.on('connect', () => {
    console.log('Socket spojen:', socket.id)
  })

  socket.on('disconnect', (reason) => {
    console.log('Socket odspojen:', reason)
    if (reason === 'io server disconnect') {
      socket.connect()
    }
  })

  socket.on('connect_error', (err) => {
    console.error('Socket greška:', err.message)
  })

  isInitialized = true
  return socket
}

export const getSocket = () => {
  if (!socket || !isInitialized) {
    return initSocket()
  }
  return socket
}

// Kad se laptop probudi ili se tab vrati u fokus, ne cekaj backoff - spoji odmah
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && socket && !socket.connected) {
      socket.connect()
    }
  })
}

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
    isInitialized = false
  }
}