import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api/auth'
import { initSocket } from '../services/socket'

export default function Login() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await login(formData)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      initSocket()
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Pogrešan email ili password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#F5F5F0' }}>
      {/* Lijeva strana – branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1C1C1E 0%, #2C2C2E 100%)' }}>

        {/* Dekoracija */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #FF6B35, transparent)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #FFB800, transparent)', transform: 'translate(-30%, 30%)' }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }}>
            <span className="text-white font-black text-lg">K</span>
          </div>
          <div>
            <span className="text-white font-bold text-xl tracking-tight">KOLEGA</span>
            <p className="text-xs" style={{ color: '#FF6B35' }}>Student Hub · Sarajevo</p>
          </div>
        </div>

        {/* Tagline */}
        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Sve što trebaš kao student,<br />
            <span style={{ color: '#FF6B35' }}>na jednom mjestu.</span>
          </h2>
          <p style={{ color: '#8E8E93' }} className="text-lg">
            Stanovi, knjige, instrukcije, prakse – sve bez Viber grupa.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-6">
            {['🏠 Stanovi', '🛍️ Shop', '📚 Instrukcije', '🏢 Prakse', '💬 Community'].map(f => (
              <span key={f} className="px-3 py-1.5 rounded-full text-sm font-medium"
                style={{ background: 'rgba(255,107,53,0.15)', color: '#FF6B35', border: '1px solid rgba(255,107,53,0.3)' }}>
                {f}
              </span>
            ))}
          </div>
        </div>

        <p style={{ color: '#48484A' }} className="text-sm relative z-10">
          © 2025 KOLEGA · Made for students 🎓
        </p>
      </div>

      {/* Desna strana – forma */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }}>
              <span className="text-white font-black">K</span>
            </div>
            <span className="font-bold text-xl text-gray-900">KOLEGA</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dobrodošao! 👋</h1>
          <p className="text-gray-500 mb-8">Prijavi se na svoj nalog</p>

          {error && (
            <div className="px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2"
              style={{ background: '#FFF0ED', color: '#FF3B30', border: '1px solid #FFCCC7' }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition"
                style={{
                  background: 'white',
                  border: '1.5px solid #E5E5EA',
                  color: '#1C1C1E',
                }}
                placeholder="email@gmail.com"
                onFocus={e => e.target.style.borderColor = '#FF6B35'}
                onBlur={e => e.target.style.borderColor = '#E5E5EA'}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Password</label>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition"
                style={{
                  background: 'white',
                  border: '1.5px solid #E5E5EA',
                  color: '#1C1C1E',
                }}
                placeholder="••••••••"
                onFocus={e => e.target.style.borderColor = '#FF6B35'}
                onBlur={e => e.target.style.borderColor = '#E5E5EA'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50 mt-2"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }}
            >
              {loading ? 'Prijava...' : 'Prijavi se'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Nemaš nalog?{' '}
            <Link to="/register" className="font-semibold hover:opacity-80 transition"
              style={{ color: '#FF6B35' }}>
              Registruj se
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}