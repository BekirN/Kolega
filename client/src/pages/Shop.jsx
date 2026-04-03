import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getShopItems, deleteShopItem } from '../api/shop'
import { AnimatedSection, AnimatedList, AnimatedBlur, AnimatedScale, AnimatedLine } from '../components/Animated'

const CATEGORIES = ['Sve', 'KNJIGE', 'SKRIPTA', 'ELEKTRONIKA', 'OPREMA', 'OSTALO']
const CATEGORY_LABELS = {
  KNJIGE: 'Knjige', SKRIPTA: 'Skripta',
  ELEKTRONIKA: 'Elektronika', OPREMA: 'Oprema', OSTALO: 'Ostalo'
}
const CONDITIONS = { NEW: 'Novo', LIKE_NEW: 'Kao novo', GOOD: 'Dobro', FAIR: 'Prihvatljivo' }

const CONDITION_COLORS = {
  NEW: { bg: '#F0FDF4', color: '#16A34A' },
  LIKE_NEW: { bg: '#EFF6FF', color: '#2563EB' },
  GOOD: { bg: '#FFF7ED', color: '#EA580C' },
  FAIR: { bg: '#F9FAFB', color: '#6B7280' },
}

export default function Shop() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Sve')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const fetchItems = async () => {
    setLoading(true)
    try {
      const filters = {}
      if (search) filters.search = search
      if (category !== 'Sve') filters.category = category
      const data = await getShopItems(filters)
      setItems(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [category])

  const handleDelete = async (id) => {
    if (!confirm('Obrisati oglas?')) return
    try {
      await deleteShopItem(id)
      setItems(items.filter(i => i.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#F5F5F0' }}>

      {/* Header */}
      <div className="px-8 pt-8 pb-6" style={{ background: 'linear-gradient(135deg, #1C1C1E, #2C2C2E)' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <AnimatedBlur delay={0}>
              <h1 className="text-3xl font-bold text-white">Student Shop 🛍️</h1>
              <p style={{ color: '#8E8E93' }} className="mt-1">Kupi i prodaj studentske stvari</p>
            </AnimatedBlur>
          </div>
          <button
            onClick={() => navigate('/shop/new')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Novi oglas
          </button>
        </div>

        {/* Search */}
        <form onSubmit={(e) => { e.preventDefault(); fetchItems() }} className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8E8E93' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pretraži oglase..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{ background: '#2C2C2E', color: '#E5E5EA', border: '1px solid #3A3A3C' }}
            />
          </div>
          <button type="submit" className="px-5 py-2.5 rounded-xl text-white text-sm font-medium"
            style={{ background: '#FF6B35' }}>
            Traži
          </button>
        </form>

        {/* Kategorije */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition"
              style={{
                background: category === cat ? '#FF6B35' : 'rgba(255,255,255,0.08)',
                color: category === cat ? 'white' : '#8E8E93',
              }}
            >
              {cat === 'Sve' ? 'Sve' : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Sadržaj */}
      <div className="max-w-6xl mx-auto px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#FF6B35', borderTopColor: 'transparent' }} />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🛍️</p>
            <p className="text-xl font-semibold text-gray-700 mb-2">Nema oglasa</p>
            <p className="text-gray-400 mb-6">Budi prvi koji objavljuje!</p>
            <button onClick={() => navigate('/shop/new')}
              className="px-6 py-3 rounded-xl text-white font-semibold text-sm"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }}>
              Dodaj oglas
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(item => (
              <div key={item.id} className="rounded-2xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg"
                style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>

                {/* Slika placeholder */}
                <div className="h-40 flex items-center justify-center text-5xl"
                  style={{ background: 'linear-gradient(135deg, #FFF7ED, #FFF0E0)' }}>
                  {item.category === 'KNJIGE' ? '📚'
                    : item.category === 'ELEKTRONIKA' ? '💻'
                    : item.category === 'SKRIPTA' ? '📄'
                    : item.category === 'OPREMA' ? '🎒' : '📦'}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ background: '#FFF7ED', color: '#FF6B35' }}>
                      {CATEGORY_LABELS[item.category]}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        background: CONDITION_COLORS[item.condition]?.bg,
                        color: CONDITION_COLORS[item.condition]?.color
                      }}>
                      {CONDITIONS[item.condition]}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{item.title}</h3>
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">{item.description}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black" style={{ color: '#FF6B35' }}>
                      {item.price} KM
                    </span>
                    <span className="text-xs text-gray-400">
                      {item.seller?.firstName} · {item.seller?.faculty || 'Student'}
                    </span>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => navigate(`/shop/${item.id}`)}
                      className="flex-1 py-2 rounded-xl text-sm font-medium transition hover:opacity-90"
                      style={{ background: '#FFF7ED', color: '#FF6B35' }}>
                      Pogledaj
                    </button>
                    {user.id === item.sellerId && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="px-3 py-2 rounded-xl text-sm transition hover:opacity-80"
                        style={{ background: '#FFF0F0', color: '#FF3B30' }}>
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}