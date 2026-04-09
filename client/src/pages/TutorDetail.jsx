import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getTutorById, createBooking, createTutorReview } from '../api/tutoring'
import { AnimatedSection, AnimatedScale, AnimatedBlur } from '../components/Animated'

export default function TutorDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tutor, setTutor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [bookingData, setBookingData] = useState({
    subject: '', date: '', duration: '60', message: '',
  })
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' })
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    const fetchTutor = async () => {
      try {
        const data = await getTutorById(id)
        setTutor(data)
      } catch (err) {
        navigate('/tutoring')
      } finally {
        setLoading(false)
      }
    }
    fetchTutor()
  }, [id])

  const handleBooking = async (e) => {
    e.preventDefault()
    setBookingLoading(true)
    setBookingError('')
    try {
      await createBooking(id, bookingData)
      setShowBookingForm(false)
      setBookingSuccess(true)
      setTimeout(() => setBookingSuccess(false), 4000)
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Greška pri rezervaciji')
    } finally {
      setBookingLoading(false)
    }
  }

  const handleReview = async (e) => {
    e.preventDefault()
    try {
      await createTutorReview(id, reviewData)
      const updated = await getTutorById(id)
      setTutor(updated)
      setShowReviewForm(false)
    } catch (err) {
      console.error(err)
    }
  }

  const calculatePrice = () => {
    if (!tutor || !bookingData.duration) return 0
    return Math.round((tutor.hourlyRate / 60) * parseInt(bookingData.duration) * 100) / 100
  }

  const renderStars = (rating, interactive = false, onSelect = null) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        onClick={() => interactive && onSelect?.(i + 1)}
        style={{
          fontSize: interactive ? '28px' : '16px',
          color: i < Math.round(rating) ? '#FFB800' : '#D8D4CC',
          cursor: interactive ? 'pointer' : 'default',
          transition: 'color 0.15s, transform 0.15s',
        }}
        onMouseEnter={e => { if (interactive) e.currentTarget.style.transform = 'scale(1.2)' }}
        onMouseLeave={e => { if (interactive) e.currentTarget.style.transform = 'scale(1)' }}
      >★</span>
    ))
  }

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

  if (!tutor) return null

  const isOwnProfile = tutor.user?.id === user.id

  return (
    <div style={{ minHeight: '100vh', background: '#E2DDD6' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1C1C1E 0%, #2C1810 60%, #1C1C1E 100%)',
        padding: '32px 40px 40px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 50%, rgba(255,107,53,0.18), transparent 55%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 80%, rgba(255,184,0,0.1), transparent 50%)' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '860px', margin: '0 auto' }}>
          <AnimatedBlur delay={0}>
            <button
              onClick={() => navigate('/tutoring')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'none', border: 'none', color: '#8E8E93',
                fontSize: '14px', cursor: 'pointer', marginBottom: '20px', padding: 0,
              }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Nazad na instrukcije
            </button>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                {/* Avatar */}
                <div style={{
                  width: '80px', height: '80px', borderRadius: '20px', overflow: 'hidden', flexShrink: 0,
                  border: '3px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                }}>
                  {tutor.user?.profileImage ? (
                    <img src={tutor.user.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: '900', fontSize: '28px',
                    }}>
                      {tutor.user?.firstName?.[0]}{tutor.user?.lastName?.[0]}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <h1 style={{
                      fontSize: '26px', fontWeight: '900', color: 'white',
                      letterSpacing: '-0.02em', margin: 0,
                    }}>
                      {tutor.user?.firstName} {tutor.user?.lastName}
                    </h1>
                    {tutor.user?.verificationStatus === 'VERIFIED' && (
                      <span style={{
                        fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '100px',
                        background: 'rgba(22,163,74,0.2)', color: '#4ADE80',
                        border: '1px solid rgba(22,163,74,0.3)',
                      }}>
                        🎓 Verifikovani Student
                      </span>
                    )}
                  </div>
                  {tutor.user?.faculty && (
                    <p style={{ color: '#8E8E93', fontSize: '14px', marginBottom: '8px' }}>
                      {tutor.user.faculty}
                      {tutor.user?.university && ` · ${tutor.user.university}`}
                    </p>
                  )}
                  {tutor.averageRating > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {renderStars(tutor.averageRating)}
                      </div>
                      <span style={{ color: '#FFB800', fontWeight: '700', fontSize: '14px' }}>
                        {tutor.averageRating}
                      </span>
                      <span style={{ color: '#636366', fontSize: '13px' }}>
                        ({tutor.reviewCount} recenzija)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cijena */}
              <div style={{
                background: 'rgba(255,255,255,0.08)', borderRadius: '18px', padding: '16px 24px',
                textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(8px)',
              }}>
                <p style={{ color: '#8E8E93', fontSize: '12px', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Cijena
                </p>
                <p style={{
                  fontSize: '32px', fontWeight: '900', lineHeight: 1,
                  background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  {tutor.hourlyRate} KM
                </p>
                <p style={{ color: '#636366', fontSize: '12px', marginTop: '4px' }}>po satu</p>
              </div>
            </div>
          </AnimatedBlur>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '28px 32px' }}>

        {/* Success poruka */}
        {bookingSuccess && (
          <AnimatedScale>
            <div style={{
              padding: '16px 20px', borderRadius: '16px', marginBottom: '20px',
              background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.3)',
              display: 'flex', alignItems: 'center', gap: '12px', color: '#16A34A',
            }}>
              <span style={{ fontSize: '20px' }}>✅</span>
              <div>
                <p style={{ fontWeight: '800', fontSize: '14px', marginBottom: '2px' }}>Termin uspješno rezervisan!</p>
                <p style={{ fontSize: '13px', opacity: 0.8 }}>Tutor će potvrditi tvoj termin u najkraćem roku.</p>
              </div>
            </div>
          </AnimatedScale>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>

          {/* Lijeva kolona */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Bio */}
            {tutor.bio && (
              <AnimatedSection delay={0.05} direction="up">
                <div style={{
                  background: '#EEEBE5', borderRadius: '20px', padding: '22px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(0,0,0,0.05)',
                }}>
                  <h3 style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '15px', marginBottom: '12px' }}>
                    O tutoru
                  </h3>
                  <p style={{ color: '#3A3A3C', fontSize: '14px', lineHeight: '1.65' }}>
                    {tutor.bio}
                  </p>
                </div>
              </AnimatedSection>
            )}

            {/* Predmeti */}
            <AnimatedSection delay={0.1} direction="up">
              <div style={{
                background: '#EEEBE5', borderRadius: '20px', padding: '22px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.05)',
              }}>
                <h3 style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '15px', marginBottom: '14px' }}>
                  📚 Predmeti
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {tutor.subjects?.map((subject, i) => (
                    <span key={i} style={{
                      padding: '7px 14px', borderRadius: '100px',
                      background: 'rgba(255,107,53,0.1)', color: '#FF6B35',
                      fontSize: '13px', fontWeight: '700',
                      border: '1px solid rgba(255,107,53,0.2)',
                    }}>
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            </AnimatedSection>

            {/* Booking forma */}
            {showBookingForm && (
              <AnimatedScale delay={0}>
                <div style={{
                  background: '#EEEBE5', borderRadius: '20px', padding: '24px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                  border: '2px solid rgba(255,107,53,0.25)',
                }}>
                  <h3 style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '17px', marginBottom: '20px' }}>
                    📅 Rezerviši termin
                  </h3>

                  {bookingError && (
                    <div style={{
                      padding: '12px 16px', borderRadius: '12px', marginBottom: '16px',
                      background: 'rgba(255,59,48,0.1)', color: '#FF3B30',
                      fontSize: '13px', border: '1px solid rgba(255,59,48,0.2)',
                    }}>
                      ⚠️ {bookingError}
                    </div>
                  )}

                  <form onSubmit={handleBooking} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '7px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Predmet *
                      </label>
                      <input
                        value={bookingData.subject}
                        onChange={e => setBookingData({ ...bookingData, subject: e.target.value })}
                        required
                        style={inputStyle}
                        placeholder="npr. Matematička analiza"
                        onFocus={e => e.target.style.borderColor = '#FF6B35'}
                        onBlur={e => e.target.style.borderColor = '#D8D4CC'}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '7px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Datum i vrijeme *
                        </label>
                        <input
                          type="datetime-local"
                          value={bookingData.date}
                          onChange={e => setBookingData({ ...bookingData, date: e.target.value })}
                          required
                          style={inputStyle}
                          onFocus={e => e.target.style.borderColor = '#FF6B35'}
                          onBlur={e => e.target.style.borderColor = '#D8D4CC'}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '7px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Trajanje
                        </label>
                        <select
                          value={bookingData.duration}
                          onChange={e => setBookingData({ ...bookingData, duration: e.target.value })}
                          style={{ ...inputStyle, cursor: 'pointer' }}
                          onFocus={e => e.target.style.borderColor = '#FF6B35'}
                          onBlur={e => e.target.style.borderColor = '#D8D4CC'}
                        >
                          <option value="30">30 minuta</option>
                          <option value="60">1 sat</option>
                          <option value="90">1.5 sat</option>
                          <option value="120">2 sata</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '7px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Poruka tutoru
                      </label>
                      <textarea
                        value={bookingData.message}
                        onChange={e => setBookingData({ ...bookingData, message: e.target.value })}
                        rows={3}
                        style={{ ...inputStyle, resize: 'none' }}
                        placeholder="Opiši šta ti treba pomoć..."
                        onFocus={e => e.target.style.borderColor = '#FF6B35'}
                        onBlur={e => e.target.style.borderColor = '#D8D4CC'}
                      />
                    </div>

                    {/* Cijena kalkulacija */}
                    <div style={{
                      padding: '14px 18px', borderRadius: '14px',
                      background: 'rgba(255,107,53,0.08)',
                      border: '1px solid rgba(255,107,53,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <div>
                        <p style={{ color: '#FF6B35', fontSize: '12px', fontWeight: '600', marginBottom: '2px' }}>
                          Ukupna cijena
                        </p>
                        <p style={{ color: '#7A7570', fontSize: '12px' }}>
                          {tutor.hourlyRate} KM/h × {bookingData.duration} min
                        </p>
                      </div>
                      <p style={{ fontSize: '24px', fontWeight: '900', color: '#FF6B35' }}>
                        {calculatePrice()} KM
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={bookingLoading}
                      style={{
                        padding: '13px', borderRadius: '14px', border: 'none',
                        background: bookingLoading ? '#D8D4CC' : 'linear-gradient(135deg, #FF6B35, #FFB800)',
                        color: bookingLoading ? '#9A9690' : 'white',
                        fontSize: '14px', fontWeight: '800',
                        cursor: bookingLoading ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        boxShadow: bookingLoading ? 'none' : '0 4px 16px rgba(255,107,53,0.3)',
                      }}>
                      {bookingLoading ? (
                        <>
                          <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid white', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                          Rezervisanje...
                        </>
                      ) : '✓ Potvrdi rezervaciju'}
                    </button>
                  </form>
                </div>
              </AnimatedScale>
            )}

            {/* Review forma */}
            {showReviewForm && (
              <AnimatedScale delay={0}>
                <div style={{
                  background: '#EEEBE5', borderRadius: '20px', padding: '24px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                  border: '2px solid rgba(255,184,0,0.25)',
                }}>
                  <h3 style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '17px', marginBottom: '20px' }}>
                    ⭐ Ostavi recenziju
                  </h3>
                  <form onSubmit={handleReview} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '10px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Ocjena
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {renderStars(reviewData.rating, true, (rating) => setReviewData({ ...reviewData, rating }))}
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '7px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Komentar
                      </label>
                      <textarea
                        value={reviewData.comment}
                        onChange={e => setReviewData({ ...reviewData, comment: e.target.value })}
                        rows={3}
                        style={{ ...inputStyle, resize: 'none' }}
                        placeholder="Kako bi opisao/la ovog instruktora?"
                        onFocus={e => e.target.style.borderColor = '#FFB800'}
                        onBlur={e => e.target.style.borderColor = '#D8D4CC'}
                      />
                    </div>
                    <button type="submit" style={{
                      padding: '13px', borderRadius: '14px', border: 'none',
                      background: 'linear-gradient(135deg, #FFB800, #FF6B35)',
                      color: 'white', fontSize: '14px', fontWeight: '800', cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(255,184,0,0.3)',
                    }}>
                      ⭐ Objavi recenziju
                    </button>
                  </form>
                </div>
              </AnimatedScale>
            )}

            {/* Recenzije */}
            {tutor.reviews?.length > 0 && (
              <AnimatedSection delay={0.15} direction="up">
                <div style={{
                  background: '#EEEBE5', borderRadius: '20px', padding: '22px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(0,0,0,0.05)',
                }}>
                  <h3 style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '15px', marginBottom: '16px' }}>
                    ⭐ Recenzije ({tutor.reviews.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {tutor.reviews.map((review, i) => (
                      <AnimatedSection key={review.id} delay={i * 0.05} direction="up">
                        <div style={{
                          background: '#F5F2ED', borderRadius: '14px', padding: '16px',
                          border: '1px solid rgba(0,0,0,0.04)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', gap: '2px' }}>
                              {renderStars(review.rating)}
                            </div>
                            <span style={{ fontSize: '12px', color: '#AEAEB2' }}>
                              {new Date(review.createdAt).toLocaleDateString('bs-BA')}
                            </span>
                          </div>
                          {review.comment && (
                            <p style={{ fontSize: '13px', color: '#3A3A3C', lineHeight: '1.5' }}>
                              {review.comment}
                            </p>
                          )}
                          {review.student && (
                            <p style={{ fontSize: '12px', color: '#AEAEB2', marginTop: '8px' }}>
                              — {review.student.firstName} {review.student.lastName}
                            </p>
                          )}
                        </div>
                      </AnimatedSection>
                    ))}
                  </div>
                </div>
              </AnimatedSection>
            )}
          </div>

          {/* Desna kolona – Akcije */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Statistike */}
            <AnimatedScale delay={0.05}>
              <div style={{
                background: '#EEEBE5', borderRadius: '20px', padding: '20px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.05)',
              }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#AEAEB2', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
                  Statistike
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { icon: '⭐', label: 'Prosječna ocjena', value: tutor.averageRating > 0 ? tutor.averageRating : '—' },
                    { icon: '💬', label: 'Recenzije', value: tutor.reviewCount || 0 },
                    { icon: '📚', label: 'Predmeta', value: tutor.subjects?.length || 0 },
                    { icon: '💰', label: 'Cijena', value: `${tutor.hourlyRate} KM/h` },
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>{s.icon} {s.label}</span>
                      <span style={{
                        fontWeight: '800', fontSize: '13px', padding: '2px 10px',
                        borderRadius: '100px', background: '#FFF7ED', color: '#FF6B35',
                      }}>
                        {s.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedScale>

            {/* Akcije dugmad */}
            {!isOwnProfile && (
              <AnimatedScale delay={0.1}>
                <div style={{
                  background: '#EEEBE5', borderRadius: '20px', padding: '20px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(0,0,0,0.05)',
                  display: 'flex', flexDirection: 'column', gap: '10px',
                }}>
                  <button
                    onClick={() => { setShowBookingForm(!showBookingForm); setShowReviewForm(false) }}
                    style={{
                      padding: '13px', borderRadius: '14px', border: 'none',
                      background: showBookingForm
                        ? '#D8D4CC'
                        : 'linear-gradient(135deg, #FF6B35, #FFB800)',
                      color: showBookingForm ? '#6B7280' : 'white',
                      fontSize: '14px', fontWeight: '800', cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: showBookingForm ? 'none' : '0 4px 16px rgba(255,107,53,0.3)',
                    }}>
                    {showBookingForm ? '✕ Odustani' : '📅 Rezerviši termin'}
                  </button>

                  <button
                    onClick={() => { setShowReviewForm(!showReviewForm); setShowBookingForm(false) }}
                    style={{
                      padding: '13px', borderRadius: '14px', border: 'none',
                      background: showReviewForm ? '#D8D4CC' : '#F5F2ED',
                      color: showReviewForm ? '#6B7280' : '#FF6B35',
                      fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                      transition: 'all 0.2s',
                      border: `1.5px solid ${showReviewForm ? 'transparent' : 'rgba(255,107,53,0.2)'}`,
                    }}>
                    {showReviewForm ? '✕ Odustani' : '⭐ Ostavi recenziju'}
                  </button>

                  <button
                    onClick={() => navigate(`/chat/${tutor.user?.id}`)}
                    style={{
                      padding: '13px', borderRadius: '14px', border: 'none',
                      background: '#F5F2ED', color: '#1C1C1E',
                      fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                      border: '1.5px solid rgba(0,0,0,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Pošalji poruku
                  </button>

                  <button
                    onClick={() => navigate(`/profile/${tutor.user?.id}`)}
                    style={{
                      padding: '13px', borderRadius: '14px', border: 'none',
                      background: '#F5F2ED', color: '#6B7280',
                      fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                      border: '1.5px solid rgba(0,0,0,0.06)',
                    }}>
                    👤 Pogledaj profil
                  </button>
                </div>
              </AnimatedScale>
            )}

            {/* Info za dostupnost */}
            <AnimatedScale delay={0.15}>
              <div style={{
                background: 'rgba(255,107,53,0.06)', borderRadius: '16px', padding: '16px',
                border: '1px solid rgba(255,107,53,0.15)',
              }}>
                <p style={{ fontSize: '12px', color: '#FF6B35', fontWeight: '700', marginBottom: '6px' }}>
                  💡 Kako funkcionira?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    '1. Rezerviši termin',
                    '2. Tutor potvrđuje',
                    '3. Dobij email potvrdu',
                    '4. Pohađaj instrukcije',
                  ].map((step, i) => (
                    <p key={i} style={{ fontSize: '12px', color: '#7A7570', lineHeight: '1.4' }}>
                      {step}
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