import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTutorProfile } from '../api/tutoring'
import { AnimatedSection, AnimatedScale, AnimatedBlur } from '../components/Animated'

export default function BecomeTutor() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    bio: '',
    hourlyRate: '',
    subjects: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [subjectTags, setSubjectTags] = useState([])
  const [subjectInput, setSubjectInput] = useState('')

  const handleAddSubject = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = subjectInput.trim().replace(/,$/, '')
      if (val && !subjectTags.includes(val)) {
        const newTags = [...subjectTags, val]
        setSubjectTags(newTags)
        setFormData({ ...formData, subjects: newTags.join(', ') })
      }
      setSubjectInput('')
    }
  }

  const removeSubject = (tag) => {
    const newTags = subjectTags.filter(t => t !== tag)
    setSubjectTags(newTags)
    setFormData({ ...formData, subjects: newTags.join(', ') })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (subjectTags.length === 0) {
      setError('Dodaj najmanje jedan predmet')
      return
    }
    setLoading(true)
    setError('')
    try {
      await createTutorProfile({
        ...formData,
        subjects: subjectTags,
      })
      navigate('/tutoring')
    } catch (err) {
      setError(err.response?.data?.message || 'Greška pri kreiranju profila')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    background: '#EEEBE5', border: '1.5px solid #D8D4CC', color: '#1C1C1E',
    borderRadius: '12px', padding: '11px 14px', fontSize: '14px', width: '100%',
    outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box',
    fontFamily: 'inherit',
  }

  const SUGGESTED_SUBJECTS = [
    'Matematika', 'Fizika', 'Hemija', 'Programiranje',
    'Engleski', 'Statistika', 'Ekonomija', 'Pravo',
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#E2DDD6' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1C1C1E 0%, #1A1C2E 60%, #1C1C1E 100%)',
        padding: '32px 40px 48px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 75% 50%, rgba(124,58,237,0.18), transparent 55%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 80%, rgba(255,107,53,0.1), transparent 50%)' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px', margin: '0 auto' }}>
          <AnimatedBlur delay={0}>
            <button
              onClick={() => navigate('/tutoring')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'none', border: 'none', color: '#8E8E93',
                fontSize: '14px', cursor: 'pointer', marginBottom: '24px', padding: 0,
              }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Nazad na instrukcije
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px',
                background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '26px', boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
              }}>
                📚
              </div>
              <div>
                <h1 style={{
                  fontSize: '28px', fontWeight: '900', color: 'white',
                  letterSpacing: '-0.02em', marginBottom: '4px',
                }}>
                  Postani tutor
                </h1>
                <p style={{ color: '#8E8E93', fontSize: '14px' }}>
                  Pomozi studentima i zaradi dodatni džeparac
                </p>
              </div>
            </div>

            {/* Info chips */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '20px' }}>
              {[
                { icon: '💰', text: 'Sam određuješ satnicu' },
                { icon: '⏰', text: 'Fleksibilni termini' },
                { icon: '🎓', text: 'Pomažeš kolegama' },
              ].map((chip, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 14px', borderRadius: '100px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(8px)',
                }}>
                  <span style={{ fontSize: '14px' }}>{chip.icon}</span>
                  <span style={{ fontSize: '12px', color: '#E5E5EA', fontWeight: '600' }}>{chip.text}</span>
                </div>
              ))}
            </div>
          </AnimatedBlur>
        </div>
      </div>

      {/* Form */}
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '28px 32px 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

          {/* Forma */}
          <div style={{ gridColumn: 'span 2' }}>
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
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    ⚠️ {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  {/* Bio */}
                  <AnimatedSection delay={0.1} direction="up">
                    <div>
                      <label style={{
                        fontSize: '12px', fontWeight: '700', color: '#6B7280',
                        marginBottom: '8px', display: 'block',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}>
                        O sebi
                      </label>
                      <textarea
                        value={formData.bio}
                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                        rows={4}
                        style={{ ...inputStyle, resize: 'none' }}
                        placeholder="Opiši svoje iskustvo, pristup predavanju i zašto si dobar tutor..."
                        onFocus={e => e.target.style.borderColor = '#7C3AED'}
                        onBlur={e => e.target.style.borderColor = '#D8D4CC'}
                      />
                    </div>
                  </AnimatedSection>

                  {/* Predmeti */}
                  <AnimatedSection delay={0.15} direction="up">
                    <div>
                      <label style={{
                        fontSize: '12px', fontWeight: '700', color: '#6B7280',
                        marginBottom: '8px', display: 'block',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}>
                        Predmeti *
                        <span style={{ color: '#AEAEB2', fontWeight: '400', textTransform: 'none', letterSpacing: 0, marginLeft: '6px', fontSize: '11px' }}>
                          (Enter ili zarez za dodavanje)
                        </span>
                      </label>

                      {/* Tags */}
                      {subjectTags.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '10px' }}>
                          {subjectTags.map(tag => (
                            <span key={tag} style={{
                              display: 'flex', alignItems: 'center', gap: '5px',
                              padding: '5px 12px', borderRadius: '100px',
                              background: 'rgba(124,58,237,0.12)', color: '#7C3AED',
                              fontSize: '13px', fontWeight: '700',
                              border: '1px solid rgba(124,58,237,0.25)',
                            }}>
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeSubject(tag)}
                                style={{
                                  background: 'none', border: 'none', cursor: 'pointer',
                                  color: '#7C3AED', fontSize: '14px', lineHeight: 1,
                                  padding: '0', display: 'flex', alignItems: 'center',
                                  opacity: 0.7,
                                }}>
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <input
                        value={subjectInput}
                        onChange={e => setSubjectInput(e.target.value)}
                        onKeyDown={handleAddSubject}
                        style={inputStyle}
                        placeholder={subjectTags.length === 0 ? 'npr. Matematika, Fizika...' : 'Dodaj još predmeta...'}
                        onFocus={e => e.target.style.borderColor = '#7C3AED'}
                        onBlur={e => e.target.style.borderColor = '#D8D4CC'}
                      />

                      {/* Suggested subjects */}
                      <div style={{ marginTop: '10px' }}>
                        <p style={{ fontSize: '11px', color: '#AEAEB2', marginBottom: '7px', fontWeight: '600' }}>
                          Brzo dodaj:
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {SUGGESTED_SUBJECTS.filter(s => !subjectTags.includes(s)).map(s => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => {
                                const newTags = [...subjectTags, s]
                                setSubjectTags(newTags)
                                setFormData({ ...formData, subjects: newTags.join(', ') })
                              }}
                              style={{
                                padding: '4px 10px', borderRadius: '100px',
                                background: '#D8D4CC', color: '#6B7280',
                                border: 'none', fontSize: '12px', fontWeight: '600',
                                cursor: 'pointer', transition: 'all 0.15s',
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(124,58,237,0.12)'
                                e.currentTarget.style.color = '#7C3AED'
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = '#D8D4CC'
                                e.currentTarget.style.color = '#6B7280'
                              }}
                            >
                              + {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </AnimatedSection>

                  {/* Satnica */}
                  <AnimatedSection delay={0.2} direction="up">
                    <div>
                      <label style={{
                        fontSize: '12px', fontWeight: '700', color: '#6B7280',
                        marginBottom: '8px', display: 'block',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}>
                        Satnica (KM/h) *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          min="5"
                          step="1"
                          value={formData.hourlyRate}
                          onChange={e => setFormData({ ...formData, hourlyRate: e.target.value })}
                          required
                          style={{ ...inputStyle, paddingRight: '60px' }}
                          placeholder="15"
                          onFocus={e => e.target.style.borderColor = '#7C3AED'}
                          onBlur={e => e.target.style.borderColor = '#D8D4CC'}
                        />
                        <span style={{
                          position: 'absolute', right: '14px', top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: '13px', fontWeight: '700', color: '#AEAEB2',
                        }}>
                          KM/h
                        </span>
                      </div>

                      {/* Preporučene cijene */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                        <p style={{ fontSize: '12px', color: '#AEAEB2', marginRight: '4px', alignSelf: 'center' }}>
                          Preporučeno:
                        </p>
                        {[10, 15, 20, 25, 30].map(price => (
                          <button
                            key={price}
                            type="button"
                            onClick={() => setFormData({ ...formData, hourlyRate: price.toString() })}
                            style={{
                              padding: '4px 10px', borderRadius: '100px', border: 'none',
                              background: formData.hourlyRate === price.toString()
                                ? 'rgba(124,58,237,0.15)' : '#D8D4CC',
                              color: formData.hourlyRate === price.toString()
                                ? '#7C3AED' : '#6B7280',
                              fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                              transition: 'all 0.15s',
                              outline: formData.hourlyRate === price.toString()
                                ? '2px solid rgba(124,58,237,0.3)' : 'none',
                            }}>
                            {price} KM
                          </button>
                        ))}
                      </div>
                    </div>
                  </AnimatedSection>

                  {/* Preview */}
                  {(formData.hourlyRate || subjectTags.length > 0) && (
                    <AnimatedScale delay={0}>
                      <div style={{
                        padding: '16px 18px', borderRadius: '14px',
                        background: 'rgba(124,58,237,0.06)',
                        border: '1px solid rgba(124,58,237,0.15)',
                      }}>
                        <p style={{ fontSize: '12px', fontWeight: '700', color: '#7C3AED', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Pregled profila
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                          {subjectTags.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', flex: 1 }}>
                              {subjectTags.slice(0, 3).map(s => (
                                <span key={s} style={{
                                  fontSize: '12px', padding: '3px 8px', borderRadius: '100px',
                                  background: 'rgba(124,58,237,0.1)', color: '#7C3AED', fontWeight: '600',
                                }}>
                                  {s}
                                </span>
                              ))}
                              {subjectTags.length > 3 && (
                                <span style={{ fontSize: '12px', color: '#AEAEB2' }}>
                                  +{subjectTags.length - 3} više
                                </span>
                              )}
                            </div>
                          )}
                          {formData.hourlyRate && (
                            <div style={{ textAlign: 'right' }}>
                              <span style={{
                                fontSize: '22px', fontWeight: '900',
                                background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                              }}>
                                {formData.hourlyRate} KM/h
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </AnimatedScale>
                  )}

                  {/* Buttons */}
                  <AnimatedSection delay={0.25} direction="up">
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => navigate('/tutoring')}
                        style={{
                          flex: 1, padding: '13px', borderRadius: '14px', border: 'none',
                          background: '#D8D4CC', color: '#6B7280',
                          fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                          transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                      >
                        Odustani
                      </button>
                      <button
                        type="submit"
                        disabled={loading || subjectTags.length === 0 || !formData.hourlyRate}
                        style={{
                          flex: 2, padding: '13px', borderRadius: '14px', border: 'none',
                          background: loading || subjectTags.length === 0 || !formData.hourlyRate
                            ? '#D8D4CC'
                            : 'linear-gradient(135deg, #7C3AED, #A855F7)',
                          color: loading || subjectTags.length === 0 || !formData.hourlyRate
                            ? '#AEAEB2' : 'white',
                          fontSize: '14px', fontWeight: '800',
                          cursor: loading || subjectTags.length === 0 || !formData.hourlyRate
                            ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                          boxShadow: !loading && subjectTags.length > 0 && formData.hourlyRate
                            ? '0 4px 16px rgba(124,58,237,0.35)' : 'none',
                          transition: 'all 0.2s',
                        }}>
                        {loading ? (
                          <>
                            <div style={{
                              width: '14px', height: '14px', borderRadius: '50%',
                              border: '2px solid white', borderTopColor: 'transparent',
                              animation: 'spin 0.8s linear infinite',
                            }} />
                            Kreiranje...
                          </>
                        ) : '📚 Kreiraj tutor profil'}
                      </button>
                    </div>
                  </AnimatedSection>
                </form>
              </div>
            </AnimatedScale>
          </div>
        </div>

        {/* Tips kartica */}
        <AnimatedSection delay={0.3} direction="up">
          <div style={{
            marginTop: '16px', background: 'rgba(124,58,237,0.06)',
            borderRadius: '18px', padding: '20px',
            border: '1px solid rgba(124,58,237,0.12)',
          }}>
            <p style={{ fontSize: '13px', fontWeight: '800', color: '#7C3AED', marginBottom: '12px' }}>
              💡 Savjeti za uspješan tutor profil
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { icon: '✍️', tip: 'Napiši detaljan bio o svom iskustvu' },
                { icon: '📚', tip: 'Dodaj sve predmete u kojima si dobar' },
                { icon: '💰', tip: 'Počni sa nižom cijenom da pridobiješ recenzije' },
                { icon: '⭐', tip: 'Kvalitetne instrukcije = bolje ocjene' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ fontSize: '14px', flexShrink: 0 }}>{item.icon}</span>
                  <p style={{ fontSize: '12px', color: '#6B7280', lineHeight: '1.4' }}>{item.tip}</p>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  )
}