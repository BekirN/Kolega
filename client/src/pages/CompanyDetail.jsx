import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCompanyById, createReview } from '../api/companies'
import { AnimatedSection, AnimatedScale, AnimatedBlur } from '../components/Animated'

const SIZE_LABELS = {
  SMALL: 'Mala (1-50)',
  MEDIUM: 'Srednja (51-200)',
  LARGE: 'Velika (200+)'
}

export default function CompanyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewData, setReviewData] = useState({
    rating: 5, title: '', comment: '', position: '', year: '',
    mentorshipRating: 5, workEnvironmentRating: 5,
    learningRating: 5, paymentRating: 5,
  })
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState(false)

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const data = await getCompanyById(id)
        setCompany(data)
      } catch (err) {
        navigate('/companies')
      } finally {
        setLoading(false)
      }
    }
    fetchCompany()
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

  const renderStars = (rating, size = 16) => (
    Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{
        fontSize: `${size}px`,
        color: i < Math.round(rating) ? '#FFB800' : '#D8D4CC',
      }}>★</span>
    ))
  )

  const StarSelect = ({ name, value }) => (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => setReviewData({ ...reviewData, [name]: star })}
          style={{
            fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer',
            color: star <= value ? '#FFB800' : '#D8D4CC',
            transition: 'transform 0.15s, color 0.15s', padding: '0',
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
            <button
              onClick={() => navigate('/companies')}
              style={{
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
                {/* Logo firme */}
                <div style={{
                  width: '72px', height: '72px', borderRadius: '18px', flexShrink: 0,
                  background: 'linear-gradient(135deg, #16A34A, #4ADE80)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '28px', fontWeight: '900', color: 'white',
                  boxShadow: '0 8px 24px rgba(22,163,74,0.3)',
                  border: '3px solid rgba(255,255,255,0.1)',
                }}>
                  {company.name?.[0]?.toUpperCase()}
                </div>

                <div>
                  <h1 style={{
                    fontSize: '26px', fontWeight: '900', color: 'white',
                    letterSpacing: '-0.02em', marginBottom: '4px',
                  }}>
                    {company.name}
                  </h1>
                  {company.industry && (
                    <p style={{
                      fontSize: '14px', fontWeight: '600', marginBottom: '8px',
                      color: '#4ADE80',
                    }}>
                      {company.industry}
                    </p>
                  )}
                  {avgRating > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {renderStars(avgRating)}
                      </div>
                      <span style={{ color: '#FFB800', fontWeight: '700', fontSize: '14px' }}>
                        {avgRating}
                      </span>
                      <span style={{ color: '#636366', fontSize: '13px' }}>
                        ({company.reviewCount} recenzija)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {[
                  { icon: '📍', value: company.city || '—' },
                  { icon: '👥', value: SIZE_LABELS[company.size] || '—' },
                  { icon: '🏢', value: `${company.internships?.length || 0} praks${company.internships?.length === 1 ? 'a' : 'i'}` },
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

        {/* Success poruka */}
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
                  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(0,0,0,0.05)',
                }}>
                  <h3 style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '15px', marginBottom: '12px' }}>
                    O firmi
                  </h3>
                  <p style={{ color: '#3A3A3C', fontSize: '14px', lineHeight: '1.65' }}>
                    {company.description}
                  </p>
                </div>
              </AnimatedSection>
            )}

            {/* Prakse */}
            {company.internships?.length > 0 && (
              <AnimatedSection delay={0.1} direction="up">
                <div style={{
                  background: '#EEEBE5', borderRadius: '20px', padding: '22px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(0,0,0,0.05)',
                }}>
                  <h3 style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '15px', marginBottom: '16px' }}>
                    🏢 Otvorene prakse ({company.internships.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {company.internships.map((internship, i) => (
                      <AnimatedSection key={internship.id} delay={i * 0.05} direction="up">
                        <div style={{
                          background: '#F5F2ED', borderRadius: '16px', padding: '18px',
                          border: '1px solid rgba(0,0,0,0.04)',
                          transition: 'box-shadow 0.2s',
                        }}
                          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
                          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px', gap: '12px' }}>
                            <h4 style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '15px' }}>
                              {internship.title}
                            </h4>
                            <span style={{
                              fontSize: '12px', fontWeight: '700', padding: '4px 10px',
                              borderRadius: '100px', flexShrink: 0,
                              background: internship.isPaid ? 'rgba(22,163,74,0.12)' : 'rgba(0,0,0,0.06)',
                              color: internship.isPaid ? '#16A34A' : '#8E8E93',
                            }}>
                              {internship.isPaid ? `💰 ${internship.salary} KM/mj` : 'Neplaćena'}
                            </span>
                          </div>

                          {internship.description && (
                            <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: '1.5', marginBottom: '10px' }}>
                              {internship.description}
                            </p>
                          )}

                          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            {internship.requirements && (
                              <p style={{ fontSize: '12px', color: '#AEAEB2' }}>
                                📋 {internship.requirements}
                              </p>
                            )}
                            {internship.duration && (
                              <p style={{ fontSize: '12px', color: '#AEAEB2' }}>
                                ⏱️ {internship.duration}
                              </p>
                            )}
                          </div>
                        </div>
                      </AnimatedSection>
                    ))}
                  </div>
                </div>
              </AnimatedSection>
            )}

            {/* Recenzije */}
            <AnimatedSection delay={0.15} direction="up">
              <div style={{
                background: '#EEEBE5', borderRadius: '20px', padding: '22px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.05)',
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
                      fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}>
                    {showReviewForm ? '✕ Odustani' : '+ Dodaj recenziju'}
                  </button>
                </div>

                {/* Forma za recenziju */}
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
                        }}>
                          ⚠️ {reviewError}
                        </div>
                      )}

                      <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                        {/* Ukupna ocjena */}
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Ukupna ocjena
                          </label>
                          <StarSelect name="rating" value={reviewData.rating} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '7px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              Pozicija
                            </label>
                            <input
                              value={reviewData.position}
                              onChange={e => setReviewData({ ...reviewData, position: e.target.value })}
                              style={{ ...inputStyle, background: '#EEEBE5' }}
                              placeholder="npr. Frontend Intern"
                              onFocus={e => e.target.style.borderColor = '#FF6B35'}
                              onBlur={e => e.target.style.borderColor = '#D8D4CC'}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '7px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              Godina
                            </label>
                            <input
                              type="number"
                              value={reviewData.year}
                              onChange={e => setReviewData({ ...reviewData, year: e.target.value })}
                              style={{ ...inputStyle, background: '#EEEBE5' }}
                              placeholder="2025"
                              onFocus={e => e.target.style.borderColor = '#FF6B35'}
                              onBlur={e => e.target.style.borderColor = '#D8D4CC'}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '7px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Naslov recenzije *
                          </label>
                          <input
                            value={reviewData.title}
                            onChange={e => setReviewData({ ...reviewData, title: e.target.value })}
                            required
                            style={{ ...inputStyle, background: '#EEEBE5' }}
                            placeholder="Kratki opis iskustva"
                            onFocus={e => e.target.style.borderColor = '#FF6B35'}
                            onBlur={e => e.target.style.borderColor = '#D8D4CC'}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '7px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Komentar *
                          </label>
                          <textarea
                            value={reviewData.comment}
                            onChange={e => setReviewData({ ...reviewData, comment: e.target.value })}
                            required
                            rows={3}
                            style={{ ...inputStyle, background: '#EEEBE5', resize: 'none' }}
                            placeholder="Opiši svoje iskustvo prakse..."
                            onFocus={e => e.target.style.borderColor = '#FF6B35'}
                            onBlur={e => e.target.style.borderColor = '#D8D4CC'}
                          />
                        </div>

                        {/* Detaljne ocjene */}
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '12px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Detaljne ocjene
                          </label>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {[
                              { key: 'mentorshipRating', label: '👨‍🏫 Mentorstvo' },
                              { key: 'workEnvironmentRating', label: '🌟 Atmosfera' },
                              { key: 'learningRating', label: '📚 Učenje' },
                              { key: 'paymentRating', label: '💰 Naknada' },
                            ].map(({ key, label }) => (
                              <div key={key} style={{
                                background: '#EEEBE5', borderRadius: '12px', padding: '12px',
                              }}>
                                <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px', fontWeight: '600' }}>
                                  {label}
                                </p>
                                <StarSelect name={key} value={reviewData[key]} />
                              </div>
                            ))}
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={reviewLoading}
                          style={{
                            padding: '13px', borderRadius: '14px', border: 'none',
                            background: reviewLoading ? '#D8D4CC' : 'linear-gradient(135deg, #FF6B35, #FFB800)',
                            color: reviewLoading ? '#9A9690' : 'white',
                            fontSize: '14px', fontWeight: '800',
                            cursor: reviewLoading ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            boxShadow: reviewLoading ? 'none' : '0 4px 16px rgba(255,107,53,0.3)',
                          }}>
                          {reviewLoading ? (
                            <>
                              <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid white', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                              Slanje...
                            </>
                          ) : '⭐ Objavi recenziju'}
                        </button>
                      </form>
                    </div>
                  </AnimatedScale>
                )}

                {/* Lista recenzija */}
                {company.reviews?.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <p style={{ fontSize: '32px', marginBottom: '10px' }}>💬</p>
                    <p style={{ fontWeight: '700', color: '#1C1C1E', fontSize: '15px', marginBottom: '4px' }}>
                      Nema recenzija
                    </p>
                    <p style={{ color: '#AEAEB2', fontSize: '13px' }}>
                      Budi prvi koji dijeli iskustvo prakse!
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {company.reviews.map((review, i) => (
                      <AnimatedSection key={review.id} delay={i * 0.05} direction="up">
                        <div style={{
                          background: '#F5F2ED', borderRadius: '16px', padding: '18px',
                          border: '1px solid rgba(0,0,0,0.04)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div>
                              <p style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '14px', marginBottom: '3px' }}>
                                {review.title}
                              </p>
                              <p style={{ fontSize: '12px', color: '#AEAEB2' }}>
                                {review.reviewer?.firstName} {review.reviewer?.lastName}
                                {review.position && ` · ${review.position}`}
                                {review.year && ` · ${review.year}`}
                              </p>
                            </div>
                            <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                              {renderStars(review.rating, 14)}
                            </div>
                          </div>

                          <p style={{ fontSize: '13px', color: '#3A3A3C', lineHeight: '1.55', marginBottom: '12px' }}>
                            {review.comment}
                          </p>

                          {/* Detaljne ocjene */}
                          {(review.mentorshipRating || review.workEnvironmentRating || review.learningRating || review.paymentRating) && (
                            <div style={{
                              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px',
                              paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.06)',
                            }}>
                              {[
                                { label: '👨‍🏫 Mentorstvo', val: review.mentorshipRating },
                                { label: '🌟 Atmosfera', val: review.workEnvironmentRating },
                                { label: '📚 Učenje', val: review.learningRating },
                                { label: '💰 Naknada', val: review.paymentRating },
                              ].filter(s => s.val).map((s, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', background: 'rgba(0,0,0,0.04)', borderRadius: '8px' }}>
                                  <span style={{ fontSize: '11px', color: '#6B7280' }}>{s.label}</span>
                                  <span style={{ fontSize: '12px', color: '#FFB800', fontWeight: '700' }}>
                                    {'★'.repeat(s.val)}{'☆'.repeat(5 - s.val)}
                                  </span>
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

          {/* Desna kolona */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Rating overview */}
            {avgRating > 0 && (
              <AnimatedScale delay={0.05}>
                <div style={{
                  background: '#EEEBE5', borderRadius: '20px', padding: '20px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(0,0,0,0.05)',
                  textAlign: 'center',
                }}>
                  <p style={{ fontSize: '11px', fontWeight: '700', color: '#AEAEB2', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                    Prosječna ocjena
                  </p>
                  <p style={{
                    fontSize: '52px', fontWeight: '900', lineHeight: 1, marginBottom: '8px',
                    background: 'linear-gradient(135deg, #FFB800, #FF6B35)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>
                    {avgRating}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '3px', marginBottom: '6px' }}>
                    {renderStars(avgRating, 20)}
                  </div>
                  <p style={{ fontSize: '13px', color: '#AEAEB2' }}>
                    {company.reviewCount} recenzija
                  </p>
                </div>
              </AnimatedScale>
            )}

            {/* Kontakt info */}
            <AnimatedScale delay={0.1}>
              <div style={{
                background: '#EEEBE5', borderRadius: '20px', padding: '20px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.05)',
              }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#AEAEB2', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
                  Kontakt
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {company.city && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px', flexShrink: 0 }}>📍</span>
                      <span style={{ fontSize: '13px', color: '#3A3A3C' }}>{company.city}</span>
                    </div>
                  )}
                  {company.size && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px', flexShrink: 0 }}>👥</span>
                      <span style={{ fontSize: '13px', color: '#3A3A3C' }}>{SIZE_LABELS[company.size]}</span>
                    </div>
                  )}
                  {company.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px', flexShrink: 0 }}>✉️</span>
                      <a href={`mailto:${company.email}`} style={{
                        fontSize: '13px', color: '#FF6B35', textDecoration: 'none', fontWeight: '600',
                      }}>
                        {company.email}
                      </a>
                    </div>
                  )}
                  {company.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px', flexShrink: 0 }}>📞</span>
                      <a href={`tel:${company.phone}`} style={{
                        fontSize: '13px', color: '#FF6B35', textDecoration: 'none', fontWeight: '600',
                      }}>
                        {company.phone}
                      </a>
                    </div>
                  )}
                  {company.website && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px', flexShrink: 0 }}>🌐</span>
                      
                      <a href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '13px', color: '#FF6B35', textDecoration: 'none',
                          fontWeight: '600', wordBreak: 'break-all',
                        }}>
                        {company.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </AnimatedScale>

            {/* Info box */}
            <AnimatedScale delay={0.15}>
              <div style={{
                background: 'rgba(22,163,74,0.06)', borderRadius: '16px', padding: '16px',
                border: '1px solid rgba(22,163,74,0.15)',
              }}>
                <p style={{ fontSize: '12px', color: '#16A34A', fontWeight: '700', marginBottom: '8px' }}>
                  💡 Zašto ostaviti recenziju?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {[
                    '🎓 Pomozi drugim studentima',
                    '📊 Dijeli iskustvo prakse',
                    '⭐ Ocijeni kulturu firme',
                    '💪 Utičeš na kvalitet prakse',
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