import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createShopItem } from '../api/shop'
import { AnimatedSection, AnimatedScale, AnimatedBlur } from '../components/Animated'

const CONDITIONS = [
  { value: 'NEW', label: '✨ Novo', desc: 'Nekorišteno' },
  { value: 'LIKE_NEW', label: '⭐ Kao novo', desc: 'Jedva korišteno' },
  { value: 'GOOD', label: '👍 Dobro', desc: 'Malo tragova' },
  { value: 'FAIR', label: '🔧 Prihvatljivo', desc: 'Vidljivi tragovi' },
]

const CATEGORIES = [
  { value: 'KNJIGE', label: '📚 Knjige' },
  { value: 'SKRIPTA', label: '📄 Skripta' },
  { value: 'ELEKTRONIKA', label: '💻 Elektronika' },
  { value: 'OPREMA', label: '🎒 Oprema' },
  { value: 'OSTALO', label: '📦 Ostalo' },
]

export default function NewShopItem() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    title: '', description: '', price: '', condition: '', category: ''
  })
  const [images, setImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const inputStyle = {
    background: '#EEEBE5', border: '1.5px solid #D8D4CC', color: '#1C1C1E',
    borderRadius: '12px', padding: '11px 14px', fontSize: '14px', width: '100%',
    outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box',
    fontFamily: 'inherit',
  }

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length + images.length > 5) {
      setError('Maksimalno 5 slika')
      return
    }
    setImages(prev => [...prev, ...files])
    const previews = files.map(f => URL.createObjectURL(f))
    setImagePreviews(prev => [...prev, ...previews])
    setError('')
  }

  const removeImage = (i) => {
    setImages(prev => prev.filter((_, idx) => idx !== i))
    setImagePreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.category) { setError('Odaberi kategoriju'); return }
    if (!formData.condition) { setError('Odaberi stanje'); return }
    setLoading(true)
    setError('')
    try {
      await createShopItem({ ...formData, images })
      navigate('/shop')
    } catch (err) {
      setError(err.response?.data?.message || 'Greška pri kreiranju oglasa')
    } finally {
      setLoading(false)
    }
  }

  const isValid = formData.title && formData.price && formData.category && formData.condition

  return (
    <div style={{ minHeight: '100vh', background: '#E2DDD6' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1C1C1E 0%, #2C1A10 60%, #1C1C1E 100%)',
        padding: '28px 40px 48px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 75% 50%, rgba(255,107,53,0.15), transparent 55%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 80%, rgba(255,184,0,0.08), transparent 50%)' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px', margin: '0 auto' }}>
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', boxShadow: '0 8px 24px rgba(255,107,53,0.3)',
              }}>🛍️</div>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: '900', color: 'white', letterSpacing: '-0.02em', marginBottom: '4px' }}>
                  Novi oglas
                </h1>
                <p style={{ color: '#8E8E93', fontSize: '14px' }}>
                  Prodaj knjige, opremu i više
                </p>
              </div>
            </div>
          </AnimatedBlur>
        </div>
      </div>

      {/* Form */}
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '28px 32px 48px' }}>
        <AnimatedScale delay={0.05}>
          <div style={{
            background: '#EEEBE5', borderRadius: '24px', padding: '28px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.05)',
          }}>

            {error && (
              <div style={{
                padding: '12px 16px', borderRadius: '12px', marginBottom: '20px',
                background: 'rgba(255,59,48,0.1)', color: '#FF3B30',
                fontSize: '13px', border: '1px solid rgba(255,59,48,0.2)',
              }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Upload slika */}
              <AnimatedSection delay={0.1} direction="up">
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '10px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Slike (max 5)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                    {imagePreviews.map((src, i) => (
                      <div key={i} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '1' }}>
                        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          style={{
                            position: 'absolute', top: '4px', right: '4px',
                            width: '20px', height: '20px', borderRadius: '50%', border: 'none',
                            background: 'rgba(0,0,0,0.6)', color: 'white', cursor: 'pointer',
                            fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>✕</button>
                      </div>
                    ))}
                    {imagePreviews.length < 5 && (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          borderRadius: '12px', aspectRatio: '1',
                          border: '2px dashed #D8D4CC', cursor: 'pointer',
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center', gap: '4px',
                          background: '#F5F2ED', transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#FF6B35'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#D8D4CC'}
                      >
                        <span style={{ fontSize: '20px' }}>📷</span>
                        <span style={{ fontSize: '10px', color: '#AEAEB2', fontWeight: '600' }}>Dodaj</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                  />
                  <p style={{ fontSize: '12px', color: '#AEAEB2', marginTop: '8px' }}>
                    💡 Oglas sa slikom dobija 3× više pregleda
                  </p>
                </div>
              </AnimatedSection>

              {/* Naziv */}
              <AnimatedSection delay={0.12} direction="up">
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Naziv *
                  </label>
                  <input
                    style={inputStyle}
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="npr. Matematička analiza 1"
                    onFocus={e => e.target.style.borderColor = '#FF6B35'}
                    onBlur={e => e.target.style.borderColor = '#D8D4CC'}
                  />
                </div>
              </AnimatedSection>

              {/* Opis */}
              <AnimatedSection delay={0.14} direction="up">
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Opis
                  </label>
                  <textarea
                    style={{ ...inputStyle, resize: 'none', height: '100px' }}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Opiši predmet, stanje, razlog prodaje..."
                    onFocus={e => e.target.style.borderColor = '#FF6B35'}
                    onBlur={e => e.target.style.borderColor = '#D8D4CC'}
                  />
                </div>
              </AnimatedSection>

              {/* Cijena */}
              <AnimatedSection delay={0.16} direction="up">
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Cijena (KM) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      style={{ ...inputStyle, paddingRight: '52px' }}
                      type="number"
                      min="0"
                      step="0.50"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: e.target.value })}
                      required
                      placeholder="15.00"
                      onFocus={e => e.target.style.borderColor = '#FF6B35'}
                      onBlur={e => e.target.style.borderColor = '#D8D4CC'}
                    />
                    <span style={{
                      position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                      fontSize: '13px', fontWeight: '700', color: '#AEAEB2',
                    }}>KM</span>
                  </div>
                </div>
              </AnimatedSection>

              {/* Kategorija */}
              <AnimatedSection delay={0.18} direction="up">
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '10px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Kategorija *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {CATEGORIES.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: c.value })}
                        style={{
                          padding: '10px 8px', borderRadius: '12px', border: 'none',
                          cursor: 'pointer', fontSize: '13px', fontWeight: '700',
                          background: formData.category === c.value ? '#FFF7ED' : '#F5F2ED',
                          color: formData.category === c.value ? '#FF6B35' : '#6B7280',
                          outline: formData.category === c.value ? '2px solid #FF6B35' : '2px solid transparent',
                          transition: 'all 0.15s',
                        }}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </AnimatedSection>

              {/* Stanje */}
              <AnimatedSection delay={0.2} direction="up">
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '10px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Stanje *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {CONDITIONS.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, condition: c.value })}
                        style={{
                          padding: '12px', borderRadius: '12px', border: 'none',
                          cursor: 'pointer', textAlign: 'left',
                          background: formData.condition === c.value ? '#FFF7ED' : '#F5F2ED',
                          outline: formData.condition === c.value ? '2px solid #FF6B35' : '2px solid transparent',
                          transition: 'all 0.15s',
                        }}>
                        <p style={{ fontSize: '14px', fontWeight: '800', color: formData.condition === c.value ? '#FF6B35' : '#1C1C1E', marginBottom: '2px' }}>
                          {c.label}
                        </p>
                        <p style={{ fontSize: '11px', color: '#AEAEB2' }}>{c.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </AnimatedSection>

              {/* Buttons */}
              <AnimatedSection delay={0.22} direction="up">
                <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => navigate('/shop')}
                    style={{
                      flex: 1, padding: '13px', borderRadius: '14px', border: 'none',
                      background: '#D8D4CC', color: '#6B7280',
                      fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                    }}>
                    Odustani
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !isValid}
                    style={{
                      flex: 2, padding: '13px', borderRadius: '14px', border: 'none',
                      background: loading || !isValid
                        ? '#D8D4CC'
                        : 'linear-gradient(135deg, #FF6B35, #FFB800)',
                      color: loading || !isValid ? '#AEAEB2' : 'white',
                      fontSize: '14px', fontWeight: '800',
                      cursor: loading || !isValid ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      boxShadow: !loading && isValid ? '0 4px 16px rgba(255,107,53,0.3)' : 'none',
                      transition: 'all 0.2s',
                    }}>
                    {loading ? (
                      <>
                        <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid white', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                        Objavljivanje...
                      </>
                    ) : '🛍️ Objavi oglas'}
                  </button>
                </div>
              </AnimatedSection>
            </form>
          </div>
        </AnimatedScale>
      </div>
    </div>
  )
}