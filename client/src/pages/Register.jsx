import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api/auth'
import { initSocket } from '../services/socket'
export default function Register() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '',
    university: '', faculty: '', yearOfStudy: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await register(formData)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      initSocket()

      // Idi na verifikaciju emaila
      if (data.requiresEmailVerification) {
        navigate('/verify-email')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Greška pri registraciji')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    background: 'white',
    border: '1.5px solid #E5E5EA',
    color: '#1C1C1E',
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: '#F5F5F0' }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }}>
              <span className="text-white font-black text-lg">K</span>
            </div>
            <span className="font-bold text-2xl text-gray-900">KOLEGA</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Kreiraj nalog</h1>
          <p className="text-gray-500 text-sm">Pridruži se studentskoj zajednici</p>
        </div>

        <div className="rounded-2xl p-8" style={{ background: 'white', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>

          {error && (
            <div className="px-4 py-3 rounded-xl mb-5 text-sm flex items-center gap-2"
              style={{ background: '#FFF0ED', color: '#FF3B30', border: '1px solid #FFCCC7' }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Ime *</label>
                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition"
                  style={inputStyle}
                  placeholder="Ime"
                  onFocus={e => e.target.style.borderColor = '#FF6B35'}
                  onBlur={e => e.target.style.borderColor = '#E5E5EA'}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Prezime *</label>
                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition"
                  style={inputStyle}
                  placeholder="Prezime"
                  onFocus={e => e.target.style.borderColor = '#FF6B35'}
                  onBlur={e => e.target.style.borderColor = '#E5E5EA'}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email *</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition"
                style={inputStyle}
                placeholder="email@gmail.com"
                onFocus={e => e.target.style.borderColor = '#FF6B35'}
                onBlur={e => e.target.style.borderColor = '#E5E5EA'}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Password *</label>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition"
                style={inputStyle}
                placeholder="••••••••"
                onFocus={e => e.target.style.borderColor = '#FF6B35'}
                onBlur={e => e.target.style.borderColor = '#E5E5EA'}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Univerzitet</label>
              <input
                name="university"
                value={formData.university}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition"
                style={inputStyle}
                placeholder="Univerzitet u Sarajevu"
                onFocus={e => e.target.style.borderColor = '#FF6B35'}
                onBlur={e => e.target.style.borderColor = '#E5E5EA'}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Fakultet</label>
                <input
                  name="faculty"
                  value={formData.faculty}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition"
                  style={inputStyle}
                  placeholder="ETF"
                  onFocus={e => e.target.style.borderColor = '#FF6B35'}
                  onBlur={e => e.target.style.borderColor = '#E5E5EA'}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Godina</label>
                <select
                  name="yearOfStudy"
                  value={formData.yearOfStudy}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#FF6B35'}
                  onBlur={e => e.target.style.borderColor = '#E5E5EA'}
                >
                  <option value="">Odaberi</option>
                  {[1,2,3,4,5].map(y => (
                    <option key={y} value={y}>{y}. godina</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50 mt-2"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }}
            >
              {loading ? 'Kreiranje naloga...' : 'Registruj se 🎓'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Već imaš nalog?{' '}
            <Link to="/login" className="font-semibold hover:opacity-80 transition"
              style={{ color: '#FF6B35' }}>
              Prijavi se
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}