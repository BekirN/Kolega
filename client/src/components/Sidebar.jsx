import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { searchUsers } from '../api/auth'
import { disconnectSocket } from '../services/socket'
import { useNotifications } from '../context/NotificationContext'
import { getUnreadCount } from '../api/activities'
import { getUnreadMessagesCount } from '../api/chat'
import ActivityPanel from './ActivityPanel'

const NAV_ITEMS = [
  {
    path: '/dashboard',
    label: 'Početna',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  {
    path: '/shop',
    label: 'Prodavnica',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    )
  },
  {
    path: '/housing',
    label: 'Stanovi',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  {
    path: '/companies',
    label: 'Firme & Prakse',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )
  },
  {
    path: '/tutoring',
    label: 'Instrukcije',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )
  },
  {
    path: '/materials',
    label: 'Materijali',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    path: '/jobs',
    label: 'Studentski Poslovi',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    pendingCount,
    setPendingCount,
    unreadMessagesCount,
    setUnreadMessagesCount,
  } = useNotifications()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [showActivity, setShowActivity] = useState(false)
  const searchRef = useRef(null)

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [activityRes, msgRes] = await Promise.allSettled([
          getUnreadCount(),
          getUnreadMessagesCount(),
        ])
        if (activityRes.status === 'fulfilled') {
          setPendingCount(activityRes.value.count || 0)
        }
        if (msgRes.status === 'fulfilled') {
          setUnreadMessagesCount(msgRes.value.count || 0)
        }
      } catch (err) {
        console.error(err)
      }
    }
    if (user?.id) fetchCounts()
  }, [user?.id])

  useEffect(() => {
    if (location.pathname.startsWith('/chat')) {
      setUnreadMessagesCount(0)
    }
  }, [location.pathname])

  const handleLogout = () => {
    disconnectSocket()
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard'
    return location.pathname.startsWith(path)
  }

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setSearchLoading(true)
        try {
          const results = await searchUsers(searchQuery)
          setSearchResults(results)
          setShowResults(true)
        } catch (err) {
          console.error(err)
        } finally {
          setSearchLoading(false)
        }
      } else {
        setSearchResults([])
        setShowResults(false)
      }
    }, 300)
    return () => clearTimeout(delay)
  }, [searchQuery])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      <div className="w-64 min-h-screen flex flex-col fixed left-0 top-0 z-50"
        style={{ background: '#1C1C1E' }}>

        {/* Logo */}
        <div className="px-6 py-6">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }}>
              <span className="text-white font-black text-base">K</span>
            </div>
            <div>
              <span className="text-white font-bold text-lg tracking-tight">KOLEGA</span>
              <p className="text-xs" style={{ color: '#FF6B35' }}>Student Hub</p>
            </div>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 mb-4" ref={searchRef}>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              {searchLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" style={{ color: '#666' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              placeholder="Pretraži studente..."
              className="w-full text-sm pl-9 pr-3 py-2.5 rounded-xl border-0 focus:outline-none transition"
              style={{ background: '#2C2C2E', color: '#E5E5EA' }}
            />

            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden shadow-2xl z-50 border"
                style={{ background: '#2C2C2E', borderColor: '#3A3A3C' }}>
                {searchResults.map(u => (
                  <button
                    key={u.id}
                    onClick={() => { setSearchQuery(''); setShowResults(false); navigate(`/profile/${u.id}`) }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition hover:bg-white/5"
                  >
                    <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden">
                      {u.profileImage ? (
                        <img src={u.profileImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }}>
                          {u.firstName?.[0]}{u.lastName?.[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#E5E5EA' }}>
                        {u.firstName} {u.lastName}
                      </p>
                      {u.faculty && (
                        <p className="text-xs truncate" style={{ color: '#8E8E93' }}>{u.faculty}</p>
                      )}
                    </div>
                    {u.verificationStatus === 'VERIFIED' && (
                      <span style={{ color: '#FF6B35' }} className="text-xs">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {showResults && searchResults.length === 0 && searchQuery.length >= 2 && !searchLoading && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-xl p-3 text-center z-50 border"
                style={{ background: '#2C2C2E', borderColor: '#3A3A3C' }}>
                <p className="text-sm" style={{ color: '#636366' }}>Nema rezultata</p>
              </div>
            )}
          </div>
        </div>

        {/* Nav label */}
        <p className="px-4 text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#48484A' }}>
          Navigacija
        </p>

        {/* Navigacija */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
              style={{
                background: isActive(item.path) ? 'rgba(255, 107, 53, 0.15)' : 'transparent',
                color: isActive(item.path) ? '#FF6B35' : '#8E8E93',
              }}
              onMouseEnter={e => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                  e.currentTarget.style.color = '#E5E5EA'
                }
              }}
              onMouseLeave={e => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#8E8E93'
                }
              }}
            >
              <span style={{ color: isActive(item.path) ? '#FF6B35' : 'inherit' }}>
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
              {isActive(item.path) && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: '#FF6B35' }} />
              )}
            </button>
          ))}
        </nav>

        {/* Donji dio */}
        <div className="px-3 py-4 space-y-0.5" style={{ borderTop: '1px solid #2C2C2E' }}>

          {/* Aktivnosti */}
          <button
            onClick={() => setShowActivity(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
            style={{ color: showActivity ? '#FF6B35' : '#8E8E93' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              e.currentTarget.style.color = '#E5E5EA'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = showActivity ? '#FF6B35' : '#8E8E93'
            }}
          >
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {pendingCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 text-white font-bold rounded-full flex items-center justify-center"
                  style={{ background: '#FF6B35', fontSize: '10px' }}>
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </div>
            <span className="font-medium">Aktivnosti</span>
            {pendingCount > 0 && (
              <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full text-white font-bold"
                style={{ background: '#FF6B35', fontSize: '10px' }}>
                {pendingCount}
              </span>
            )}
          </button>

          {/* Poruke */}
          <button
            onClick={() => navigate('/chat')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
            style={{
              background: isActive('/chat') ? 'rgba(255, 107, 53, 0.15)' : 'transparent',
              color: isActive('/chat') ? '#FF6B35' : '#8E8E93',
            }}
            onMouseEnter={e => {
              if (!isActive('/chat')) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                e.currentTarget.style.color = '#E5E5EA'
              }
            }}
            onMouseLeave={e => {
              if (!isActive('/chat')) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#8E8E93'
              }
            }}
          >
            <div style={{ position: 'relative' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {unreadMessagesCount > 0 && (
                <span style={{
                  position: 'absolute', top: '-6px', right: '-6px',
                  minWidth: '16px', height: '16px', borderRadius: '100px',
                  background: '#FF6B35', color: 'white',
                  fontSize: '10px', fontWeight: '800',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 4px',
                }}>
                  {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                </span>
              )}
            </div>
            <span className="font-medium">Poruke</span>
            {unreadMessagesCount > 0 && (
              <span style={{
                marginLeft: 'auto', minWidth: '20px', height: '18px',
                background: '#FF6B35', color: 'white', fontSize: '10px',
                fontWeight: '800', borderRadius: '100px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 6px',
              }}>
                {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
              </span>
            )}
          </button>
          {/* Profil ADMIN  */}
          {user.role === 'ADMIN' && (
            <button
              onClick={() => navigate('/admin')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
              style={{
                background: isActive('/admin') ? 'rgba(255,107,53,0.15)' : 'transparent',
                color: isActive('/admin') ? '#FF6B35' : '#8E8E93',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#E5E5EA' }}
              onMouseLeave={e => { e.currentTarget.style.background = isActive('/admin') ? 'rgba(255,107,53,0.15)' : 'transparent'; e.currentTarget.style.color = isActive('/admin') ? '#FF6B35' : '#8E8E93' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-medium">Admin panel</span>
            </button>
          )}
          {/* Profil + Logout  */}
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 10px', borderRadius: '14px', marginTop: '6px',
              background: '#2C2C2E', transition: 'background 0.2s',
              cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#3A3A3C'}
            onMouseLeave={e => e.currentTarget.style.background = '#2C2C2E'}
          >
            {/* Klik na avatar/ime → profil */}
            <div
              onClick={() => navigate(`/profile/${user.id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}
            >
              <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden">
                {user.profileImage ? (
                  <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }}>
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: '#E5E5EA' }}>
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs truncate" style={{ color: '#8E8E93' }}>
                  {user.faculty || 'Student'}
                </p>
              </div>
            </div>

            {/* Logout dugme – zasebno */}
            <button
              onClick={handleLogout}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: '#8E8E93', padding: '4px', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'color 0.15s, background 0.15s',
              }}
              title="Odjavi se"
              onMouseEnter={e => { e.currentTarget.style.color = '#FF3B30'; e.currentTarget.style.background = 'rgba(255,59,48,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#8E8E93'; e.currentTarget.style.background = 'transparent' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>

        </div>
      </div>

      {showActivity && <ActivityPanel onClose={() => setShowActivity(false)} />}
    </>
  )
}