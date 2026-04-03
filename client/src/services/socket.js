import { io } from 'socket.io-client'

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

  socket = io('http://localhost:5000', {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    transports: ['websocket'],
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

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
    isInitialized = false
  }
}