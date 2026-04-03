import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getActivities, markAllAsRead, markActivityAsRead } from '../api/activities'
import { respondToRequest } from '../api/connections'
import { useNotifications } from '../context/NotificationContext'

const ACTIVITY_ICONS = {
  CONNECTION_REQUEST: '🤝',
  CONNECTION_ACCEPTED: '🎉',
  BOOKING_REQUEST: '📚',
  BOOKING_CONFIRMED: '✅',
  BOOKING_CANCELLED: '❌',
  SHOP_ITEM_INTEREST: '🛍️',
  COMMUNITY_COMMENT: '💬',
  INTERNSHIP_REVIEW: '🏢',
  MATERIAL_DOWNLOAD: '📄',
  EVENT_REMINDER: '📅',
  GENERAL: '🔔',
}

const ACTIVITY_COLORS = {
  CONNECTION_REQUEST: 'bg-indigo-50 border-indigo-100',
  CONNECTION_ACCEPTED: 'bg-green-50 border-green-100',
  BOOKING_REQUEST: 'bg-purple-50 border-purple-100',
  BOOKING_CONFIRMED: 'bg-green-50 border-green-100',
  BOOKING_CANCELLED: 'bg-red-50 border-red-100',
  COMMUNITY_COMMENT: 'bg-blue-50 border-blue-100',
  INTERNSHIP_REVIEW: 'bg-amber-50 border-amber-100',
  GENERAL: 'bg-gray-50 border-gray-100',
}

export default function ActivityPanel({ onClose }) {
  const navigate = useNavigate()
  const { setPendingCount } = useNotifications()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [respondingTo, setRespondingTo] = useState(null)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getActivities()
        setActivities(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead()
      setActivities(prev => prev.map(a => ({ ...a, isRead: true })))
      setPendingCount(0)
    } catch (err) {
      console.error(err)
    }
  }

  const handleActivityClick = async (activity) => {
    if (!activity.isRead) {
      try {
        await markActivityAsRead(activity.id)
        setActivities(prev => prev.map(a =>
          a.id === activity.id ? { ...a, isRead: true } : a
        ))
        setPendingCount(prev => Math.max(0, prev - 1))
      } catch (err) {
        console.error(err)
      }
    }

    if (activity.link) {
      navigate(activity.link)
      onClose()
    }
  }

  const handleConnectionRespond = async (activity, action) => {
    setRespondingTo(activity.id)
    try {
      await respondToRequest(activity.referenceId, action)
      setActivities(prev => prev.map(a =>
        a.id === activity.id
          ? {
              ...a,
              isRead: true,
              message: action === 'accept'
                ? `✅ Prihvatili ste zahtjev od ${activity.actor?.firstName} ${activity.actor?.lastName}`
                : `❌ Odbili ste zahtjev od ${activity.actor?.firstName} ${activity.actor?.lastName}`,
              type: 'CONNECTION_ACCEPTED'
            }
          : a
      ))
      setPendingCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error(err)
    } finally {
      setRespondingTo(null)
    }
  }

  const unreadCount = activities.filter(a => !a.isRead).length

  return (
    <div className="fixed inset-0 z-40 flex" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />

      <div
        className="absolute left-64 top-0 h-full w-96 bg-white shadow-2xl flex flex-col z-50 border-r border-gray-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-semibold text-gray-800 text-lg">Aktivnosti</h2>
            {unreadCount > 0 && (
              <p className="text-xs text-indigo-500 mt-0.5">
                {unreadCount} novih obavještenja
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-indigo-500 hover:text-indigo-700 transition px-2 py-1 rounded-lg hover:bg-indigo-50"
              >
                Označi sve
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Lista aktivnosti */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Učitavanje...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-4xl mb-3">🔔</p>
              <p className="text-gray-500 font-medium">Nema aktivnosti</p>
              <p className="text-gray-400 text-sm mt-1">
                Ovdje će se pojavljivati obavještenja o zahtjevima, komentarima i rezervacijama
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {activities.map(activity => (
                <div
                  key={activity.id}
                  className={`px-5 py-4 transition-all ${
                    !activity.isRead ? 'bg-indigo-50/40' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar ili ikona */}
                    <div className="relative flex-shrink-0">
                      {activity.actor ? (
                        <div
                          className="w-10 h-10 rounded-full overflow-hidden cursor-pointer"
                          onClick={() => {
                            navigate(`/profile/${activity.actor.id}`)
                            onClose()
                          }}
                        >
                          {activity.actor.profileImage ? (
                            <img src={activity.actor.profileImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                              {activity.actor.firstName?.[0]}{activity.actor.lastName?.[0]}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                          {ACTIVITY_ICONS[activity.type] || '🔔'}
                        </div>
                      )}
                      {/* Ikona tipa aktivnosti */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white rounded-full flex items-center justify-center text-xs shadow-sm border border-gray-100">
                        {ACTIVITY_ICONS[activity.type] || '🔔'}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Poruka */}
                      <p className={`text-sm ${!activity.isRead ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>
                        {activity.message}
                      </p>

                      {/* Vrijeme */}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(activity.createdAt).toLocaleDateString('bs-BA', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>

                      {/* Akcije za connection request */}
                      {activity.type === 'CONNECTION_REQUEST' &&
                       activity.message.includes('želi postati') && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleConnectionRespond(activity, 'accept')}
                            disabled={respondingTo === activity.id}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-1.5 rounded-lg transition font-medium disabled:opacity-50 flex items-center justify-center gap-1"
                          >
                            {respondingTo === activity.id ? (
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : '✓'}
                            Prihvati
                          </button>
                          <button
                            onClick={() => handleConnectionRespond(activity, 'reject')}
                            disabled={respondingTo === activity.id}
                            className="flex-1 border border-gray-200 text-gray-500 text-xs py-1.5 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                          >
                            Odbij
                          </button>
                        </div>
                      )}

                      {/* Link dugme */}
                      {activity.link &&
                       activity.type !== 'CONNECTION_REQUEST' && (
                        <button
                          onClick={() => handleActivityClick(activity)}
                          className="mt-2 text-xs text-indigo-500 hover:text-indigo-700 transition flex items-center gap-1"
                        >
                          Pogledaj
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Unread dot */}
                    {!activity.isRead && (
                      <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}