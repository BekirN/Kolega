import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyBookings, getTutorBookings, updateBookingStatus } from '../api/tutoring'
import { AnimatedSection, AnimatedScale, AnimatedBlur } from '../components/Animated'

const STATUS_LABELS = {
  PENDING: { label: 'Na čekanju', color: '#FFB800', bg: 'rgba(255,184,0,0.12)' },
  CONFIRMED: { label: 'Potvrđen', color: '#16A34A', bg: 'rgba(22,163,74,0.1)' },
  CANCELLED: { label: 'Otkazan', color: '#FF3B30', bg: 'rgba(255,59,48,0.1)' },
  COMPLETED: { label: 'Završen', color: '#8E8E93', bg: 'rgba(0,0,0,0.06)' },
}

export default function MyBookings() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('student')
  const [studentBookings, setStudentBookings] = useState([])
  const [tutorBookings, setTutorBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true)
      try {
        const [sB, tB] = await Promise.allSettled([getMyBookings(), getTutorBookings()])
        if (sB.status === 'fulfilled') setStudentBookings(sB.value)
        if (tB.status === 'fulfilled') setTutorBookings(tB.value)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [])

  const handleStatusUpdate = async (bookingId, status) => {
    try {
      await updateBookingStatus(bookingId, status)
      const updated = await getTutorBookings()
      setTutorBookings(updated)
    } catch (err) {
      console.error(err)
    }
  }

  const bookings = tab === 'student' ? studentBookings : tutorBookings

  return (
    <div style={{ minHeight: '100vh', background: '#EFEDE8' }}>

      <div style={{
        background: 'linear-gradient(135deg, #1C1C1E, #2C2C2E)',
        padding: '32px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 50%, rgba(255,107,53,0.1), transparent 60%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <AnimatedBlur>
            <button onClick={() => navigate('/tutoring')} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', color: '#8E8E93',
              fontSize: '14px', cursor: 'pointer', marginBottom: '16px', padding: 0,
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Nazad
            </button>
            <h1 style={{ fontSize: '28px', fontWeight: '900', color: 'white', letterSpacing: '-0.02em' }}>
              Moji termini 📅
            </h1>
          </AnimatedBlur>
        </div>
      </div>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '32px' }}>

        <AnimatedSection delay={0} direction="up">
          <div style={{ display: 'flex', gap: '10px', marginBottom: '28px' }}>
            {[
              { key: 'student', label: `Moje rezervacije`, count: studentBookings.length },
              { key: 'tutor', label: `Zahtjevi za moje instrukcije`, count: tutorBookings.length },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: '10px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: tab === t.key ? 'linear-gradient(135deg, #FF6B35, #FFB800)' : '#FDFCF9',
                color: tab === t.key ? 'white' : '#6B7280',
                fontSize: '14px', fontWeight: '700',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}>
                {t.label} ({t.count})
              </button>
            ))}
          </div>
        </AnimatedSection>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #FF6B35', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : bookings.length === 0 ? (
          <AnimatedScale>
            <div style={{ background: '#FDFCF9', borderRadius: '20px', padding: '48px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: '40px', marginBottom: '12px' }}>📅</p>
              <p style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '18px' }}>Nema termina</p>
            </div>
          </AnimatedScale>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {bookings.map((booking, i) => (
              <AnimatedSection key={booking.id} delay={i * 0.06} direction="up">
                <div style={{
                  background: '#FDFCF9', borderRadius: '20px', padding: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  transition: 'box-shadow 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <p style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '16px', marginBottom: '4px' }}>
                        {booking.subject}
                      </p>
                      <p style={{ color: '#8E8E93', fontSize: '13px' }}>
                        {tab === 'student'
                          ? `Tutor: ${booking.tutor?.user?.firstName} ${booking.tutor?.user?.lastName}`
                          : `Student: ${booking.student?.firstName} ${booking.student?.lastName}`
                        }
                      </p>
                    </div>
                    <span style={{
                      fontSize: '12px', fontWeight: '700', padding: '5px 12px', borderRadius: '100px',
                      background: STATUS_LABELS[booking.status]?.bg,
                      color: STATUS_LABELS[booking.status]?.color,
                    }}>
                      {STATUS_LABELS[booking.status]?.label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', color: '#8E8E93' }}>
                      📅 {new Date(booking.date).toLocaleString('bs-BA')}
                    </span>
                    <span style={{ color: '#AEAEB2' }}>·</span>
                    <span style={{ fontSize: '13px', color: '#8E8E93' }}>⏱ {booking.duration} min</span>
                    <span style={{ color: '#AEAEB2' }}>·</span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#FF6B35' }}>{booking.price} KM</span>
                  </div>

                  {booking.message && (
                    <p style={{
                      fontSize: '13px', color: '#8E8E93', fontStyle: 'italic',
                      marginBottom: '14px', padding: '10px 14px',
                      background: '#F0EDE8', borderRadius: '10px',
                    }}>
                      "{booking.message}"
                    </p>
                  )}

                  {tab === 'tutor' && booking.status === 'PENDING' && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => handleStatusUpdate(booking.id, 'CONFIRMED')} style={{
                        flex: 1, padding: '10px', borderRadius: '12px', border: 'none',
                        background: 'rgba(22,163,74,0.1)', color: '#16A34A',
                        fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                        transition: 'opacity 0.2s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                        ✓ Potvrdi termin
                      </button>
                      <button onClick={() => handleStatusUpdate(booking.id, 'CANCELLED')} style={{
                        flex: 1, padding: '10px', borderRadius: '12px', border: 'none',
                        background: 'rgba(255,59,48,0.1)', color: '#FF3B30',
                        fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                        transition: 'opacity 0.2s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                        ✕ Odbij
                      </button>
                    </div>
                  )}
                </div>
              </AnimatedSection>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}