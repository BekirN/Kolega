import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createListing } from '../api/housing'
import { AnimatedSection, AnimatedBlur, AnimatedScale } from '../components/Animated'

const HOUSING_TYPES = [
  { value: 'APARTMAN', label: '🏢 Apartman', desc: 'Cijeli apartman' },
  { value: 'SOBA', label: '🛏️ Soba', desc: 'Soba u stanu' },
  { value: 'GARSONJERA', label: '🏠 Garsonjera', desc: 'Studio apartman' },
  { value: 'CIMER', label: '👥 Tražim cimera', desc: 'Slobodno mjesto' },
]

export default function NewHousing() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [images, setImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    type: '',
    city: '',
    municipality: '',
    address: '',
    roomCount: '',
    bathroomCount: '',
    squareMeters: '',
    furnished: false,
    utilitiesIncluded: false,
    contactPhone: '',
    contactEmail: '',
    lookingForRoommate: false,
    roommateSpots: '',
  })

  const inputStyle = {
    background: '#F0EDE8', border: '1.5px solid #E8E4DF', color: '#1C1C1E',
    borderRadius: '12px', padding: '11px 14px', fontSize: '14px', width: '100%',
    outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box',
    fontFamily: 'inherit',
  }

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length + images.length > 8) {
      setError('Maksimalno 8 slika')
      return
    }
    setImages(prev => [...prev, ...files])
    const previews = files.map(f => URL.createObjectURL(f))
    setImagePreviews(prev => [...prev, ...previews])
  }

  const removeImage = (i) => {
    setImages(prev => prev.filter((_, idx) => idx !== i))
    setImagePreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.type) { setError('Odaberi tip oglasa'); return }
    setLoading(true)
    setError('')
    try {
      await createListing({ ...formData, images })
      navigate('/housing')
    } catch (err) {
      setError(err.response?.data?.message || 'Greška pri objavljivanju')
    } finally {
      setLoading(false)
    }
  }

  const Toggle = ({ value, onChange, label, desc }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      padding: '14px', background: '#F0EDE8', borderRadius: '12px',
    }}>
      <button type="button" onClick={() => onChange(!value)} style={{
        width: '44px', height: '24px', borderRadius: '100px', border: 'none', cursor: 'pointer',
        background: value ? '#FF6B35' : '#C7C7CC',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: '2px', width: '20px', height: '20px',
          background: 'white', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          left: value ? '22px' : '2px', transition: 'left 0.2s',
        }} />
      </button>
      <div>
        <p style={{ fontWeight: '700', color: '#1C1C1E', fontSize: '14px' }}>{label}</p>
        {desc && <p style={{ color: '#8E8E93', fontSize: '12px', marginTop: '2px' }}>{desc}</p>}
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#EFEDE8' }}>

      <div style={{
        background: 'linear-gradient(135deg, #1C1C1E, #2C2C2E)',
        padding: '32px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 50%, rgba(124,58,237,0.1), transparent 60%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <AnimatedBlur>
            <button onClick={() => navigate('/housing')} style={{
              display: 'flex', alignItems: 'center', gap: '6px', background: 'none',
              border: 'none', color: '#8E8E93', fontSize: '14px', cursor: 'pointer',
              marginBottom: '16px', padding: 0,
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Nazad na oglase
            </button>
            <h1 style={{ fontSize: '28px', fontWeight: '900', color: 'white', letterSpacing: '-0.02em' }}>
              Novi oglas 🏠
            </h1>
            <p style={{ color: '#8E8E93', marginTop: '6px' }}>
              Objavi stan, sobu ili traži cimera
            </p>
          </AnimatedBlur>
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px' }}>
        <AnimatedScale delay={0.1}>
          <div style={{ background: '#FDFCF9', borderRadius: '24px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

            {error && (
              <div style={{ padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', background: '#FFF0ED', color: '#FF3B30', fontSize: '14px' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Tip */}
              <AnimatedSection delay={0.15} direction="up">
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#3A3A3C', marginBottom: '10px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Tip oglasa *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {HOUSING_TYPES.map(t => (
                      <button key={t.value} type="button"
                        onClick={() => setFormData({ ...formData, type: t.value })} style={{
                          padding: '14px', borderRadius: '14px', textAlign: 'left',
                          cursor: 'pointer', border: 'none',
                          background: formData.type === t.value ? '#FFF7ED' : '#F0EDE8',
                          outline: formData.type === t.value ? '2px solid #FF6B35' : '2px solid transparent',
                          transition: 'all 0.2s',
                        }}>
                        <p style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '15px', marginBottom: '3px' }}>{t.label}</p>
                        <p style={{ color: '#8E8E93', fontSize: '12px' }}>{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </AnimatedSection>

              {/* Slike upload */}
              <AnimatedSection delay={0.17} direction="up">
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#3A3A3C', marginBottom: '10px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Slike (max 8)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {imagePreviews.map((src, i) => (
                      <div key={i} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '1' }}>
                        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" onClick={() => removeImage(i)} style={{
                          position: 'absolute', top: '4px', right: '4px',
                          width: '20px', height: '20px', borderRadius: '50%', border: 'none',
                          background: 'rgba(0,0,0,0.6)', color: 'white', cursor: 'pointer',
                          fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>✕</button>
                      </div>
                    ))}

                    {imagePreviews.length < 8 && (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          borderRadius: '12px', aspectRatio: '1',
                          border: '2px dashed #E8E4DF', cursor: 'pointer',
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center', gap: '4px',
                          background: '#F7F5F0', transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#FF6B35'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#E8E4DF'}
                      >
                        <span style={{ fontSize: '20px' }}>📷</span>
                        <span style={{ fontSize: '10px', color: '#AEAEB2', fontWeight: '600' }}>Dodaj</span>
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" multiple accept="image/*"
                    onChange={handleImageSelect} style={{ display: 'none' }} />
                </div>
              </AnimatedSection>

              {/* Naslov */}
              <AnimatedSection delay={0.2} direction="up">
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#3A3A3C', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Naslov *
                  </label>
                  <input style={inputStyle} value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    required placeholder="npr. Lijepa garsonjera u centru Sarajeva"
                    onFocus={e => e.target.style.borderColor = '#FF6B35'}
                    onBlur={e => e.target.style.borderColor = '#E8E4DF'}
                  />
                </div>
              </AnimatedSection>

              {/* Opis */}
              <AnimatedSection delay={0.22} direction="up">
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#3A3A3C', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Opis *
                  </label>
                  <textarea style={{ ...inputStyle, height: '120px', resize: 'none' }}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    required placeholder="Opiši stan – lokacija, sadržaj, uvjeti..."
                    onFocus={e => e.target.style.borderColor = '#FF6B35'}
                    onBlur={e => e.target.style.borderColor = '#E8E4DF'}
                  />
                </div>
              </AnimatedSection>

              {/* Cijena i grad */}
              <AnimatedSection delay={0.24} direction="up">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#3A3A3C', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Cijena (KM/mj.) *
                    </label>
                    <input style={inputStyle} type="number" value={formData.price}
                      onChange={e => setFormData({ ...formData, price: e.target.value })}
                      required placeholder="450"
                      onFocus={e => e.target.style.borderColor = '#FF6B35'}
                      onBlur={e => e.target.style.borderColor = '#E8E4DF'}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#3A3A3C', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Grad *
                    </label>
                    <input style={inputStyle} value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      required placeholder="Sarajevo"
                      onFocus={e => e.target.style.borderColor = '#FF6B35'}
                      onBlur={e => e.target.style.borderColor = '#E8E4DF'}
                    />
                  </div>
                </div>
              </AnimatedSection>

              {/* Općina i adresa */}
              <AnimatedSection delay={0.25} direction="up">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#3A3A3C', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Općina
                    </label>
                    <input style={inputStyle} value={formData.municipality}
                      onChange={e => setFormData({ ...formData, municipality: e.target.value })}
                      placeholder="npr. Centar, Novo Sarajevo"
                      onFocus={e => e.target.style.borderColor = '#FF6B35'}
                      onBlur={e => e.target.style.borderColor = '#E8E4DF'}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#3A3A3C', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Adresa
                    </label>
                    <input style={inputStyle} value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Ulica i broj (opciono)"
                      onFocus={e => e.target.style.borderColor = '#FF6B35'}
                      onBlur={e => e.target.style.borderColor = '#E8E4DF'}
                    />
                  </div>
                </div>
              </AnimatedSection>

              {/* Detalji */}
              <AnimatedSection delay={0.26} direction="up">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#3A3A3C', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Sobe
                    </label>
                    <input style={inputStyle} type="number" value={formData.roomCount}
                      onChange={e => setFormData({ ...formData, roomCount: e.target.value })}
                      placeholder="2" min="1"
                      onFocus={e => e.target.style.borderColor = '#FF6B35'}
                      onBlur={e => e.target.style.borderColor = '#E8E4DF'}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#3A3A3C', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Kupatila
                    </label>
                    <input style={inputStyle} type="number" value={formData.bathroomCount}
                      onChange={e => setFormData({ ...formData, bathroomCount: e.target.value })}
                      placeholder="1" min="1"
                      onFocus={e => e.target.style.borderColor = '#FF6B35'}
                      onBlur={e => e.target.style.borderColor = '#E8E4DF'}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#3A3A3C', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      m²
                    </label>
                    <input style={inputStyle} type="number" value={formData.squareMeters}
                      onChange={e => setFormData({ ...formData, squareMeters: e.target.value })}
                      placeholder="45"
                      onFocus={e => e.target.style.borderColor = '#FF6B35'}
                      onBlur={e => e.target.style.borderColor = '#E8E4DF'}
                    />
                  </div>
                </div>
              </AnimatedSection>

              {/* Toggles */}
              <AnimatedSection delay={0.28} direction="up">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Toggle
                    value={formData.furnished}
                    onChange={v => setFormData({ ...formData, furnished: v })}
                    label="🛋️ Namješteno"
                    desc="Stan dolazi sa namještajem"
                  />
                  <Toggle
                    value={formData.utilitiesIncluded}
                    onChange={v => setFormData({ ...formData, utilitiesIncluded: v })}
                    label="💡 Računi uključeni"
                    desc="Struja, voda, grijanje uključeni u cijenu"
                  />
                  <Toggle
                    value={formData.lookingForRoommate}
                    onChange={v => setFormData({ ...formData, lookingForRoommate: v })}
                    label="👥 Tražim cimera"
                    desc="Imaš slobodno mjesto i tražiš cimera"
                  />
                </div>
              </AnimatedSection>

              {/* Broj mjesta za cimere */}
              {formData.lookingForRoommate && (
                <AnimatedSection delay={0} direction="up">
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#3A3A3C', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Broj slobodnih mjesta
                    </label>
                    <input style={inputStyle} type="number" value={formData.roommateSpots}
                      onChange={e => setFormData({ ...formData, roommateSpots: e.target.value })}
                      placeholder="1" min="1"
                      onFocus={e => e.target.style.borderColor = '#FF6B35'}
                      onBlur={e => e.target.style.borderColor = '#E8E4DF'}
                    />
                  </div>
                </AnimatedSection>
              )}

              {/* Kontakt */}
              <AnimatedSection delay={0.3} direction="up">
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#3A3A3C', marginBottom: '10px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Kontakt info
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input style={inputStyle} type="tel" value={formData.contactPhone}
                      onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                      placeholder="Telefon (opciono)"
                      onFocus={e => e.target.style.borderColor = '#FF6B35'}
                      onBlur={e => e.target.style.borderColor = '#E8E4DF'}
                    />
                    <input style={inputStyle} type="email" value={formData.contactEmail}
                      onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                      placeholder="Email (opciono)"
                      onFocus={e => e.target.style.borderColor = '#FF6B35'}
                      onBlur={e => e.target.style.borderColor = '#E8E4DF'}
                    />
                  </div>
                  <p style={{ fontSize: '12px', color: '#AEAEB2', marginTop: '8px' }}>
                    💡 Bez kontakta, zainteresirani ti mogu poslati poruku na platformi
                  </p>
                </div>
              </AnimatedSection>

              {/* Submit */}
              <AnimatedSection delay={0.32} direction="up">
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => navigate('/housing')} style={{
                    flex: 1, padding: '13px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                    background: '#F0EDE8', color: '#6B7280', fontSize: '14px', fontWeight: '700',
                  }}>
                    Odustani
                  </button>
                  <button type="submit" disabled={loading || !formData.type} style={{
                    flex: 2, padding: '13px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                    background: !loading && formData.type
                      ? 'linear-gradient(135deg, #FF6B35, #FFB800)'
                      : '#E5E5EA',
                    color: !loading && formData.type ? 'white' : '#AEAEB2',
                    fontSize: '14px', fontWeight: '800',
                    boxShadow: !loading && formData.type ? '0 4px 16px rgba(255,107,53,0.3)' : 'none',
                  }}>
                    {loading ? 'Objavljivanje...' : '🏠 Objavi oglas'}
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