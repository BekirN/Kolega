import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCompanies } from '../api/companies'
import { AnimatedSection, AnimatedScale, AnimatedBlur, AnimatedLine } from '../components/Animated'

const SIZE_LABELS = { SMALL: '1–50', MEDIUM: '51–200', LARGE: '200+' }

export default function Companies() {
  const navigate = useNavigate()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [industry, setIndustry] = useState('')

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

  useEffect(() => { fetchCompanies() }, [])

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < Math.round(rating) ? '#FFB800' : '#3A3A3C', fontSize: '14px' }}>★</span>
    ))

  return (
    <div style={{ minHeight: '100vh', background: '#EFEDE8' }}>

      <div style={{
        background: 'linear-gradient(135deg, #1C1C1E 0%, #2C2C2E 100%)',
        padding: '40px 32px 32px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 50%, rgba(255,107,53,0.12), transparent 60%)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <AnimatedBlur delay={0}>
            <h1 style={{ fontSize: '32px', fontWeight: '900', color: 'white', letterSpacing: '-0.02em', marginBottom: '6px' }}>
              Firme & Prakse 🏢
            </h1>
            <p style={{ color: '#8E8E93', fontSize: '15px', marginBottom: '24px' }}>
              Pronađi praksu i pročitaj recenzije
            </p>
          </AnimatedBlur>

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

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px' }}>
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
                        background: 'linear-gradient(135deg, #FFF7ED, #FFE0CC)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
                      }}>
                        🏢
                      </div>
                      <div>
                        <p style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '16px' }}>{company.name}</p>
                        <p style={{ color: '#FF6B35', fontSize: '13px', marginTop: '2px' }}>{company.industry}</p>
                      </div>
                    </div>
                    {company.averageRating > 0 && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex' }}>{renderStars(company.averageRating)}</div>
                        <p style={{ fontSize: '12px', color: '#8E8E93', marginTop: '2px' }}>
                          {company.averageRating} · {company.reviewCount} rec.
                        </p>
                      </div>
                    )}
                  </div>

                  {company.description && (
                    <p style={{ color: '#8E8E93', fontSize: '13px', marginBottom: '12px', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {company.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    {company.city && <span style={{ fontSize: '12px', color: '#8E8E93' }}>📍 {company.city}</span>}
                    {company.size && <span style={{ fontSize: '12px', color: '#8E8E93' }}>👥 {SIZE_LABELS[company.size]} zaposlenih</span>}
                  </div>

                  {company.internships?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {company.internships.map(intern => (
                        <span key={intern.id} style={{
                          fontSize: '12px', padding: '4px 10px', borderRadius: '100px', fontWeight: '600',
                          background: intern.isPaid ? 'rgba(22,163,74,0.1)' : '#F5F5F0',
                          color: intern.isPaid ? '#16A34A' : '#6B7280',
                        }}>
                          {intern.title}{intern.isPaid ? ' · Plaćena' : ''}
                        </span>
                      ))}
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