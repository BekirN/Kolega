import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCompanyById, createReview } from '../api/companies'
import { getCompanyInternships, applyToInternship, getMyApplications } from '../api/internships'
import { AnimatedSection, AnimatedScale, AnimatedBlur } from '../components/Animated'

const SIZE_LABELS = {
  SMALL: 'Mala (1-50)',
  MEDIUM: 'Srednja (51-200)',
  LARGE: 'Velika (200+)'
}

const STATUS_CONFIG = {
  PENDING: { label: 'Na čekanju', color: '#FFB800', bg: 'rgba(255,184,0,0.1)', icon: '⏳' },
  REVIEWING: { label: 'U razmatranju', color: '#0EA5E9', bg: 'rgba(14,165,233,0.1)', icon: '👀' },
  INTERVIEW: { label: 'Intervju zakazan', color: '#7C3AED', bg: 'rgba(124,58,237,0.1)', icon: '🎯' },
  ACCEPTED: { label: 'Prihvaćeno', color: '#16A34A', bg: 'rgba(22,163,74,0.1)', icon: '🏆' },
  REJECTED: { label: 'Odbijeno', color: '#FF3B30', bg: 'rgba(255,59,48,0.1)', icon: '❌' },
}

const TYPE_LABELS = {
  FULL_TIME: '🏢 Full-time',
  PART_TIME: '⏰ Part-time',
  REMOTE: '🌐 Remote',
  HYBRID: '🔄 Hybrid',
}

// ─── Apply Modal ──────────────────────────────────────────────────
function ApplyModal({ internship, onClose, onSuccess }) {
  const [coverLetter, setCoverLetter] = useState('')
  const [cv, setCv] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const cvRef = useRef(null)

  const inputStyle = {
    background: '#EEEBE5', border: '1.5px solid #D8D4CC', color: '#1C1C1E',
    borderRadius: '12px', padding: '11px 14px', fontSize: '14px', width: '100%',
    outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box',
    fontFamily: 'inherit',
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await applyToInternship(internship.id, { coverLetter, cv })
      onSuccess()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Greška pri slanju prijave')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FDFCF9', borderRadius: '24px', padding: '28px',
          width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
          animation: 'scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`
          @keyframes scaleIn { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '22px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#1C1C1E', marginBottom: '4px' }}>
              Prijava na praksu
            </h2>
            <p style={{ fontSize: '13px', color: '#FF6B35', fontWeight: '700' }}>
              {internship.title}
            </p>
          </div>
          <button onClick={onClose} style={{
            width: '32px', height: '32px', borderRadius: '50%', border: 'none',
            background: '#EEEBE5', color: '#6B7280', cursor: 'pointer', fontSize: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>✕</button>
        </div>

        {/* Info kartica */}
        <div style={{
          padding: '14px 16px', borderRadius: '14px', marginBottom: '20px',
          background: 'rgba(255,107,53,0.06)', border: '1px solid rgba(255,107,53,0.15)',
          display: 'flex', gap: '16px', flexWrap: 'wrap',
        }}>
          {internship.isPaid && (
            <span style={{ fontSize: '12px', color: '#16A34A', fontWeight: '700' }}>
              💰 {internship.salary} KM/mj
            </span>
          )}
          {internship.type && (
            <span style={{ fontSize: '12px', color: '#FF6B35', fontWeight: '700' }}>
              {TYPE_LABELS[internship.type]}
            </span>
          )}
          {internship.duration && (
            <span style={{ fontSize: '12px', color: '#8E8E93', fontWeight: '600' }}>
              ⏱️ {internship.duration}
            </span>
          )}
        </div>

        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: '12px', marginBottom: '16px',
            background: 'rgba(255,59,48,0.1)', color: '#FF3B30',
            fontSize: '13px', border: '1px solid rgba(255,59,48,0.2)',
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Propratno pismo */}
          <div>
            <label style={{
              fontSize: '12px', fontWeight: '700', color: '#6B7280',
              marginBottom: '8px', display: 'block',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              Propratno pismo
            </label>
            <textarea
              value={coverLetter}
              onChange={e => setCoverLetter(e.target.value)}
              rows={5}
              style={{ ...inputStyle, resize: 'none' }}
              placeholder="Zašto se prijavljuješ na ovu praksu? Šta možeš donijeti firmi?"
              onFocus={e => e.target.style.borderColor = '#FF6B35'}
              onBlur={e => e.target.style.borderColor = '#D8D4CC'}
            />
          </div>

          {/* CV Upload */}
          <div>
            <label style={{
              fontSize: '12px', fontWeight: '700', color: '#6B7280',
              marginBottom: '8px', display: 'block',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              CV (PDF) – opciono
            </label>
            <div
              onClick={() => cvRef.current?.click()}
              style={{
                padding: '20px', borderRadius: '14px', cursor: 'pointer', textAlign: 'center',
                border: `2px dashed ${cv ? '#FF6B35' : '#D8D4CC'}`,
                background: cv ? '#FFF7ED' : '#F5F2ED',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!cv) e.currentTarget.style.borderColor = '#FF6B35' }}
              onMouseLeave={e => { if (!cv) e.currentTarget.style.borderColor = '#D8D4CC' }}
            >
              {cv ? (
                <div>
                  <p style={{ fontSize: '20px', marginBottom: '6px' }}>📄</p>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#FF6B35', marginBottom: '4px' }}>
                    {cv.name}
                  </p>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setCv(null) }}
                    style={{
                      padding: '4px 10px', borderRadius: '8px', border: 'none',
                      background: 'rgba(255,59,48,0.1)', color: '#FF3B30',
                      fontSize: '12px', cursor: 'pointer', marginTop: '4px',
                    }}>
                    Ukloni
                  </button>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: '24px', marginBottom: '8px' }}>📄</p>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#1C1C1E', marginBottom: '4px' }}>
                    Klikni za upload CV-a
                  </p>
                  <p style={{ fontSize: '12px', color: '#AEAEB2' }}>PDF · Max 5MB</p>
                </>
              )}
            </div>
            <input
              ref={cvRef}
              type="file"
              accept=".pdf"
              onChange={e => setCv(e.target.files[0])}
              style={{ display: 'none' }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '13px', borderRadius: '14px', border: 'none',
              background: '#EEEBE5', color: '#6B7280', fontWeight: '700', cursor: 'pointer',
            }}>
              Odustani
            </button>
            <button type="submit" disabled={loading} style={{
              flex: 2, padding: '13px', borderRadius: '14px', border: 'none',
              background: loading ? '#D8D4CC' : 'linear-gradient(135deg, #FF6B35, #FFB800)',
              color: loading ? '#AEAEB2' : 'white',
              fontWeight: '800', fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: !loading ? '0 4px 16px rgba(255,107,53,0.3)' : 'none',
            }}>
              {loading ? (
                <>
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid white', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                  Slanje...
                </>
              ) : '📋 Pošalji prijavu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Glavni CompanyDetail ─────────────────────────────────────────
export default function CompanyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [company, setCompany] = useState(null)
  const [internships, setInternships] = useState([])
  const [myApplications, setMyApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [applyingTo, setApplyingTo] = useState(null)
  const [applySuccess, setApplySuccess] = useState(false)
  const [reviewData, setReviewData] = useState({
    rating: 5, title: '', comment: '', position: '', year: '',
    mentorshipRating: 5, workEnvironmentRating: 5,
    learningRating: 5, paymentRating: 5,
  })
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState(false)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [companyData, internshipsData, applicationsData] = await Promise.all([
          getCompanyById(id),
          getCompanyInternships(id),
          getMyApplications(),
        ])
        setCompany(companyData)
        setInternships(internshipsData)
        setMyApplications(applicationsData)
      } catch (err) {
        navigate('/companies')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [id])

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    setReviewLoading(true)
    setReviewError('')
    try {
      await createReview(id, reviewData)
      const updated = await getCompanyById(id)
      setCompany(updated)
      setShowReviewForm(false)
      setReviewSuccess(true)
      setTimeout(() => setReviewSuccess(false), 4000)
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Greška pri dodavanju recenzije')
    } finally {
      setReviewLoading(false)
    }
  }

  const hasApplied = (internshipId) =>
    myApplications.some(a => a.internship?.id === internshipId || a.internshipId === internshipId)

  const getApplicationStatus = (internshipId) => {
    const app = myApplications.find(a => a.internship?.id === internshipId || a.internshipId === internshipId)
    return app?.status
  }

  const renderStars = (rating, size = 16) => (
    Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ fontSize: `${size}px`, color: i < Math.round(rating) ? '#FFB800' : '#D8D4CC' }}>★</span>
    ))
  )

  const StarSelect = ({ name, value }) => (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button key={star} type="button"
          onClick={() => setReviewData({ ...reviewData, [name]: star })}
          style={{
            fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer',
            color: star <= value ? '#FFB800' : '#D8D4CC',
            transition: 'transform 0.15s', padding: '0',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >★</button>
      ))}
    </div>
  )

  const inputStyle = {
    background: '#EEEBE5', border: '1.5px solid #D8D4CC', color: '#1C1C1E',
    borderRadius: '12px', padding: '11px 14px', fontSize: '14px', width: '100%',
    outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box',
    fontFamily: 'inherit',
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E2DDD6' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #FF6B35', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!company) return null
  const avgRating = company.averageRating || 0

  return (
    <div style={{ minHeight: '100vh', background: '#E2DDD6' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1C1C1E 0%, #1C2C1E 60%, #1C1C1E 100%)',
        padding: '32px 40px 40px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 50%, rgba(22,163,74,0.15), transparent 55%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 80%, rgba(255,107,53,0.08), transparent 50%)' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '960px', margin: '0 auto' }}>
          <AnimatedBlur delay={0}>
            <button onClick={() => navigate('/companies')} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', color: '#8E8E93',
              fontSize: '14px', cursor: 'pointer', marginBottom: '20px', padding: 0,
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Nazad na firme
            </button>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{
                  width: '72px', height: '72px', borderRadius: '18px', flexShrink: 0, overflow: 'hidden',
                  background: 'linear-gradient(135deg, #16A34A, #4ADE80)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '28px', fontWeight: '900', color: 'white',
                  boxShadow: '0 8px 24px rgba(22,163,74,0.3)',
                  border: '3px solid rgba(255,255,255,0.1)',
                }}>
                  {company.logoUrl
                    ? <img src={company.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : company.name?.[0]?.toUpperCase()
                  }
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <h1 style={{ fontSize: '26px', fontWeight: '900', color: 'white', letterSpacing: '-0.02em' }}>
                      {company.name}
                    </h1>
                    {company.isVerified && (
                      <span style={{
                        fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '100px',
                        background: 'rgba(22,163,74,0.2)', color: '#4ADE80',
                        border: '1px solid rgba(22,163,74,0.3)',
                      }}>✓ Verificirana</span>
                    )}
                  </div>
                  {company.industry && (
                    <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#4ADE80' }}>
                      {company.industry}
                    </p>
                  )}
                  {avgRating > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '2px' }}>{renderStars(avgRating)}</div>
                      <span style={{ color: '#FFB800', fontWeight: '700', fontSize: '14px' }}>{avgRating}</span>
                      <span style={{ color: '#636366', fontSize: '13px' }}>({company.reviewCount} recenzija)</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {[
                  { icon: '📍', value: company.city || '—' },
                  { icon: '👥', value: SIZE_LABELS[company.size] || '—' },
                  { icon: '🏢', value: `${internships.length} praks${internships.length === 1 ? 'a' : 'i'}` },
                ].map((s, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.08)', borderRadius: '12px',
                    padding: '10px 16px', backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    <span style={{ fontSize: '16px' }}>{s.icon}</span>
                    <span style={{ fontSize: '13px', color: '#E5E5EA', fontWeight: '600' }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedBlur>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '28px 32px' }}>

        {/* Success poruke */}
        {reviewSuccess && (
          <AnimatedScale>
            <div style={{
              padding: '14px 20px', borderRadius: '14px', marginBottom: '20px',
              background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.3)',
              display: 'flex', alignItems: 'center', gap: '10px', color: '#16A34A',
            }}>
              <span style={{ fontSize: '18px' }}>✅</span>
              <div>
                <p style={{ fontWeight: '800', fontSize: '14px', marginBottom: '1px' }}>Recenzija objavljena!</p>
                <p style={{ fontSize: '13px', opacity: 0.8 }}>Hvala što si podijelio/la iskustvo.</p>
              </div>
            </div>
          </AnimatedScale>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>

          {/* Lijeva kolona */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* O firmi */}
            {company.description && (
              <AnimatedSection delay={0.05} direction="up">
                <div style={{
                  background: '#EEEBE5', borderRadius: '20px', padding: '22px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.05)',
                }}>
                  <h3 style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '15px', marginBottom: '12px' }}>O firmi</h3>
                  <p style={{ color: '#3A3A3C', fontSize: '14px', lineHeight: '1.65' }}>{company.description}</p>
                </div>
              </AnimatedSection>
            )}

            {/* ─── PRAKSE ─────────────────────────────────────────── */}
            {internships.length > 0 && (
              <AnimatedSection delay={0.1} direction="up">
                <div style={{
                  background: '#EEEBE5', borderRadius: '20px', padding: '22px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.05)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3 style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '15px' }}>
                      🏢 Otvorene prakse ({internships.length})
                    </h3>
                    <button
                      onClick={() => navigate('/companies/my-applications')}
                      style={{
                        padding: '6px 14px', borderRadius: '10px', border: 'none',
                        background: '#F5F2ED', color: '#6B7280',
                        fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                      }}>
                      📋 Moje prijave
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {internships.map((internship, i) => {
                      const applied = hasApplied(internship.id)
                      const appStatus = getApplicationStatus(internship.id)
                      const statusConf = STATUS_CONFIG[appStatus]
                      const isExpired = internship.deadline && new Date(internship.deadline) < new Date()

                      return (
                        <AnimatedSection key={internship.id} delay={i * 0.04} direction="up">
                          <div style={{
                            background: '#F5F2ED', borderRadius: '16px', padding: '18px',
                            border: applied ? '2px solid rgba(255,107,53,0.2)' : '1px solid rgba(0,0,0,0.04)',
                            transition: 'box-shadow 0.2s',
                          }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                          >
                            {/* Header prakse */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                              <h4 style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '15px' }}>
                                {internship.title}
                              </h4>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flexShrink: 0 }}>
                                <span style={{
                                  fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '100px',
                                  background: internship.isPaid ? 'rgba(22,163,74,0.12)' : 'rgba(0,0,0,0.06)',
                                  color: internship.isPaid ? '#16A34A' : '#8E8E93',
                                }}>
                                  {internship.isPaid ? `💰 ${internship.salary} KM/mj` : 'Neplaćena'}
                                </span>
                                {internship.type && (
                                  <span style={{
                                    fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '100px',
                                    background: 'rgba(255,107,53,0.1)', color: '#FF6B35',
                                  }}>
                                    {TYPE_LABELS[internship.type]}
                                  </span>
                                )}
                              </div>
                            </div>

                            {internship.description && (
                              <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: '1.55', marginBottom: '12px' }}>
                                {internship.description}
                              </p>
                            )}

                            {/* Skills */}
                            {internship.skills?.length > 0 && (
                              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                {internship.skills.map(skill => (
                                  <span key={skill} style={{
                                    fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '100px',
                                    background: '#EEEBE5', color: '#3A3A3C',
                                  }}>
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Meta info */}
                            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '14px' }}>
                              {internship.location && (
                                <span style={{ fontSize: '12px', color: '#AEAEB2' }}>📍 {internship.location}</span>
                              )}
                              {internship.duration && (
                                <span style={{ fontSize: '12px', color: '#AEAEB2' }}>⏱️ {internship.duration}</span>
                              )}
                              {internship.deadline && (
                                <span style={{ fontSize: '12px', color: isExpired ? '#FF3B30' : '#AEAEB2' }}>
                                  📅 Rok: {new Date(internship.deadline).toLocaleDateString('bs-BA')}
                                  {isExpired && ' (Istekao)'}
                                </span>
                              )}
                              {internship._count?.applications !== undefined && (
                                <span style={{ fontSize: '12px', color: '#AEAEB2' }}>
                                  👥 {internship._count.applications} prijava
                                </span>
                              )}
                            </div>

                            {/* Akcija */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {applied ? (
                                <>
                                  <span style={{
                                    fontSize: '12px', fontWeight: '700', padding: '7px 14px', borderRadius: '100px',
                                    background: statusConf?.bg || 'rgba(0,0,0,0.06)',
                                    color: statusConf?.color || '#8E8E93',
                                  }}>
                                    {statusConf?.icon} {statusConf?.label || 'Prijavljeno'}
                                  </span>
                                  <button
                                    onClick={() => navigate('/companies/my-applications')}
                                    style={{
                                      padding: '7px 12px', borderRadius: '10px', border: 'none',
                                      background: '#F5F2ED', color: '#6B7280',
                                      fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                                    }}>
                                    Prati status →
                                  </button>
                                </>
                              ) : isExpired ? (
                                <span style={{ fontSize: '13px', color: '#FF3B30', fontWeight: '700' }}>
                                  ❌ Rok je istekao
                                </span>
                              ) : user.id ? (
                                <button
                                  onClick={() => setApplyingTo(internship)}
                                  style={{
                                    padding: '10px 22px', borderRadius: '12px', border: 'none',
                                    background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                                    color: 'white', fontWeight: '800', fontSize: '13px', cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(255,107,53,0.3)',
                                    transition: 'opacity 0.2s',
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                >
                                  📋 Prijavi se
                                </button>
                              ) : (
                                <button
                                  onClick={() => navigate('/login')}
                                  style={{
                                    padding: '10px 22px', borderRadius: '12px', border: 'none',
                                    background: '#EEEBE5', color: '#6B7280',
                                    fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                                  }}>
                                  Prijavi se da apliciraš
                                </button>
                              )}
                            </div>
                          </div>
                        </AnimatedSection>
                      )
                    })}
                  </div>
                </div>
              </AnimatedSection>
            )}

            {/* ─── RECENZIJE ───────────────────────────────────────── */}
            <AnimatedSection delay={0.15} direction="up">
              <div style={{
                background: '#EEEBE5', borderRadius: '20px', padding: '22px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.05)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '15px' }}>
                    ⭐ Recenzije ({company.reviews?.length || 0})
                  </h3>
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    style={{
                      padding: '8px 16px', borderRadius: '10px', border: 'none',
                      background: showReviewForm ? '#D8D4CC' : 'linear-gradient(135deg, #FF6B35, #FFB800)',
                      color: showReviewForm ? '#6B7280' : 'white',
                      fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                    {showReviewForm ? '✕ Odustani' : '+ Dodaj recenziju'}
                  </button>
                </div>

                {showReviewForm && (
                  <AnimatedScale delay={0}>
                    <div style={{
                      background: '#F5F2ED', borderRadius: '16px', padding: '20px',
                      marginBottom: '20px', border: '2px solid rgba(255,107,53,0.2)',
                    }}>
                      <h4 style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '15px', marginBottom: '16px' }}>
                        Nova recenzija
                      </h4>
                      {reviewError && (
                        <div style={{
                          padding: '12px 16px', borderRadius: '12px', marginBottom: '14px',
                          background: 'rgba(255,59,48,0.1)', color: '#FF3B30',
                          fontSize: '13px', border: '1px solid rgba(255,59,48,0.2)',
                        }}>⚠️ {reviewError}</div>
                      )}
                      <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Ukupna ocjena
                          </label>
                          <StarSelect name="rating" value={reviewData.rating} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '7px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pozicija</label>
                            <input value={reviewData.position} onChange={e => setReviewData({ ...reviewData, position: e.target.value })}
                              style={{ ...inputStyle, background: '#EEEBE5' }} placeholder="npr. Frontend Intern"
                              onFocus={e => e.target.style.borderColor = '#FF6B35'} onBlur={e => e.target.style.borderColor = '#D8D4CC'} />
                          </div>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '7px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Godina</label>
                            <input type="number" value={reviewData.year} onChange={e => setReviewData({ ...reviewData, year: e.target.value })}
                              style={{ ...inputStyle, background: '#EEEBE5' }} placeholder="2025"
                              onFocus={e => e.target.style.borderColor = '#FF6B35'} onBlur={e => e.target.style.borderColor = '#D8D4CC'} />
                          </div>
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '7px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Naslov *</label>
                          <input value={reviewData.title} onChange={e => setReviewData({ ...reviewData, title: e.target.value })} required
                            style={{ ...inputStyle, background: '#EEEBE5' }} placeholder="Kratki opis iskustva"
                            onFocus={e => e.target.style.borderColor = '#FF6B35'} onBlur={e => e.target.style.borderColor = '#D8D4CC'} />
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '7px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Komentar *</label>
                          <textarea value={reviewData.comment} onChange={e => setReviewData({ ...reviewData, comment: e.target.value })}
                            required rows={3} style={{ ...inputStyle, background: '#EEEBE5', resize: 'none' }}
                            placeholder="Opiši svoje iskustvo prakse..."
                            onFocus={e => e.target.style.borderColor = '#FF6B35'} onBlur={e => e.target.style.borderColor = '#D8D4CC'} />
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '12px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Detaljne ocjene</label>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            {[
                              { key: 'mentorshipRating', label: '👨‍🏫 Mentorstvo' },
                              { key: 'workEnvironmentRating', label: '🌟 Atmosfera' },
                              { key: 'learningRating', label: '📚 Učenje' },
                              { key: 'paymentRating', label: '💰 Naknada' },
                            ].map(({ key, label }) => (
                              <div key={key} style={{ background: '#EEEBE5', borderRadius: '12px', padding: '12px' }}>
                                <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px', fontWeight: '600' }}>{label}</p>
                                <StarSelect name={key} value={reviewData[key]} />
                              </div>
                            ))}
                          </div>
                        </div>
                        <button type="submit" disabled={reviewLoading} style={{
                          padding: '13px', borderRadius: '14px', border: 'none',
                          background: reviewLoading ? '#D8D4CC' : 'linear-gradient(135deg, #FF6B35, #FFB800)',
                          color: reviewLoading ? '#9A9690' : 'white',
                          fontSize: '14px', fontWeight: '800',
                          cursor: reviewLoading ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                          boxShadow: reviewLoading ? 'none' : '0 4px 16px rgba(255,107,53,0.3)',
                        }}>
                          {reviewLoading ? (
                            <><div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid white', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />Slanje...</>
                          ) : '⭐ Objavi recenziju'}
                        </button>
                      </form>
                    </div>
                  </AnimatedScale>
                )}

                {company.reviews?.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <p style={{ fontSize: '32px', marginBottom: '10px' }}>💬</p>
                    <p style={{ fontWeight: '700', color: '#1C1C1E', fontSize: '15px', marginBottom: '4px' }}>Nema recenzija</p>
                    <p style={{ color: '#AEAEB2', fontSize: '13px' }}>Budi prvi koji dijeli iskustvo prakse!</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {company.reviews.map((review, i) => (
                      <AnimatedSection key={review.id} delay={i * 0.05} direction="up">
                        <div style={{ background: '#F5F2ED', borderRadius: '16px', padding: '18px', border: '1px solid rgba(0,0,0,0.04)' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div>
                              <p style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '14px', marginBottom: '3px' }}>{review.title}</p>
                              <p style={{ fontSize: '12px', color: '#AEAEB2' }}>
                                {review.reviewer?.firstName} {review.reviewer?.lastName}
                                {review.position && ` · ${review.position}`}
                                {review.year && ` · ${review.year}`}
                              </p>
                            </div>
                            <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>{renderStars(review.rating, 14)}</div>
                          </div>
                          <p style={{ fontSize: '13px', color: '#3A3A3C', lineHeight: '1.55', marginBottom: '12px' }}>{review.comment}</p>
                          {(review.mentorshipRating || review.workEnvironmentRating || review.learningRating || review.paymentRating) && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                              {[
                                { label: '👨‍🏫 Mentorstvo', val: review.mentorshipRating },
                                { label: '🌟 Atmosfera', val: review.workEnvironmentRating },
                                { label: '📚 Učenje', val: review.learningRating },
                                { label: '💰 Naknada', val: review.paymentRating },
                              ].filter(s => s.val).map((s, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', background: 'rgba(0,0,0,0.04)', borderRadius: '8px' }}>
                                  <span style={{ fontSize: '11px', color: '#6B7280' }}>{s.label}</span>
                                  <span style={{ fontSize: '12px', color: '#FFB800', fontWeight: '700' }}>{'★'.repeat(s.val)}{'☆'.repeat(5 - s.val)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </AnimatedSection>
                    ))}
                  </div>
                )}
              </div>
            </AnimatedSection>
          </div>

          {/* ─── Desna kolona ──────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {avgRating > 0 && (
              <AnimatedScale delay={0.05}>
                <div style={{
                  background: '#EEEBE5', borderRadius: '20px', padding: '20px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.05)',
                  textAlign: 'center',
                }}>
                  <p style={{ fontSize: '11px', fontWeight: '700', color: '#AEAEB2', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                    Prosječna ocjena
                  </p>
                  <p style={{
                    fontSize: '52px', fontWeight: '900', lineHeight: 1, marginBottom: '8px',
                    background: 'linear-gradient(135deg, #FFB800, #FF6B35)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>{avgRating}</p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '3px', marginBottom: '6px' }}>
                    {renderStars(avgRating, 20)}
                  </div>
                  <p style={{ fontSize: '13px', color: '#AEAEB2' }}>{company.reviewCount} recenzija</p>
                </div>
              </AnimatedScale>
            )}

            {/* Moje prijave shortcut */}
            {myApplications.filter(a => internships.some(i => i.id === (a.internship?.id || a.internshipId))).length > 0 && (
              <AnimatedScale delay={0.07}>
                <div style={{
                  background: 'rgba(255,107,53,0.06)', borderRadius: '16px', padding: '16px',
                  border: '1px solid rgba(255,107,53,0.2)', cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                  onClick={() => navigate('/companies/my-applications')}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,107,53,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,107,53,0.06)'}
                >
                  <p style={{ fontSize: '13px', fontWeight: '800', color: '#FF6B35', marginBottom: '4px' }}>
                    📋 Tvoje prijave ovdje
                  </p>
                  <p style={{ fontSize: '12px', color: '#7A7570' }}>
                    Prijavio/la si se na {myApplications.filter(a => internships.some(i => i.id === (a.internship?.id || a.internshipId))).length} praks{myApplications.filter(a => internships.some(i => i.id === (a.internship?.id || a.internshipId))).length === 1 ? 'u' : 'e'} u ovoj firmi →
                  </p>
                </div>
              </AnimatedScale>
            )}

            {/* Kontakt */}
            <AnimatedScale delay={0.1}>
              <div style={{
                background: '#EEEBE5', borderRadius: '20px', padding: '20px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.05)',
              }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#AEAEB2', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>Kontakt</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {company.city && <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span>📍</span><span style={{ fontSize: '13px', color: '#3A3A3C' }}>{company.city}</span></div>}
                  {company.size && <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span>👥</span><span style={{ fontSize: '13px', color: '#3A3A3C' }}>{SIZE_LABELS[company.size]}</span></div>}
                  {company.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>✉️</span>
                      <a href={`mailto:${company.email}`} style={{ fontSize: '13px', color: '#FF6B35', textDecoration: 'none', fontWeight: '600' }}>{company.email}</a>
                    </div>
                  )}
                  {company.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>📞</span>
                      <a href={`tel:${company.phone}`} style={{ fontSize: '13px', color: '#FF6B35', textDecoration: 'none', fontWeight: '600' }}>{company.phone}</a>
                    </div>
                  )}
                  {company.website && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>🌐</span>
                      <a href={company.website} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '13px', color: '#FF6B35', textDecoration: 'none', fontWeight: '600', wordBreak: 'break-all' }}>
                        {company.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </AnimatedScale>

            <AnimatedScale delay={0.15}>
              <div style={{
                background: 'rgba(22,163,74,0.06)', borderRadius: '16px', padding: '16px',
                border: '1px solid rgba(22,163,74,0.15)',
              }}>
                <p style={{ fontSize: '12px', color: '#16A34A', fontWeight: '700', marginBottom: '8px' }}>
                  💡 Zašto ostaviti recenziju?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {['🎓 Pomozi drugim studentima', '📊 Dijeli iskustvo prakse', '⭐ Ocijeni kulturu firme', '💪 Utičeš na kvalitet prakse'].map((tip, i) => (
                    <p key={i} style={{ fontSize: '12px', color: '#7A7570', lineHeight: '1.4' }}>{tip}</p>
                  ))}
                </div>
              </div>
            </AnimatedScale>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {applyingTo && (
        <ApplyModal
          internship={applyingTo}
          onClose={() => setApplyingTo(null)}
          onSuccess={() => {
            setApplySuccess(true)
            setMyApplications(prev => [...prev, {
              internshipId: applyingTo.id,
              internship: applyingTo,
              status: 'PENDING',
            }])
            setTimeout(() => setApplySuccess(false), 4000)
          }}
        />
      )}

      {/* Apply success toast */}
      {applySuccess && (
        <div style={{
          position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, padding: '14px 24px', borderRadius: '100px',
          background: '#1C1C1E', color: 'white', fontSize: '14px', fontWeight: '700',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          display: 'flex', alignItems: 'center', gap: '10px',
          whiteSpace: 'nowrap',
        }}>
          <span style={{ color: '#4ADE80', fontSize: '16px' }}>✓</span>
          Prijava poslana! Pratite status u sekciji Moje prijave.
          <button
            onClick={() => navigate('/companies/my-applications')}
            style={{
              marginLeft: '8px', padding: '5px 12px', borderRadius: '100px', border: 'none',
              background: 'rgba(255,255,255,0.15)', color: 'white',
              fontSize: '12px', fontWeight: '700', cursor: 'pointer',
            }}>
            Pogledaj →
          </button>
        </div>
      )}
    </div>
  )
}