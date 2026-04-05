import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createJob } from '../api/jobs'
import { AnimatedSection, AnimatedBlur, AnimatedScale } from '../components/Animated'

const CATEGORIES = {
  UGOSTITELJSTVO: '🍽️ Ugostiteljstvo',
  TRGOVINA: '🛒 Trgovina',
  ADMINISTRACIJA: '📋 Administracija',
  IT: '💻 IT',
  TUTORING: '📚 Tutoring',
  DOSTAVA: '🚴 Dostava',
  PROMOCIJA: '📢 Promocija',
  FIZICKI_RAD: '💪 Fizički rad',
  OSTALO: '✨ Ostalo',
}

export default function NewJob() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '', description: '', type: 'NUDIM', category: '',
    location: '', isRemote: false, salary: '', salaryPeriod: 'PO_SATU',
    hours: '', contactEmail: '', contactPhone: '',
  })

  const inputStyle = {
    background: '#F0EDE8', border: '1.5px solid #E8E4DF', color: '#1C1C1E',
    borderRadius: '12px', padding: '11px 14px', fontSize: '14px', width: '100%',
    outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box',
    fontFamily: 'inherit',
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await createJob(formData)
      navigate('/jobs')
    } catch (err) {
      setError(err.response?.data?.message || 'Greška pri objavljivanju')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#EFEDE8' }}>

      <div style={{
        background: 'linear-gradient(135deg, #1C1C1E, #2C2C2E)',
        padding: '32px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 50%, rgba(255,107,53,0.1), transparent 60%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <AnimatedBlur>
            <button onClick={() => navigate('/jobs')} style={{
              display: 'flex', alignItems: 'center', gap: '6px', background: 'none',
              border: 'none', color: '#8E8E93', fontSize: '14px', cursor: 'pointer', marginBottom: '16px', padding: 0,
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Nazad na poslove
            </button>
            <h1 style={{ fontSize: '28px', fontWeight: '900', color: 'white', letterSpacing: '-0.02em' }}>
              Novi oglas 💼
            </h1>
            <p style={{ color: '#8E8E93', marginTop: '6px' }}>Nudi ili traži studentski posao</p>
          </AnimatedBlur>
        </div>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px' }}>
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[
                      { value: 'NUDIM', label: '💼 Nudim posao', desc: 'Imam posao za studenta' },
                      { value: 'TRAZIM', label: '🙋 Tražim posao', desc: 'Tražim studentski posao' },
                    ].map(t => (
                      <button key={t.value} type="button" onClick={() => setFormData({ ...formData, type: t.value })} style={{
                        padding: '14px', borderRadius: '14px', textAlign: 'left', cursor: 'pointer', border: 'none',
                        background: formData.type === t.value ? '#FFF7ED' : '#F0EDE8',
                        outline: formData.type === t.value ? '2px solid #FF6B35' : '2px solid transparent',
                        transition: 'all 0.2s',
                      }}>
                        <p style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '14px', marginBottom: '3px' }}>{t.label}</p>
                        <p style={{ color: '#8E8E93', fontSize: '12px' }}>{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </AnimatedSection>

              {/* Naziv */}
              <AnimatedSection delay={0.2} direction="up">
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#3A3A3C', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Naziv posla *
                  </label>
                  <input style={inputStyle} value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    required placeholder="npr. Konobar/ica vikendom"
                    onFocus={e => e.target.style.borderColor = '#FF6B35'}
                    onBlur={e => e.target.style.borderColor = '#E8E4DF'}
                  />
                </div>
              </AnimatedSection>

              {/* Kategorija */}
              <AnimatedSection delay={0.22} direction="up">
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#3A3A3C', marginBottom: '10px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Kategorija *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {Object.entries(CATEGORIES).map(([key, label]) => (
                      <button key={key} type="button" onClick={() => setFormData({ ...formData, category: key })} style={{
                        padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                        fontSize: '12px', fontWeight: '600', transition: 'all 0.15s', textAlign: 'left',
                        background: formData.category === key ? '#FF6B35' : '#F0EDE8',
                        color: formData.category === key ? 'white' : '#6B7280',
                      }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </AnimatedSection>

              {/* Opis */}
              <AnimatedSection delay={0.24} direction="up">
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#3A3A3C', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Opis *
                  </label>
                  <textarea style={{ ...inputStyle, height: '110px', resize: 'none' }}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    required placeholder="Opiši posao, zahtjeve, uvjete rada..."
                    onFocus={e => e.target.style.borderColor = '#FF6B35'}
                    onBlur={e => e.target.style.borderColor = '#E8E4DF'}
                  />
                </div>
              </AnimatedSection>

              {/* Lokacija i sati */}
              <AnimatedSection delay={0.26} direction="up">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#3A3A3C', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Lokacija
                    </label>
                    <input style={inputStyle} value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      placeholder="npr. Sarajevo, Centar"
                      onFocus={e => e.target.style.borderColor = '#FF6B35'}
                      onBlur={e => e.target.style.borderColor = '#E8E4DF'}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#3A3A3C', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Radno vrijeme
                    </label>
                    <input style={inputStyle} value={formData.hours}
                      onChange={e => setFormData({ ...formData, hours: e.target.value })}
                      placeholder="npr. Vikendi, 20h/sedmično"
                      onFocus={e => e.target.style.borderColor = '#FF6B35'}
                      onBlur={e => e.target.style.borderColor = '#E8E4DF'}
                    />
                  </div>
                </div>
              </AnimatedSection>

              {/* Remote toggle */}
              <AnimatedSection delay={0.28} direction="up">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', background: '#F0EDE8', borderRadius: '14px' }}>
                  <button type="button" onClick={() => setFormData({ ...formData, isRemote: !formData.isRemote })} style={{
                    width: '44px', height: '24px', borderRadius: '100px', border: 'none', cursor: 'pointer',
                    background: formData.isRemote ? '#FF6B35' : '#C7C7CC',
                    position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                  }}>
                    <div style={{
                      position: 'absolute', top: '2px', width: '20px', height: '20px',
                      background: 'white', borderRadius: '50%', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                      left: formData.isRemote ? '22px' : '2px', transition: 'left 0.2s',
                    }} />
                  </button>
                  <div>
                    <p style={{ fontWeight: '700', color: '#1C1C1E', fontSize: '14px' }}>Remote posao 🌐</p>
                    <p style={{ color: '#8E8E93', fontSize: '12px', marginTop: '2px' }}>Posao se može obavljati od kuće</p>
                  </div>
                </div>
              </AnimatedSection>

              {/* Plata */}
              <AnimatedSection delay={0.3} direction="up">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#3A3A3C', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Plata (KM)
                    </label>
                    <input style={inputStyle} type="number" value={formData.salary} min="0"
                      onChange={e => setFormData({ ...formData, salary: e.target.value })}
                      placeholder="npr. 8"
                      onFocus={e => e.target.style.borderColor = '#FF6B35'}
                      onBlur={e => e.target.style.borderColor = '#E8E4DF'}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#3A3A3C', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Period
                    </label>
                    <select style={{ ...inputStyle, cursor: 'pointer' }} value={formData.salaryPeriod}
                      onChange={e => setFormData({ ...formData, salaryPeriod: e.target.value })}
                      onFocus={e => e.target.style.borderColor = '#FF6B35'}
                      onBlur={e => e.target.style.borderColor = '#E8E4DF'}>
                      <option value="PO_SATU">Po satu</option>
                      <option value="PO_DANU">Po danu</option>
                      <option value="PO_MJESECU">Po mjesecu</option>
                      <option value="DOGOVOR">Dogovor</option>
                    </select>
                  </div>
                </div>
              </AnimatedSection>

              {/* Kontakt */}
              <AnimatedSection delay={0.32} direction="up">
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#3A3A3C', marginBottom: '10px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Kontakt info
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input style={inputStyle} type="email" value={formData.contactEmail}
                      onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                      placeholder="Email (opciono)"
                      onFocus={e => e.target.style.borderColor = '#FF6B35'}
                      onBlur={e => e.target.style.borderColor = '#E8E4DF'}
                    />
                    <input style={inputStyle} type="tel" value={formData.contactPhone}
                      onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                      placeholder="Telefon (opciono)"
                      onFocus={e => e.target.style.borderColor = '#FF6B35'}
                      onBlur={e => e.target.style.borderColor = '#E8E4DF'}
                    />
                  </div>
                  <p style={{ fontSize: '12px', color: '#AEAEB2', marginTop: '8px' }}>
                    💡 Bez kontakta, studenti ti mogu poslati poruku na platformi
                  </p>
                </div>
              </AnimatedSection>

              {/* Submit */}
              <AnimatedSection delay={0.34} direction="up">
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => navigate('/jobs')} style={{
                    flex: 1, padding: '13px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                    background: '#F0EDE8', color: '#6B7280', fontSize: '14px', fontWeight: '700',
                  }}>
                    Odustani
                  </button>
                  <button type="submit" disabled={loading || !formData.category} style={{
                    flex: 2, padding: '13px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                    background: loading || !formData.category ? '#E5E5EA' : 'linear-gradient(135deg, #FF6B35, #FFB800)',
                    color: loading || !formData.category ? '#AEAEB2' : 'white',
                    fontSize: '14px', fontWeight: '800', transition: 'opacity 0.2s',
                    boxShadow: !loading && formData.category ? '0 4px 16px rgba(255,107,53,0.3)' : 'none',
                  }}>
                    {loading ? 'Objavljivanje...' : '🚀 Objavi oglas'}
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