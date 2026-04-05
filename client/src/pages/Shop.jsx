import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getShopItems, deleteShopItem } from '../api/shop'
import { AnimatedSection, AnimatedScale, AnimatedBlur, AnimatedLine } from '../components/Animated'

const CATEGORIES = ['Sve', 'KNJIGE', 'SKRIPTA', 'ELEKTRONIKA', 'OPREMA', 'OSTALO']
const CATEGORY_LABELS = {
  KNJIGE: 'Knjige', SKRIPTA: 'Skripta',
  ELEKTRONIKA: 'Elektronika', OPREMA: 'Oprema', OSTALO: 'Ostalo'
}
const CONDITIONS = { NEW: 'Novo', LIKE_NEW: 'Kao novo', GOOD: 'Dobro', FAIR: 'Prihvatljivo' }
const CONDITION_COLORS = {
  NEW: { bg: 'rgba(22,163,74,0.1)', color: '#16A34A' },
  LIKE_NEW: { bg: 'rgba(37,99,235,0.1)', color: '#2563EB' },
  GOOD: { bg: 'rgba(255,107,53,0.1)', color: '#FF6B35' },
  FAIR: { bg: 'rgba(0,0,0,0.06)', color: '#6B7280' },
}
const CATEGORY_EMOJIS = {
  KNJIGE: '📚', SKRIPTA: '📄', ELEKTRONIKA: '💻', OPREMA: '🎒', OSTALO: '📦'
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
    <div style={{ minHeight: '100vh', background: '#EFEDE8' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1C1C1E 0%, #2C2C2E 100%)',
        padding: '40px 32px 32px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 50%, rgba(255,107,53,0.12), transparent 60%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 80%, rgba(255,184,0,0.07), transparent 50%)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <AnimatedBlur delay={0}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '32px', fontWeight: '900', color: 'white', letterSpacing: '-0.02em', marginBottom: '6px' }}>
                  Student Shop 🛍️
                </h1>
                <p style={{ color: '#8E8E93', fontSize: '15px' }}>Kupi i prodaj studentske stvari</p>
              </div>
              <button
                onClick={() => navigate('/shop/new')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 20px', borderRadius: '14px', border: 'none',
                  background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                  color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(255,107,53,0.35)',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Novi oglas
              </button>
            </div>
          </AnimatedBlur>

          <AnimatedSection delay={0.1} direction="up">
            <form onSubmit={(e) => { e.preventDefault(); fetchItems() }} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#636366' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Pretraži oglase..."
                  style={{
                    width: '100%', padding: '11px 16px 11px 40px', borderRadius: '12px',
                    background: '#2C2C2E', color: '#E5E5EA', border: '1px solid #3A3A3C',
                    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              <button type="submit" style={{
                padding: '11px 20px', borderRadius: '12px', border: 'none',
                background: '#FF6B35', color: 'white', fontSize: '14px',
                fontWeight: '600', cursor: 'pointer',
              }}>
                Traži
              </button>
            </form>
          </AnimatedSection>

          <AnimatedSection delay={0.15} direction="up">
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)} style={{
                  padding: '7px 16px', borderRadius: '100px', border: 'none', cursor: 'pointer',
                  background: category === cat ? '#FF6B35' : 'rgba(255,255,255,0.08)',
                  color: category === cat ? 'white' : '#8E8E93',
                  fontSize: '13px', fontWeight: '600', transition: 'all 0.2s',
                }}>
                  {cat === 'Sve' ? '✨ Sve' : `${CATEGORY_EMOJIS[cat]} ${CATEGORY_LABELS[cat]}`}
                </button>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </div>

      {/* Sadržaj */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              border: '2px solid #FF6B35', borderTopColor: 'transparent',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        ) : items.length === 0 ? (
          <AnimatedScale>
            <div style={{
              background: '#FDFCF9', borderRadius: '24px', padding: '64px',
              textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}>
              <p style={{ fontSize: '48px', marginBottom: '16px' }}>🛍️</p>
              <p style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '20px', marginBottom: '8px' }}>Nema oglasa</p>
              <p style={{ color: '#8E8E93', marginBottom: '24px' }}>Budi prvi koji objavljuje!</p>
              <button onClick={() => navigate('/shop/new')} style={{
                padding: '12px 28px', borderRadius: '14px', border: 'none',
                background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '14px',
              }}>
                Dodaj oglas
              </button>
            </div>
          </AnimatedScale>
        ) : (
          <>
            <AnimatedSection delay={0} direction="up">
              <p style={{ fontSize: '13px', color: '#AEAEB2', fontWeight: '600', marginBottom: '20px' }}>
                {items.length} oglasa
              </p>
            </AnimatedSection>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {items.map((item, i) => (
                <AnimatedScale key={item.id} delay={i * 0.06}>
                  <div style={{
                    background: '#FDFCF9', borderRadius: '20px', overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s',
                    cursor: 'pointer',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.12)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)' }}
                  >
                    {/* Slika */}
                    <div style={{
                      height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '48px',
                      background: 'linear-gradient(135deg, #FFF7ED, #FFF0E0)',
                    }}>
                      {CATEGORY_EMOJIS[item.category] || '📦'}
                    </div>

                    <div style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{
                          fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '100px',
                          background: '#FFF7ED', color: '#FF6B35',
                        }}>
                          {CATEGORY_EMOJIS[item.category]} {CATEGORY_LABELS[item.category]}
                        </span>
                        <span style={{
                          fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '100px',
                          background: CONDITION_COLORS[item.condition]?.bg,
                          color: CONDITION_COLORS[item.condition]?.color,
                        }}>
                          {CONDITIONS[item.condition]}
                        </span>
                      </div>

                      <p style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '15px', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </p>
                      <p style={{ color: '#8E8E93', fontSize: '13px', marginBottom: '14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.description}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontSize: '22px', fontWeight: '900', color: '#FF6B35' }}>
                          {item.price} KM
                        </span>
                        <span style={{ fontSize: '12px', color: '#AEAEB2' }}>
                          {item.seller?.firstName} · {item.seller?.faculty || 'Student'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => navigate(`/shop/${item.id}`)} style={{
                          flex: 1, padding: '9px', borderRadius: '12px', border: 'none',
                          background: '#FFF7ED', color: '#FF6B35', fontSize: '13px',
                          fontWeight: '700', cursor: 'pointer', transition: 'opacity 0.2s',
                        }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                          Pogledaj
                        </button>
                        {user.id === item.sellerId && (
                          <button onClick={() => handleDelete(item.id)} style={{
                            padding: '9px 12px', borderRadius: '12px', border: 'none',
                            background: '#FFF0F0', color: '#FF3B30', fontSize: '13px',
                            cursor: 'pointer', transition: 'opacity 0.2s',
                          }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </AnimatedScale>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}