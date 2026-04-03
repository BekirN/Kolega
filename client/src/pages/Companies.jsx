import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCompanies } from '../api/companies'

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
      <span key={i} style={{ color: i < Math.round(rating) ? '#FFB800' : '#E5E5EA' }}>★</span>
    ))

  return (
    <div className="min-h-screen" style={{ background: '#F5F5F0' }}>
      <div className="px-8 pt-8 pb-6" style={{ background: 'linear-gradient(135deg, #1C1C1E, #2C2C2E)' }}>
        <h1 className="text-3xl font-bold text-white mb-1">Firme & Prakse 🏢</h1>
        <p style={{ color: '#8E8E93' }} className="mb-6">Pronađi praksu i pročitaj recenzije</p>

        <form onSubmit={(e) => { e.preventDefault(); fetchCompanies() }} className="flex gap-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pretraži firme..."
            className="flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none"
            style={{ background: '#2C2C2E', color: '#E5E5EA', border: '1px solid #3A3A3C' }}
          />
          <input
            value={industry}
            onChange={e => setIndustry(e.target.value)}
            placeholder="Industrija..."
            className="w-40 px-4 py-2.5 rounded-xl text-sm focus:outline-none"
            style={{ background: '#2C2C2E', color: '#E5E5EA', border: '1px solid #3A3A3C' }}
          />
          <button type="submit" className="px-5 py-2.5 rounded-xl text-white text-sm font-medium"
            style={{ background: '#FF6B35' }}>
            Traži
          </button>
        </form>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#FF6B35', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {companies.map(company => (
              <div
                key={company.id}
                onClick={() => navigate(`/companies/${company.id}`)}
                className="rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
                style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #FFF7ED, #FFE0CC)' }}>
                      🏢
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{company.name}</h3>
                      <p className="text-sm" style={{ color: '#FF6B35' }}>{company.industry}</p>
                    </div>
                  </div>
                  {company.averageRating > 0 && (
                    <div className="text-right flex-shrink-0">
                      <div className="flex text-sm">{renderStars(company.averageRating)}</div>
                      <p className="text-xs text-gray-400 mt-0.5">{company.averageRating} · {company.reviewCount} rec.</p>
                    </div>
                  )}
                </div>

                {company.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{company.description}</p>
                )}

                <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                  {company.city && <span>📍 {company.city}</span>}
                  {company.size && <span>👥 {SIZE_LABELS[company.size]} zaposlenih</span>}
                </div>

                {company.internships?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {company.internships.map(i => (
                      <span key={i.id} className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{
                          background: i.isPaid ? '#F0FDF4' : '#F5F5F0',
                          color: i.isPaid ? '#16A34A' : '#6B7280',
                        }}>
                        {i.title} {i.isPaid ? '· Plaćena' : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}