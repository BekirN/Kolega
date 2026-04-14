import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getShopItemById, deleteShopItem } from '../api/shop'
import { AnimatedSection, AnimatedScale, AnimatedBlur } from '../components/Animated'

const CONDITIONS = {
  NEW: { label: 'Novo', color: '#16A34A', bg: 'rgba(22,163,74,0.1)' },
  LIKE_NEW: { label: 'Kao novo', color: '#0EA5E9', bg: 'rgba(14,165,233,0.1)' },
  GOOD: { label: 'Dobro', color: '#FFB800', bg: 'rgba(255,184,0,0.1)' },
  FAIR: { label: 'Prihvatljivo', color: '#FF6B35', bg: 'rgba(255,107,53,0.1)' },
}

const CATEGORY_LABELS = {
  KNJIGE: '📚 Knjige',
  SKRIPTA: '📄 Skripta',
  ELEKTRONIKA: '💻 Elektronika',
  OPREMA: '🎒 Oprema',
  OSTALO: '📦 Ostalo',
}

export default function ShopItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const data = await getShopItemById(id)
        setItem(data)
      } catch (err) {
        console.error(err)
        navigate('/shop')
      } finally {
        setLoading(false)
      }
    }
    fetchItem()
  }, [id, navigate])

  const handleDelete = async () => {
    if (!confirm('Jesi li siguran da želiš obrisati oglas?')) return
    setDeleting(true)
    try {
      await deleteShopItem(id)
      navigate('/shop')
    } catch (err) {
      console.error(err)
      setDeleting(false)
    }
  }

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#E2DDD6',
    }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%',
        border: '2px solid #FF6B35', borderTopColor: 'transparent',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!item) return null

  const cond = CONDITIONS[item.condition]
  const isOwner = user.id === item.sellerId
  const images = item.images?.length > 0 ? item.images : null

  return (
    <div style={{ minHeight: '100vh', background: '#E2DDD6' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1C1C1E 0%, #2C1A10 60%, #1C1C1E 100%)',
        padding: '28px 40px 40px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 50%, rgba(255,107,53,0.15), transparent 55%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 80%, rgba(255,184,0,0.08), transparent 50%)' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '860px', margin: '0 auto' }}>
          <AnimatedBlur delay={0}>
            <button
              onClick={() => navigate('/shop')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'none', border: 'none', color: '#8E8E93',
                fontSize: '14px', cursor: 'pointer', marginBottom: '20px', padding: 0,
              }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Nazad na Shop
            </button>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                {/* Badges */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  <span style={{
                    fontSize: '12px', fontWeight: '700', padding: '4px 12px', borderRadius: '100px',
                    background: 'rgba(255,107,53,0.15)', color: '#FF6B35',
                    border: '1px solid rgba(255,107,53,0.3)',
                  }}>
                    {CATEGORY_LABELS[item.category]}
                  </span>
                  <span style={{
                    fontSize: '12px', fontWeight: '700', padding: '4px 12px', borderRadius: '100px',
                    background: cond.bg, color: cond.color,
                    border: `1px solid ${cond.color}40`,
                  }}>
                    ✦ {cond.label}
                  </span>
                  {!item.isAvailable && (
                    <span style={{
                      fontSize: '12px', fontWeight: '700', padding: '4px 12px', borderRadius: '100px',
                      background: 'rgba(255,59,48,0.15)', color: '#FF3B30',
                      border: '1px solid rgba(255,59,48,0.3)',
                    }}>
                      ✕ Prodano
                    </span>
                  )}
                </div>

                <h1 style={{
                  fontSize: '26px', fontWeight: '900', color: 'white',
                  letterSpacing: '-0.02em', marginBottom: '8px', maxWidth: '500px',
                }}>
                  {item.title}
                </h1>
                <p style={{ color: '#8E8E93', fontSize: '13px' }}>
                  Objavljeno {new Date(item.createdAt).toLocaleDateString('bs-BA', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

              {/* Cijena */}
              <div style={{
                background: 'rgba(255,255,255,0.08)', borderRadius: '18px',
                padding: '16px 28px', textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(8px)', flexShrink: 0,
              }}>
                <p style={{ color: '#8E8E93', fontSize: '12px', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Cijena
                </p>
                <p style={{
                  fontSize: '36px', fontWeight: '900', lineHeight: 1,
                  background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  {item.price} KM
                </p>
              </div>
            </div>
          </AnimatedBlur>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '28px 32px 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>

          {/* Lijeva kolona */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Slike */}
            {images && (
              <AnimatedSection delay={0.05} direction="up">
                <div style={{
                  background: '#EEEBE5', borderRadius: '20px', overflow: 'hidden',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(0,0,0,0.05)',
                }}>
                  {/* Glavna slika */}
                  <div style={{ height: '300px', overflow: 'hidden', position: 'relative' }}>
                    <img
                      src={images[activeImg]}
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={() => setActiveImg(prev => (prev - 1 + images.length) % images.length)}
                          style={{
                            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                            width: '32px', height: '32px', borderRadius: '50%', border: 'none',
                            background: 'rgba(0,0,0,0.5)', color: 'white', cursor: 'pointer', fontSize: '18px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>‹</button>
                        <button
                          onClick={() => setActiveImg(prev => (prev + 1) % images.length)}
                          style={{
                            position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                            width: '32px', height: '32px', borderRadius: '50%', border: 'none',
                            background: 'rgba(0,0,0,0.5)', color: 'white', cursor: 'pointer', fontSize: '18px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>›</button>
                      </>
                    )}
                  </div>
                  {/* Thumbnails */}
                  {images.length > 1 && (
                    <div style={{ display: 'flex', gap: '6px', padding: '8px' }}>
                      {images.map((img, i) => (
                        <div
                          key={i}
                          onClick={() => setActiveImg(i)}
                          style={{
                            width: '56px', height: '44px', borderRadius: '8px', overflow: 'hidden',
                            cursor: 'pointer', flexShrink: 0,
                            outline: i === activeImg ? '2px solid #FF6B35' : 'none',
                            outlineOffset: '1px', opacity: i === activeImg ? 1 : 0.6,
                            transition: 'all 0.2s',
                          }}>
                          <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </AnimatedSection>
            )}

            {/* Placeholder ako nema slike */}
            {!images && (
              <AnimatedSection delay={0.05} direction="up">
                <div style={{
                  background: '#EEEBE5', borderRadius: '20px', height: '200px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(0,0,0,0.05)',
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '48px', marginBottom: '8px' }}>
                      {item.category === 'KNJIGE' ? '📚' : item.category === 'ELEKTRONIKA' ? '💻' : '📦'}
                    </p>
                    <p style={{ color: '#AEAEB2', fontSize: '13px' }}>Nema slike</p>
                  </div>
                </div>
              </AnimatedSection>
            )}

            {/* Opis */}
            {item.description && (
              <AnimatedSection delay={0.1} direction="up">
                <div style={{
                  background: '#EEEBE5', borderRadius: '20px', padding: '22px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(0,0,0,0.05)',
                }}>
                  <h3 style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '15px', marginBottom: '12px' }}>
                    Opis oglasa
                  </h3>
                  <p style={{ color: '#3A3A3C', fontSize: '14px', lineHeight: '1.65', whiteSpace: 'pre-wrap' }}>
                    {item.description}
                  </p>
                </div>
              </AnimatedSection>
            )}

            {/* Owner akcije */}
            {isOwner && (
              <AnimatedSection delay={0.15} direction="up">
                <div style={{
                  background: '#EEEBE5', borderRadius: '20px', padding: '20px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(0,0,0,0.05)',
                }}>
                  <p style={{
                    fontSize: '11px', fontWeight: '700', color: '#AEAEB2',
                    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px',
                  }}>
                    Upravljanje oglasom
                  </p>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{
                      width: '100%', padding: '12px', borderRadius: '14px', border: 'none',
                      background: 'rgba(255,59,48,0.08)', color: '#FF3B30',
                      fontSize: '14px', fontWeight: '700', cursor: deleting ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      transition: 'background 0.2s',
                      opacity: deleting ? 0.6 : 1,
                    }}
                    onMouseEnter={e => { if (!deleting) e.currentTarget.style.background = 'rgba(255,59,48,0.15)' }}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,59,48,0.08)'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {deleting ? 'Brisanje...' : 'Obriši oglas'}
                  </button>
                </div>
              </AnimatedSection>
            )}
          </div>

          {/* Desna kolona */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Detalji */}
            <AnimatedScale delay={0.05}>
              <div style={{
                background: '#EEEBE5', borderRadius: '20px', padding: '20px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.05)',
              }}>
                <p style={{
                  fontSize: '11px', fontWeight: '700', color: '#AEAEB2',
                  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px',
                }}>
                  Detalji
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'Kategorija', value: CATEGORY_LABELS[item.category] },
                    { label: 'Stanje', value: cond.label },
                    { label: 'Status', value: item.isAvailable ? '✓ Dostupno' : '✕ Prodano' },
                    { label: 'Datum', value: new Date(item.createdAt).toLocaleDateString('bs-BA') },
                  ].map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>{d.label}</span>
                      <span style={{
                        fontSize: '13px', fontWeight: '700',
                        color: d.label === 'Status'
                          ? (item.isAvailable ? '#16A34A' : '#FF3B30')
                          : '#1C1C1E',
                      }}>
                        {d.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedScale>

            {/* Prodavac */}
            <AnimatedScale delay={0.1}>
              <div style={{
                background: '#EEEBE5', borderRadius: '20px', padding: '20px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.05)',
              }}>
                <p style={{
                  fontSize: '11px', fontWeight: '700', color: '#AEAEB2',
                  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px',
                }}>
                  Prodavac
                </p>

                <div
                  onClick={() => navigate(`/profile/${item.sellerId}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    marginBottom: '14px', cursor: 'pointer',
                    padding: '10px', borderRadius: '12px', transition: 'background 0.15s',
                    margin: '0 -10px 14px',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#E2DDD6'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '14px',
                    overflow: 'hidden', flexShrink: 0,
                  }}>
                    {item.seller?.profileImage ? (
                      <img src={item.seller.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%',
                        background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: '800', fontSize: '16px',
                      }}>
                        {item.seller?.firstName?.[0]}{item.seller?.lastName?.[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <p style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '14px', marginBottom: '2px' }}>
                      {item.seller?.firstName} {item.seller?.lastName}
                    </p>
                    {item.seller?.faculty && (
                      <p style={{ color: '#8E8E93', fontSize: '12px' }}>{item.seller.faculty}</p>
                    )}
                  </div>
                </div>

                {/* Kontakt dugmad */}
                {!isOwner && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    
                    <a  href={`mailto:${item.seller?.email}`}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        padding: '12px', borderRadius: '14px',
                        background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                        color: 'white', fontSize: '14px', fontWeight: '800',
                        textDecoration: 'none',
                        boxShadow: '0 4px 16px rgba(255,107,53,0.3)',
                      }}>
                      ✉️ Kontaktiraj prodavca
                    </a>
                    <button
                      onClick={() => navigate(`/chat/${item.sellerId}`)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        padding: '12px', borderRadius: '14px', border: 'none',
                        background: '#F5F2ED', color: '#1C1C1E',
                        fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                        border: '1.5px solid rgba(0,0,0,0.08)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#EEEBE5'}
                      onMouseLeave={e => e.currentTarget.style.background = '#F5F2ED'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Pošalji poruku
                    </button>
                  </div>
                )}

                {isOwner && (
                  <div style={{
                    padding: '10px 14px', borderRadius: '12px',
                    background: 'rgba(255,107,53,0.08)',
                    border: '1px solid rgba(255,107,53,0.15)',
                  }}>
                    <p style={{ fontSize: '12px', color: '#FF6B35', fontWeight: '600', textAlign: 'center' }}>
                      👤 Ovo je tvoj oglas
                    </p>
                  </div>
                )}
              </div>
            </AnimatedScale>

            {/* Info box */}
            <AnimatedScale delay={0.15}>
              <div style={{
                background: 'rgba(255,107,53,0.06)', borderRadius: '16px', padding: '16px',
                border: '1px solid rgba(255,107,53,0.15)',
              }}>
                <p style={{ fontSize: '12px', color: '#FF6B35', fontWeight: '700', marginBottom: '8px' }}>
                  💡 Savjet pri kupovini
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {[
                    '🤝 Dogovorite lično preuzimanje',
                    '🔍 Pregledajte stanje predmeta',
                    '💬 Pitajte prodavca za detalje',
                  ].map((tip, i) => (
                    <p key={i} style={{ fontSize: '12px', color: '#7A7570', lineHeight: '1.4' }}>
                      {tip}
                    </p>
                  ))}
                </div>
              </div>
            </AnimatedScale>
          </div>
        </div>
      </div>
    </div>
  )
}