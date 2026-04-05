import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getJobs, deleteJob } from '../api/jobs'
import { AnimatedSection, AnimatedBlur, AnimatedScale, AnimatedLine } from '../components/Animated'

const CATEGORIES = {
  UGOSTITELJSTVO: { label: 'Ugostiteljstvo', emoji: '🍽️' },
  TRGOVINA: { label: 'Trgovina', emoji: '🛒' },
  ADMINISTRACIJA: { label: 'Administracija', emoji: '📋' },
  IT: { label: 'IT', emoji: '💻' },
  TUTORING: { label: 'Tutoring', emoji: '📚' },
  DOSTAVA: { label: 'Dostava', emoji: '🚴' },
  PROMOCIJA: { label: 'Promocija', emoji: '📢' },
  FIZICKI_RAD: { label: 'Fizički rad', emoji: '💪' },
  OSTALO: { label: 'Ostalo', emoji: '✨' },
}

const SALARY_PERIOD = {
  PO_SATU: '/sat', PO_DANU: '/dan', PO_MJESECU: '/mj.', DOGOVOR: 'dogovor',
}

const timeAgo = (date) => {
  const s = Math.floor((new Date() - new Date(date)) / 1000)
  if (s < 3600) return `${Math.floor(s / 60)}min`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

export default function StudentJobs() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [search, setSearch] = useState('')
  const [selectedJob, setSelectedJob] = useState(null)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const filters = {}
      if (activeType) filters.type = activeType
      if (activeCategory) filters.category = activeCategory
      if (search) filters.search = search
      const data = await getJobs(filters)
      setJobs(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchJobs() }, [activeType, activeCategory])

  const handleDelete = async (id) => {
    if (!confirm('Obrisati oglas?')) return
    try {
      await deleteJob(id)
      setJobs(prev => prev.filter(j => j.id !== id))
      if (selectedJob?.id === id) setSelectedJob(null)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#EFEDE8' }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1C1C1E 0%, #2C1810 60%, #1C1C1E 100%)',
        padding: '40px 32px 32px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(255,107,53,0.18), transparent 60%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 30%, rgba(255,184,0,0.08), transparent 50%)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <AnimatedBlur delay={0}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 14px', borderRadius: '100px', marginBottom: '16px',
              background: 'rgba(255,107,53,0.15)', color: '#FF6B35',
              border: '1px solid rgba(255,107,53,0.3)', fontSize: '12px', fontWeight: '600',
            }}>
              💼 Studentski poslovi
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '32px', fontWeight: '900', color: 'white', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '8px' }}>
                  Nađi posao ili{' '}
                  <span style={{
                    background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>
                    zaposli studenta
                  </span>
                </h1>
                <p style={{ color: '#8E8E93', fontSize: '15px' }}>
                  Konobarisanje, IT, tutoring, dostava i još mnogo toga
                </p>
              </div>
              <button onClick={() => navigate('/jobs/new')} style={{
                padding: '10px 20px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                flexShrink: 0, boxShadow: '0 4px 16px rgba(255,107,53,0.3)',
              }}>
                + Objavi oglas
              </button>
            </div>
          </AnimatedBlur>

          <AnimatedSection delay={0.1} direction="up">
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchJobs()}
                placeholder="Pretraži poslove..."
                style={{
                  flex: 1, padding: '11px 16px', borderRadius: '12px',
                  background: '#2C2C2E', color: '#E5E5EA', border: '1px solid #3A3A3C',
                  fontSize: '14px', outline: 'none',
                }}
              />
              <button onClick={fetchJobs} style={{
                padding: '11px 20px', borderRadius: '12px', border: 'none',
                background: '#FF6B35', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
              }}>
                Traži
              </button>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.15} direction="up">
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { value: '', label: '🔍 Sve' },
                { value: 'NUDIM', label: '💼 Nudim posao' },
                { value: 'TRAZIM', label: '🙋 Tražim posao' },
              ].map(t => (
                <button key={t.value} onClick={() => setActiveType(t.value)} style={{
                  padding: '7px 16px', borderRadius: '100px', border: 'none', cursor: 'pointer',
                  background: activeType === t.value ? '#FF6B35' : 'rgba(255,255,255,0.08)',
                  color: activeType === t.value ? 'white' : '#8E8E93',
                  fontSize: '13px', fontWeight: '600', transition: 'all 0.2s',
                }}>
                  {t.label}
                </button>
              ))}
              <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
              {Object.entries(CATEGORIES).map(([key, val]) => (
                <button key={key} onClick={() => setActiveCategory(activeCategory === key ? '' : key)} style={{
                  padding: '7px 16px', borderRadius: '100px', border: 'none', cursor: 'pointer',
                  background: activeCategory === key ? '#1C1C1E' : 'rgba(255,255,255,0.06)',
                  color: activeCategory === key ? 'white' : '#636366',
                  fontSize: '13px', fontWeight: '600', transition: 'all 0.2s',
                }}>
                  {val.emoji} {val.label}
                </button>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #FF6B35', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : jobs.length === 0 ? (
          <AnimatedScale>
            <div style={{ background: '#FDFCF9', borderRadius: '24px', padding: '64px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: '48px', marginBottom: '16px' }}>💼</p>
              <p style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '20px', marginBottom: '8px' }}>Nema oglasa</p>
              <p style={{ color: '#8E8E93', marginBottom: '24px' }}>Budi prvi koji objavljuje posao!</p>
              <button onClick={() => navigate('/jobs/new')} style={{
                padding: '12px 28px', borderRadius: '14px', border: 'none',
                background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                color: 'white', fontWeight: '700', cursor: 'pointer',
              }}>
                Objavi oglas
              </button>
            </div>
          </AnimatedScale>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '20px' }}>

            {/* Lista */}
            <div>
              <AnimatedSection delay={0}>
                <p style={{ fontSize: '13px', color: '#AEAEB2', fontWeight: '600', marginBottom: '16px' }}>
                  {jobs.length} oglasa
                </p>
              </AnimatedSection>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {jobs.map((job, i) => (
                  <AnimatedSection key={job.id} delay={i * 0.05} direction="right">
                    <div
                      onClick={() => setSelectedJob(job)}
                      style={{
                        background: selectedJob?.id === job.id ? '#FFF7ED' : '#FDFCF9',
                        borderRadius: '16px', padding: '16px', cursor: 'pointer',
                        border: selectedJob?.id === job.id ? '2px solid #FF6B35' : '2px solid transparent',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { if (selectedJob?.id !== job.id) e.currentTarget.style.borderColor = 'rgba(255,107,53,0.3)' }}
                      onMouseLeave={e => { if (selectedJob?.id !== job.id) e.currentTarget.style.borderColor = 'transparent' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '100px',
                            background: job.type === 'NUDIM' ? 'rgba(22,163,74,0.1)' : 'rgba(37,99,235,0.1)',
                            color: job.type === 'NUDIM' ? '#16A34A' : '#2563EB',
                          }}>
                            {job.type === 'NUDIM' ? '💼 Nudim' : '🙋 Tražim'}
                          </span>
                          {job.isRemote && (
                            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '100px', background: 'rgba(124,58,237,0.1)', color: '#7C3AED', fontWeight: '600' }}>
                              🌐 Remote
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '11px', color: '#AEAEB2' }}>{timeAgo(job.createdAt)}</span>
                      </div>

                      <p style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '14px', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {job.title}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '100px', background: '#FFF7ED', color: '#FF6B35', fontWeight: '600' }}>
                          {CATEGORIES[job.category]?.emoji} {CATEGORIES[job.category]?.label}
                        </span>
                        {job.location && <span style={{ fontSize: '12px', color: '#8E8E93' }}>📍 {job.location}</span>}
                      </div>

                      <p style={{ fontSize: '12px', color: '#8E8E93', marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {job.description}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', overflow: 'hidden' }}>
                            {job.author?.profileImage ? (
                              <img src={job.author.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #FF6B35, #FFB800)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', fontWeight: '700' }}>
                                {job.author?.firstName?.[0]}
                              </div>
                            )}
                          </div>
                          <span style={{ fontSize: '12px', color: '#8E8E93' }}>
                            {job.author?.firstName} {job.author?.lastName}
                          </span>
                        </div>
                        {job.salary && (
                          <span style={{ fontSize: '14px', fontWeight: '900', color: '#FF6B35' }}>
                            {job.salary} KM{job.salaryPeriod ? SALARY_PERIOD[job.salaryPeriod] : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </div>

            {/* Detalji */}
            <div style={{ position: 'sticky', top: '20px', alignSelf: 'flex-start' }}>
              {!selectedJob ? (
                <AnimatedScale>
                  <div style={{ background: '#FDFCF9', borderRadius: '20px', padding: '64px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <p style={{ fontSize: '40px', marginBottom: '12px' }}>👈</p>
                    <p style={{ color: '#8E8E93', fontWeight: '600' }}>Odaberi oglas za pregled</p>
                  </div>
                </AnimatedScale>
              ) : (
                <AnimatedSection direction="left" delay={0}>
                  <div style={{ background: '#FDFCF9', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>

                    {/* Job header */}
                    <div style={{
                      padding: '24px',
                      background: 'linear-gradient(135deg, #1C1C1E, #2C2C2E)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                            <span style={{
                              fontSize: '12px', fontWeight: '700', padding: '5px 12px', borderRadius: '100px',
                              background: selectedJob.type === 'NUDIM' ? 'rgba(22,163,74,0.2)' : 'rgba(37,99,235,0.2)',
                              color: selectedJob.type === 'NUDIM' ? '#4ADE80' : '#60A5FA',
                            }}>
                              {selectedJob.type === 'NUDIM' ? '💼 Nudim posao' : '🙋 Tražim posao'}
                            </span>
                            {selectedJob.isRemote && (
                              <span style={{ fontSize: '12px', fontWeight: '600', padding: '5px 12px', borderRadius: '100px', background: 'rgba(124,58,237,0.2)', color: '#A78BFA' }}>
                                🌐 Remote
                              </span>
                            )}
                          </div>
                          <h2 style={{ fontSize: '22px', fontWeight: '900', color: 'white', letterSpacing: '-0.02em' }}>
                            {selectedJob.title}
                          </h2>
                        </div>

                        {user.id === selectedJob.authorId && (
                          <button onClick={() => handleDelete(selectedJob.id)} style={{
                            padding: '8px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                            background: 'rgba(255,59,48,0.15)', color: '#FF3B30',
                          }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        <span style={{ fontSize: '13px', color: '#8E8E93' }}>
                          {CATEGORIES[selectedJob.category]?.emoji} {CATEGORIES[selectedJob.category]?.label}
                        </span>
                        {selectedJob.location && <span style={{ fontSize: '13px', color: '#8E8E93' }}>📍 {selectedJob.location}</span>}
                        {selectedJob.hours && <span style={{ fontSize: '13px', color: '#8E8E93' }}>⏰ {selectedJob.hours}</span>}
                        {selectedJob.salary && (
                          <span style={{ fontSize: '14px', fontWeight: '800', color: '#FF6B35' }}>
                            💰 {selectedJob.salary} KM{selectedJob.salaryPeriod ? SALARY_PERIOD[selectedJob.salaryPeriod] : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ padding: '24px' }}>
                      <h3 style={{ fontWeight: '800', color: '#1C1C1E', marginBottom: '12px' }}>O poslu</h3>
                      <p style={{ color: '#3A3A3C', lineHeight: '1.6', fontSize: '14px', marginBottom: '20px', whiteSpace: 'pre-wrap' }}>
                        {selectedJob.description}
                      </p>

                      <AnimatedLine />

                      <div style={{ marginTop: '20px', background: '#FFF7ED', borderRadius: '16px', padding: '16px' }}>
                        <h3 style={{ fontWeight: '800', color: '#1C1C1E', marginBottom: '14px' }}>Kontaktiraj oglašivača</h3>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', cursor: 'pointer' }}
                          onClick={() => navigate(`/profile/${selectedJob.authorId}`)}>
                          <div style={{ width: '44px', height: '44px', borderRadius: '12px', overflow: 'hidden' }}>
                            {selectedJob.author?.profileImage ? (
                              <img src={selectedJob.author.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #FF6B35, #FFB800)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700' }}>
                                {selectedJob.author?.firstName?.[0]}{selectedJob.author?.lastName?.[0]}
                              </div>
                            )}
                          </div>
                          <div>
                            <p style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '14px' }}>
                              {selectedJob.author?.firstName} {selectedJob.author?.lastName}
                            </p>
                            <p style={{ color: '#8E8E93', fontSize: '12px' }}>
                              {selectedJob.author?.faculty || 'Student'}
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {selectedJob.contactEmail && (
                            <a href={`mailto:${selectedJob.contactEmail}`} style={{
                              display: 'flex', alignItems: 'center', gap: '6px',
                              padding: '9px 16px', borderRadius: '12px',
                              background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                              color: 'white', fontSize: '13px', fontWeight: '700',
                              textDecoration: 'none',
                            }}>
                              ✉️ Email
                            </a>
                          )}
                          {selectedJob.contactPhone && (
                            <a href={`tel:${selectedJob.contactPhone}`} style={{
                              display: 'flex', alignItems: 'center', gap: '6px',
                              padding: '9px 16px', borderRadius: '12px',
                              background: 'white', color: '#FF6B35', fontSize: '13px', fontWeight: '700',
                              textDecoration: 'none',
                            }}>
                              📞 {selectedJob.contactPhone}
                            </a>
                          )}
                          {user.id !== selectedJob.authorId && (
                            <button onClick={() => navigate(`/chat/${selectedJob.authorId}`)} style={{
                              padding: '9px 16px', borderRadius: '12px', border: 'none',
                              background: 'white', color: '#1C1C1E', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                            }}>
                              💬 Poruka
                            </button>
                          )}
                        </div>
                      </div>

                      <p style={{ fontSize: '12px', color: '#AEAEB2', marginTop: '16px' }}>
                        Objavljeno {new Date(selectedJob.createdAt).toLocaleDateString('bs-BA', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </AnimatedSection>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}