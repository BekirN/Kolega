import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTutors } from '../api/tutoring'

export default function Tutoring() {
  const navigate = useNavigate()
  const [tutors, setTutors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchTutors = async () => {
    setLoading(true)
    try {
      const filters = {}
      if (search) filters.search = search
      const data = await getTutors(filters)
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
      <span key={i} style={{ color: i < Math.round(rating) ? '#FFB800' : '#E5E5EA' }}>★</span>
    ))

  return (
    <div className="min-h-screen" style={{ background: '#F5F5F0' }}>
      <div className="px-8 pt-8 pb-6" style={{ background: 'linear-gradient(135deg, #1C1C1E, #2C2C2E)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Instrukcije 📚</h1>
            <p style={{ color: '#8E8E93' }} className="mt-1">Zakaži ili ponudi instrukcije</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/tutoring/my-bookings')}
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#E5E5EA' }}>
              Moji termini
            </button>
            <button onClick={() => navigate('/tutoring/become-tutor')}
              className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }}>
              + Postani tutor
            </button>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); fetchTutors() }} className="flex gap-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pretraži po predmetu ili imenu..."
            className="flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none"
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
        ) : tutors.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📚</p>
            <p className="text-xl font-semibold text-gray-700 mb-2">Nema tutora</p>
            <button onClick={() => navigate('/tutoring/become-tutor')}
              className="mt-4 px-6 py-3 rounded-xl text-white font-semibold text-sm"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }}>
              Budi prvi tutor
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tutors.map(tutor => (
              <div
                key={tutor.id}
                onClick={() => navigate(`/tutoring/${tutor.id}`)}
                className="rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
                style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }}>
                    {tutor.user?.firstName?.[0]}{tutor.user?.lastName?.[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {tutor.user?.firstName} {tutor.user?.lastName}
                    </h3>
                    {tutor.user?.faculty && (
                      <p className="text-xs text-gray-400">{tutor.user.faculty}</p>
                    )}
                  </div>
                </div>

                {tutor.averageRating > 0 && (
                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex text-sm">{renderStars(tutor.averageRating)}</div>
                    <span className="text-xs text-gray-400">({tutor.reviewCount})</span>
                  </div>
                )}

                {tutor.bio && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{tutor.bio}</p>
                )}

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {tutor.subjects?.slice(0, 3).map((s, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ background: '#FFF7ED', color: '#FF6B35' }}>
                      {s}
                    </span>
                  ))}
                  {tutor.subjects?.length > 3 && (
                    <span className="text-xs text-gray-400">+{tutor.subjects.length - 3}</span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #F5F5F0' }}>
                  <span className="text-xl font-black" style={{ color: '#FF6B35' }}>
                    {tutor.hourlyRate} KM/h
                  </span>
                  <span className="text-xs text-gray-400">{tutor._count?.bookings || 0} termina</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}