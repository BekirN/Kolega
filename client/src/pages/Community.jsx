import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPosts, deletePost, getEvents, attendEvent } from '../api/community'

const CATEGORIES = ['Sve', 'OBAVJESTENJE', 'PITANJE', 'DISKUSIJA', 'OGLAS', 'OSTALO']
const CATEGORY_LABELS = {
  OBAVJESTENJE: 'Obavještenje', PITANJE: 'Pitanje',
  DISKUSIJA: 'Diskusija', OGLAS: 'Oglas', OSTALO: 'Ostalo'
}
const CATEGORY_COLORS = {
  OBAVJESTENJE: { bg: '#EFF6FF', color: '#2563EB' },
  PITANJE: { bg: '#F5F3FF', color: '#7C3AED' },
  DISKUSIJA: { bg: '#F0FDF4', color: '#16A34A' },
  OGLAS: { bg: '#FFF7ED', color: '#FF6B35' },
  OSTALO: { bg: '#F9FAFB', color: '#6B7280' },
}

export default function Community() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('posts')
  const [posts, setPosts] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('Sve')
  const [search, setSearch] = useState('')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const filters = {}
      if (search) filters.search = search
      if (category !== 'Sve') filters.category = category
      const data = await getPosts(filters)
      setPosts(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const data = await getEvents()
      setEvents(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'posts') fetchPosts()
    else fetchEvents()
  }, [tab, category])

  return (
    <div className="min-h-screen" style={{ background: '#F5F5F0' }}>
      <div className="px-8 pt-8 pb-6" style={{ background: 'linear-gradient(135deg, #1C1C1E, #2C2C2E)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Community 💬</h1>
            <p style={{ color: '#8E8E93' }} className="mt-1">Postovi, pitanja i eventi</p>
          </div>
          <button onClick={() => navigate('/community/new-post')}
            className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm"
            style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }}>
            + Novi post
          </button>
        </div>

        {/* Tabovi */}
        <div className="flex gap-2 mb-4">
          {['posts', 'events'].map(t => (
            <button key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2 rounded-full text-sm font-medium transition"
              style={{
                background: tab === t ? '#FF6B35' : 'rgba(255,255,255,0.08)',
                color: tab === t ? 'white' : '#8E8E93',
              }}>
              {t === 'posts' ? 'Postovi' : 'Eventi'}
            </button>
          ))}
        </div>

        {tab === 'posts' && (
          <>
            <form onSubmit={(e) => { e.preventDefault(); fetchPosts() }} className="flex gap-3 mb-3">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Pretraži postove..."
                className="flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ background: '#2C2C2E', color: '#E5E5EA', border: '1px solid #3A3A3C' }}
              />
              <button type="submit" className="px-5 py-2.5 rounded-xl text-white text-sm"
                style={{ background: '#FF6B35' }}>Traži</button>
            </form>

            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition"
                  style={{
                    background: category === cat ? '#FF6B35' : 'rgba(255,255,255,0.08)',
                    color: category === cat ? 'white' : '#8E8E93',
                  }}>
                  {cat === 'Sve' ? 'Sve' : CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-8 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#FF6B35', borderTopColor: 'transparent' }} />
          </div>
        ) : tab === 'posts' ? (
          posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">💬</p>
              <p className="text-xl font-semibold text-gray-700 mb-4">Nema postova</p>
              <button onClick={() => navigate('/community/new-post')}
                className="px-6 py-3 rounded-xl text-white font-semibold text-sm"
                style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }}>
                Napiši prvi post
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map(post => (
                <div key={post.id} className="rounded-2xl p-5 transition hover:shadow-md"
                  style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                  {post.isPinned && (
                    <span className="text-xs font-medium" style={{ color: '#FF6B35' }}>📌 Pinned</span>
                  )}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full mb-2 inline-block"
                        style={{
                          background: CATEGORY_COLORS[post.category]?.bg,
                          color: CATEGORY_COLORS[post.category]?.color,
                        }}>
                        {CATEGORY_LABELS[post.category]}
                      </span>
                      <h3 onClick={() => navigate(`/community/${post.id}`)}
                        className="font-bold text-gray-900 cursor-pointer hover:opacity-70 transition mt-1">
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{post.content}</p>
                    </div>
                    {user.id === post.authorId && (
                      <button onClick={async () => { await deletePost(post.id); setPosts(p => p.filter(x => x.id !== post.id)) }}
                        className="p-1.5 rounded-lg ml-3 transition hover:bg-red-50"
                        style={{ color: '#FF3B30' }}>✕</button>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid #F5F5F0' }}>
                    <span className="text-xs text-gray-400">
                      {post.author?.firstName} {post.author?.lastName}
                      {post.author?.faculty && ` · ${post.author.faculty}`}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>💬 {post._count?.comments || 0}</span>
                      <span>{new Date(post.createdAt).toLocaleDateString('bs-BA')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          events.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">📅</p>
              <p className="text-xl font-semibold text-gray-700">Nema nadolazećih evenata</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map(event => (
                <div key={event.id} className="rounded-2xl p-5"
                  style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{event.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                        <span>📅 {new Date(event.eventDate).toLocaleString('bs-BA')}</span>
                        {event.location && <span>📍 {event.location}</span>}
                        {event.isOnline && <span style={{ color: '#16A34A' }}>🌐 Online</span>}
                      </div>
                    </div>
                    <button onClick={async () => { await attendEvent(event.id); fetchEvents() }}
                      className="px-4 py-2 rounded-xl text-white text-sm font-medium"
                      style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }}>
                      Prijavi se
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{event.description}</p>
                  <span className="text-xs text-gray-400">
                    👥 {event._count?.attendees || 0} prijavljenih
                    {event.maxAttendees && ` / ${event.maxAttendees} mjesta`}
                  </span>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}