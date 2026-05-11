import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCompanies } from '../api/companies'
import { AnimatedSection, AnimatedScale, AnimatedBlur } from '../components/Animated'
import { getMyCompanies } from '../api/internships'

const SIZE_LABELS = { SMALL: '1–50', MEDIUM: '51–200', LARGE: '200+' }

export default function Companies() {
  const navigate = useNavigate()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [industry, setIndustry] = useState('')
  const [myCompanies, setMyCompanies] = useState([])

  useEffect(() => {
    fetchCompanies()
    fetchMyCompanies()
  }, [])

  const fetchCompanies = async () => {
    setLoading(true)
    try {
      const filters = {}
      if (search) filters.search = search
      if (industry) filters.industry = industry
      const data = await getCompanies(filters)
      setCompanies(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMyCompanies = async () => {
    try {
      const data = await getMyCompanies()
      setMyCompanies(data)
    } catch (err) {
      console.error(err)
    }
  }

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < Math.round(rating) ? '#FFB800' : '#3A3A3C', fontSize: '14px' }}>★</span>
    ))

  return (
    <div style={{ minHeight: '100vh', background: '#EFEDE8' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1C1C1E 0%, #2C2C2E 100%)',
        padding: '40px 32px 32px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 50%, rgba(255,107,53,0.12), transparent 60%)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <AnimatedBlur delay={0}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div>
                <h1 style={{ fontSize: '32px', fontWeight: '900', color: 'white', letterSpacing: '-0.02em', marginBottom: '6px' }}>
                  Firme & Prakse 🏢
                </h1>
                <p style={{ color: '#8E8E93', fontSize: '15px', marginBottom: '24px' }}>
                  Pronađi praksu i pročitaj recenzije
                </p>
              </div>

              {/* Moje prijave dugme */}
              <button
                onClick={() => navigate('/companies/my-applications')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 18px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.08)', color: '#E5E5EA',
                  fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.1)',
                  transition: 'background 0.2s', flexShrink: 0,
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              >
                📋 Moje prijave
              </button>
            </div>
          </AnimatedBlur>

          {/* Search forma */}
          <AnimatedSection delay={0.1} direction="up">
            <form onSubmit={(e) => { e.preventDefault(); fetchCompanies() }} style={{ display: 'flex', gap: '10px' }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Pretraži firme..."
                style={{
                  flex: 1, padding: '11px 16px', borderRadius: '12px',
                  background: '#2C2C2E', color: '#E5E5EA', border: '1px solid #3A3A3C',
                  fontSize: '14px', outline: 'none',
                }}
              />
              <input
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                placeholder="Industrija..."
                style={{
                  width: '160px', padding: '11px 16px', borderRadius: '12px',
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

      {/* Sadržaj */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px' }}>

        {/* ─── MOJE FIRME (HR sekcija) ─────────────────────────────── */}
        {myCompanies.length > 0 && (
          <AnimatedSection delay={0} direction="up">
            <div style={{
              background: '#EEEBE5', borderRadius: '20px', padding: '20px',
              marginBottom: '28px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.05)',
            }}>
              <p style={{
                fontSize: '11px', fontWeight: '700', color: '#AEAEB2',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px',
              }}>
                🏢 Moje firme – HR pristup
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {myCompanies.map(membership => {
                  const company = membership.company
                  const totalApplications = company.internships?.reduce(
                    (acc, i) => acc + (i._count?.applications || 0), 0
                  ) || 0

                  return (
                    <div key={membership.id} style={{
                      background: '#F5F2ED', borderRadius: '14px', padding: '14px 18px',
                      display: 'flex', alignItems: 'center', gap: '14px',
                      border: '1px solid rgba(0,0,0,0.04)',
                    }}>
                      {/* Logo */}
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '12px',
                        flexShrink: 0, overflow: 'hidden',
                        background: 'linear-gradient(135deg, #16A34A, #4ADE80)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: '800', fontSize: '18px',
                      }}>
                        {company.logoUrl
                          ? <img src={company.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : company.name?.[0]
                        }
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '15px', margin: 0, marginBottom: '4px' }}>
                          {company.name}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '100px',
                            background: membership.role === 'OWNER'
                              ? 'rgba(255,184,0,0.15)'
                              : membership.role === 'HR'
                              ? 'rgba(124,58,237,0.12)'
                              : 'rgba(14,165,233,0.12)',
                            color: membership.role === 'OWNER'
                              ? '#FFB800'
                              : membership.role === 'HR'
                              ? '#7C3AED'
                              : '#0EA5E9',
                          }}>
                            {membership.role}
                          </span>
                          <span style={{ fontSize: '12px', color: '#AEAEB2' }}>
                            {company.internships?.length || 0} praks{company.internships?.length === 1 ? 'a' : 'i'}
                          </span>
                          {totalApplications > 0 && (
                            <span style={{ fontSize: '12px', color: '#FF6B35', fontWeight: '600' }}>
                              · {totalApplications} prijav{totalApplications === 1 ? 'a' : 'i'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Akcije */}
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <button
                          onClick={() => navigate(`/companies/${company.id}/applications`)}
                          style={{
                            padding: '9px 16px', borderRadius: '10px', border: 'none',
                            background: totalApplications > 0
                              ? 'linear-gradient(135deg, #FF6B35, #FFB800)'
                              : '#EEEBE5',
                            color: totalApplications > 0 ? 'white' : '#6B7280',
                            fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            boxShadow: totalApplications > 0 ? '0 4px 12px rgba(255,107,53,0.25)' : 'none',
                            transition: 'all 0.2s',
                          }}>
                          📋 Prijave
                          {totalApplications > 0 && (
                            <span style={{
                              background: 'rgba(255,255,255,0.3)', borderRadius: '100px',
                              padding: '1px 8px', fontSize: '12px', fontWeight: '800',
                            }}>
                              {totalApplications}
                            </span>
                          )}
                        </button>

                        <button
                          onClick={() => navigate(`/companies/${company.id}`)}
                          style={{
                            padding: '9px 16px', borderRadius: '10px', border: 'none',
                            background: '#EEEBE5', color: '#3A3A3C',
                            fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#E2DDD6'}
                          onMouseLeave={e => e.currentTarget.style.background = '#EEEBE5'}
                        >
                          Firma →
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* ─── LISTA SVIH FIRMI ─────────────────────────────────────── */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #FF6B35', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : companies.length === 0 ? (
          <AnimatedScale>
            <div style={{ background: '#FDFCF9', borderRadius: '24px', padding: '64px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</p>
              <p style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '20px' }}>Nema firmi</p>
            </div>
          </AnimatedScale>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {companies.map((company, i) => (
              <AnimatedSection key={company.id} delay={i * 0.07} direction="up">
                <div
                  onClick={() => navigate(`/companies/${company.id}`)}
                  style={{
                    background: '#FDFCF9', borderRadius: '20px', padding: '20px',
                    cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
                        overflow: 'hidden',
                        background: 'linear-gradient(135deg, #FFF7ED, #FFE0CC)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
                      }}>
                        {company.logoUrl
                          ? <img src={company.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : '🏢'
                        }
                      </div>
                      <div>
                        <p style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '16px', margin: 0 }}>
                          {company.name}
                        </p>
                        <p style={{ color: '#FF6B35', fontSize: '13px', marginTop: '2px', margin: 0 }}>
                          {company.industry}
                        </p>
                      </div>
                    </div>
                    {company.averageRating > 0 && (
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ display: 'flex' }}>{renderStars(company.averageRating)}</div>
                        <p style={{ fontSize: '12px', color: '#8E8E93', marginTop: '2px' }}>
                          {company.averageRating} · {company.reviewCount} rec.
                        </p>
                      </div>
                    )}
                  </div>

                  {company.description && (
                    <p style={{
                      color: '#8E8E93', fontSize: '13px', marginBottom: '12px',
                      lineHeight: '1.5',
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {company.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    {company.city && (
                      <span style={{ fontSize: '12px', color: '#8E8E93' }}>📍 {company.city}</span>
                    )}
                    {company.size && (
                      <span style={{ fontSize: '12px', color: '#8E8E93' }}>👥 {SIZE_LABELS[company.size]} zaposlenih</span>
                    )}
                    {company.isVerified && (
                      <span style={{
                        fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '100px',
                        background: 'rgba(22,163,74,0.1)', color: '#16A34A',
                      }}>✓ Verificirana</span>
                    )}
                  </div>

                  {company.internships?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {company.internships.slice(0, 3).map(intern => (
                        <span key={intern.id} style={{
                          fontSize: '12px', padding: '4px 10px', borderRadius: '100px', fontWeight: '600',
                          background: intern.isPaid ? 'rgba(22,163,74,0.1)' : '#F5F5F0',
                          color: intern.isPaid ? '#16A34A' : '#6B7280',
                        }}>
                          {intern.title}{intern.isPaid ? ' · Plaćena' : ''}
                        </span>
                      ))}
                      {company.internships.length > 3 && (
                        <span style={{
                          fontSize: '12px', padding: '4px 10px', borderRadius: '100px',
                          background: '#F5F5F0', color: '#8E8E93', fontWeight: '600',
                        }}>
                          +{company.internships.length - 3} više
                        </span>
                      )}
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