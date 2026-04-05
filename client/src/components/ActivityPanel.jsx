import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getActivities, markAllAsRead, markActivityAsRead } from '../api/activities'
import { respondToRequest, getPendingRequests } from '../api/connections'
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

export default function ActivityPanel({ onClose }) {
  const navigate = useNavigate()
  const { setPendingCount } = useNotifications()
  const [activities, setActivities] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [respondingTo, setRespondingTo] = useState(null)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [acts, pending] = await Promise.all([
          getActivities(),
          getPendingRequests(),
        ])
        setActivities(acts)
        setPendingRequests(pending)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
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

  const handleConnectionRespond = async (connectionId, action) => {
    console.log('Responding to connection:', { connectionId, action })
    console.log('Pending requests:', pendingRequests)
    setRespondingTo(connectionId)
    try {
      await respondToRequest(connectionId, action)

      // Ukloni iz pending liste
      setPendingRequests(prev => prev.filter(r => r.id !== connectionId))

      // Ažuriraj aktivnosti – traži po referenceId ILI ako je connectionId
      setActivities(prev => prev.map(a => {
        // Provjeri i referenceId i ako je CONNECTION_REQUEST tip
        if (a.referenceId === connectionId ||
            (a.type === 'CONNECTION_REQUEST' &&
            pendingRequests.find(r => r.id === connectionId)?.sender?.id === a.actor?.id)) {
          return {
            ...a,
            isRead: true,
            type: action === 'accept' ? 'CONNECTION_ACCEPTED' : 'GENERAL',
            message: action === 'accept'
              ? `✅ Prihvatili ste zahtjev – sada ste kolege!`
              : `❌ Odbili ste zahtjev`,
          }
        }
        return a
      }))

      setPendingCount(prev => Math.max(0, prev - 1))

      // Emituj event
      window.dispatchEvent(new CustomEvent('connection-updated'))

    } catch (err) {
      console.error('Greška respond:', err.response?.data || err.message)
      alert(err.response?.data?.message || 'Greška pri odgovoru na zahtjev')
    } finally {
      setRespondingTo(null)
    }
  }

  const unreadCount = activities.filter(a => !a.isRead).length

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 40, display: 'flex',
      }}
      onClick={onClose}
    >
      {/* Overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(2px)',
      }} />

      {/* Panel */}
      <div
        style={{
          position: 'absolute',
          left: '256px',
          top: 0,
          height: '100%',
          width: '380px',
          background: '#1C1C1E',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          borderRight: '1px solid #2C2C2E',
          animation: 'slideInPanel 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`
          @keyframes slideInPanel {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}</style>

        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #2C2C2E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontWeight: '900', color: 'white', fontSize: '18px', marginBottom: '3px' }}>
              Aktivnosti
            </h2>
            {unreadCount > 0 && (
              <p style={{ fontSize: '12px', color: '#FF6B35', fontWeight: '600' }}>
                {unreadCount} novih obavještenja
              </p>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  fontSize: '12px', color: '#FF6B35', background: 'rgba(255,107,53,0.1)',
                  border: 'none', cursor: 'pointer', padding: '6px 12px',
                  borderRadius: '8px', fontWeight: '600', transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Označi sve
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: '#2C2C2E', border: 'none', cursor: 'pointer',
                color: '#8E8E93', fontSize: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#3A3A3C'}
              onMouseLeave={e => e.currentTarget.style.background = '#2C2C2E'}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Pending zahtjevi – sekcija na vrhu */}
        {pendingRequests.length > 0 && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #2C2C2E', flexShrink: 0 }}>
            <p style={{
              fontSize: '10px', fontWeight: '700', color: '#FF6B35',
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px',
            }}>
              🤝 Zahtjevi za kolegu ({pendingRequests.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pendingRequests.map(req => (
                <div key={req.id} style={{
                  background: '#2C2C2E', borderRadius: '14px', padding: '12px',
                  border: '1px solid rgba(255,107,53,0.2)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                    }}>
                      {req.sender?.profileImage ? (
                        <img src={req.sender.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{
                          width: '100%', height: '100%',
                          background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: '700', fontSize: '13px',
                        }}>
                          {req.sender?.firstName?.[0]}{req.sender?.lastName?.[0]}
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: '700', color: '#E5E5EA', fontSize: '14px' }}>
                        {req.sender?.firstName} {req.sender?.lastName}
                      </p>
                      {req.sender?.faculty && (
                        <p style={{ fontSize: '12px', color: '#636366', marginTop: '1px' }}>
                          {req.sender.faculty}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => { navigate(`/profile/${req.sender?.id}`); onClose() }}
                      style={{
                        fontSize: '11px', color: '#8E8E93', background: 'transparent',
                        border: 'none', cursor: 'pointer', padding: '4px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      Profil
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleConnectionRespond(req.id, 'accept')}
                      disabled={respondingTo === req.id}
                      style={{
                        flex: 1, padding: '8px', borderRadius: '10px', border: 'none',
                        background: respondingTo === req.id
                          ? '#3A3A3C'
                          : 'linear-gradient(135deg, #FF6B35, #FFB800)',
                        color: 'white', fontSize: '13px', fontWeight: '700',
                        cursor: respondingTo === req.id ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={e => { if (respondingTo !== req.id) e.currentTarget.style.opacity = '0.9' }}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      {respondingTo === req.id ? (
                        <div style={{
                          width: '12px', height: '12px', borderRadius: '50%',
                          border: '2px solid white', borderTopColor: 'transparent',
                          animation: 'spin 0.8s linear infinite',
                        }} />
                      ) : '✓'} Prihvati
                    </button>
                    <button
                      onClick={() => handleConnectionRespond(req.id, 'reject')}
                      disabled={respondingTo === req.id}
                      style={{
                        flex: 1, padding: '8px', borderRadius: '10px', border: 'none',
                        background: '#3A3A3C', color: '#8E8E93',
                        fontSize: '13px', fontWeight: '700',
                        cursor: respondingTo === req.id ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { if (respondingTo !== req.id) { e.currentTarget.style.background = 'rgba(255,59,48,0.15)'; e.currentTarget.style.color = '#FF3B30' } }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#3A3A3C'; e.currentTarget.style.color = '#8E8E93' }}
                    >
                      ✕ Odbij
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista aktivnosti */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', gap: '12px' }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%',
                border: '2px solid #FF6B35', borderTopColor: 'transparent',
                animation: 'spin 0.8s linear infinite',
              }} />
              <p style={{ color: '#636366', fontSize: '13px' }}>Učitavanje...</p>
            </div>
          ) : activities.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <p style={{ fontSize: '36px', marginBottom: '12px' }}>🔔</p>
              <p style={{ fontWeight: '700', color: '#636366', fontSize: '15px', marginBottom: '6px' }}>
                Nema aktivnosti
              </p>
              <p style={{ color: '#48484A', fontSize: '13px' }}>
                Ovdje će se pojaviti zahtjevi, komentari i rezervacije
              </p>
            </div>
          ) : (
            <div>
              {activities.map(activity => (
                <div
                  key={activity.id}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid #2C2C2E',
                    background: !activity.isRead ? 'rgba(255,107,53,0.05)' : 'transparent',
                    transition: 'background 0.15s',
                    cursor: activity.link ? 'pointer' : 'default',
                  }}
                  onMouseEnter={e => { if (activity.link) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                  onMouseLeave={e => e.currentTarget.style.background = !activity.isRead ? 'rgba(255,107,53,0.05)' : 'transparent'}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    {/* Avatar ili ikona */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      {activity.actor ? (
                        <div
                          style={{
                            width: '38px', height: '38px', borderRadius: '50%',
                            overflow: 'hidden', cursor: 'pointer',
                          }}
                          onClick={() => { navigate(`/profile/${activity.actor.id}`); onClose() }}
                        >
                          {activity.actor.profileImage ? (
                            <img src={activity.actor.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{
                              width: '100%', height: '100%',
                              background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'white', fontWeight: '700', fontSize: '13px',
                            }}>
                              {activity.actor.firstName?.[0]}{activity.actor.lastName?.[0]}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{
                          width: '38px', height: '38px', borderRadius: '50%',
                          background: '#2C2C2E',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '18px',
                        }}>
                          {ACTIVITY_ICONS[activity.type] || '🔔'}
                        </div>
                      )}
                      {/* Type badge */}
                      <div style={{
                        position: 'absolute', bottom: '-2px', right: '-2px',
                        width: '16px', height: '16px', borderRadius: '50%',
                        background: '#1C1C1E', border: '1.5px solid #2C2C2E',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '9px',
                      }}>
                        {ACTIVITY_ICONS[activity.type] || '🔔'}
                      </div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: '13px', lineHeight: '1.4',
                        color: !activity.isRead ? '#E5E5EA' : '#8E8E93',
                        fontWeight: !activity.isRead ? '600' : '400',
                        marginBottom: '4px',
                      }}>
                        {activity.message}
                      </p>
                      <p style={{ fontSize: '11px', color: '#48484A' }}>
                        {new Date(activity.createdAt).toLocaleDateString('bs-BA', {
                          day: 'numeric', month: 'short',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>

                      {/* Link dugme */}
                      {activity.link && activity.type !== 'CONNECTION_REQUEST' && (
                        <button
                          onClick={() => handleActivityClick(activity)}
                          style={{
                            marginTop: '6px', fontSize: '12px', color: '#FF6B35',
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            padding: 0, display: 'flex', alignItems: 'center', gap: '4px',
                            fontWeight: '600',
                          }}>
                          Pogledaj →
                        </button>
                      )}
                    </div>

                    {/* Unread dot */}
                    {!activity.isRead && (
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: '#FF6B35', flexShrink: 0, marginTop: '4px',
                      }} />
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