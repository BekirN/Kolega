import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTutors } from '../api/tutoring'
import { AnimatedSection, AnimatedScale, AnimatedBlur } from '../components/Animated'

export default function Tutoring() {
  const navigate = useNavigate()
  const [tutors, setTutors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchTutors = async () => {
    setLoading(true)
    try {
      const data = await getTutors(search ? { search } : {})
      setTutors(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTutors() }, [])

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < Math.round(rating) ? '#FFB800' : '#3A3A3C', fontSize: '13px' }}>★</span>
    ))

  return (
    <div style={{ minHeight: '100vh', background: '#EFEDE8' }}>

      <div style={{
        background: 'linear-gradient(135deg, #1C1C1E 0%, #2C2C2E 100%)',
        padding: '40px 32px 32px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 50%, rgba(255,184,0,0.1), transparent 60%)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <AnimatedBlur delay={0}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '32px', fontWeight: '900', color: 'white', letterSpacing: '-0.02em', marginBottom: '6px' }}>
                  Instrukcije 📚
                </h1>
                <p style={{ color: '#8E8E93', fontSize: '15px' }}>Zakaži ili ponudi instrukcije</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => navigate('/tutoring/my-bookings')} style={{
                  padding: '10px 18px', borderRadius: '12px', border: 'none',
                  background: 'rgba(255,255,255,0.08)', color: '#E5E5EA',
                  fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                }}>
                  Moji termini
                </button>
                <button onClick={() => navigate('/tutoring/become-tutor')} style={{
                  padding: '10px 20px', borderRadius: '12px', border: 'none',
                  background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                  color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(255,107,53,0.3)',
                }}>
                  + Postani tutor
                </button>
              </div>
            </div>
          </AnimatedBlur>

          <AnimatedSection delay={0.1} direction="up">
            <form onSubmit={(e) => { e.preventDefault(); fetchTutors() }} style={{ display: 'flex', gap: '10px' }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Pretraži po predmetu ili imenu..."
                style={{
                  flex: 1, padding: '11px 16px', borderRadius: '12px',
                  background: '#2C2C2E', color: '#E5E5EA', border: '1px solid #3A3A3C',
                  fontSize: '14px', outline: 'none',
                }}
              />
              <button type="submit" style={{
                padding: '11px 20px', borderRadius: '12px', border: 'none',
                background: '#FF6B35', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
              }}>
                Traži
              </button>
            </form>
          </AnimatedSection>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #FF6B35', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : tutors.length === 0 ? (
          <AnimatedScale>
            <div style={{ background: '#FDFCF9', borderRadius: '24px', padding: '64px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: '48px', marginBottom: '16px' }}>📚</p>
              <p style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '20px', marginBottom: '8px' }}>Nema tutora</p>
              <button onClick={() => navigate('/tutoring/become-tutor')} style={{
                marginTop: '16px', padding: '12px 28px', borderRadius: '14px', border: 'none',
                background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                color: 'white', fontWeight: '700', cursor: 'pointer',
              }}>
                Budi prvi tutor
              </button>
            </div>
          </AnimatedScale>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {tutors.map((tutor, i) => (
              <AnimatedScale key={tutor.id} delay={i * 0.07}>
                <div
                  onClick={() => navigate(`/tutoring/${tutor.id}`)}
                  style={{
                    background: '#FDFCF9', borderRadius: '20px', padding: '20px',
                    cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '16px', flexShrink: 0, overflow: 'hidden',
                    }}>
                      {tutor.user?.profileImage ? (
                        <img src={tutor.user.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{
                          width: '100%', height: '100%',
                          background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: '800', fontSize: '18px',
                        }}>
                          {tutor.user?.firstName?.[0]}{tutor.user?.lastName?.[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <p style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '15px' }}>
                        {tutor.user?.firstName} {tutor.user?.lastName}
                      </p>
                      {tutor.user?.faculty && (
                        <p style={{ color: '#8E8E93', fontSize: '12px', marginTop: '2px' }}>{tutor.user.faculty}</p>
                      )}
                    </div>
                  </div>

                  {tutor.averageRating > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex' }}>{renderStars(tutor.averageRating)}</div>
                      <span style={{ fontSize: '12px', color: '#8E8E93' }}>({tutor.reviewCount})</span>
                    </div>
                  )}

                  {tutor.bio && (
                    <p style={{ color: '#8E8E93', fontSize: '13px', marginBottom: '12px', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {tutor.bio}
                    </p>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                    {tutor.subjects?.slice(0, 3).map((s, idx) => (
                      <span key={idx} style={{
                        fontSize: '12px', padding: '4px 10px', borderRadius: '100px', fontWeight: '600',
                        background: '#FFF7ED', color: '#FF6B35',
                      }}>
                        {s}
                      </span>
                    ))}
                    {tutor.subjects?.length > 3 && (
                      <span style={{ fontSize: '12px', color: '#8E8E93', padding: '4px 0' }}>+{tutor.subjects.length - 3}</span>
                    )}
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    paddingTop: '12px', borderTop: '1px solid #F0EDE8',
                  }}>
                    <span style={{ fontSize: '20px', fontWeight: '900', color: '#FF6B35' }}>
                      {tutor.hourlyRate} KM/h
                    </span>
                    <span style={{ fontSize: '12px', color: '#AEAEB2' }}>
                      {tutor._count?.bookings || 0} termina
                    </span>
                  </div>
                </div>
              </AnimatedScale>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}