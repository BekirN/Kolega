import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) {
      navigate('/login')
      return
    }
    setUser(JSON.parse(stored))
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-indigo-600">KOLEGA</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {user.firstName} {user.lastName}
          </span>
          {user.verificationStatus === 'UNVERIFIED' && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
              Neverifikovan
            </span>
          )}
          {user.verificationStatus === 'VERIFIED' && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              ✓ Verifikovan
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-500 transition"
          >
            Odjavi se
          </button>
        </div>
      </nav>

      {/* Verifikacioni banner */}
      {user.verificationStatus === 'UNVERIFIED' && (
        <div className="bg-yellow-50 border-b border-yellow-100 px-6 py-3 text-sm text-yellow-800 flex items-center justify-between">
          <span>⚠️ Tvoj nalog nije verifikovan. Uploaduj index ili potvrdu o studiranju.</span>
          <button className="text-yellow-700 font-medium hover:underline">
            Verifikuj nalog →
          </button>
        </div>
      )}

      {/* Glavni sadržaj */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Dobrodošao, {user.firstName}! 👋
        </h2>
        <p className="text-gray-500 mb-8">Šta tražiš danas?</p>

        {/* Moduli grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <ModuleCard
            emoji="🛍️"
            title="Student Shop"
            description="Kupi ili prodaj knjige i opremu"
            color="indigo"
            onClick={() => navigate('/shop')}
          />
          
          <ModuleCard
            emoji="🏠"
            title="Stanovi"
            description="Pronađi smještaj ili cimera"
            color="blue"
            onClick={() => navigate('/housing')}
          />
          
          <ModuleCard
            emoji="📚"
            title="Instrukcije"
            description="Zakaži ili ponudi instrukcije"
            color="purple"
            onClick={() => navigate('/tutoring')}
          />
          
          <ModuleCard
            emoji="🏢"
            title="Firme & Prakse"
            description="Pronađi praksu i ocijeni firmu"
            color="green"
            onClick={() => navigate('/companies')}
          />
          
          <ModuleCard
            emoji="📄"
            title="Materijali"
            description="Dijeli i preuzimaj skripte"
            color="yellow"
            onClick={() => navigate('/materials')}
          />
          
          <ModuleCard
            emoji="💬"
            title="Community"
            description="Eventi, obavještenja, forum"
            color="pink"
            onClick={() => navigate('/community')}
          />

        </div>
      </div>
    </div>
  )
}

function ModuleCard({ emoji, title, description, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white border border-gray-100 rounded-2xl p-6 text-left hover:shadow-md hover:border-indigo-100 transition-all group"
    >
      <div className="text-3xl mb-3">{emoji}</div>
      <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition">
        {title}
      </h3>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </button>
  )
}