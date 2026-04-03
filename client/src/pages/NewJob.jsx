import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createJob } from '../api/jobs'

const CATEGORIES = {
  UGOSTITELJSTVO: '🍽️ Ugostiteljstvo',
  TRGOVINA: '🛒 Trgovina',
  ADMINISTRACIJA: '📋 Administracija',
  IT: '💻 IT',
  TUTORING: '📚 Tutoring',
  DOSTAVA: '🚴 Dostava',
  PROMOCIJA: '📢 Promocija',
  FIZICKI_RAD: '💪 Fizički rad',
  OSTALO: '✨ Ostalo',
}

export default function NewJob() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'NUDIM',
    category: '',
    location: '',
    isRemote: false,
    salary: '',
    salaryPeriod: 'PO_SATU',
    hours: '',
    contactEmail: '',
    contactPhone: '',
  })

  const inputStyle = {
    background: '#F5F5F0',
    border: '1.5px solid #E5E5EA',
    color: '#1C1C1E',
    borderRadius: '12px',
    padding: '10px 14px',
    fontSize: '14px',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.15s',
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await createJob(formData)
      navigate('/jobs')
    } catch (err) {
      setError(err.response?.data?.message || 'Greška pri objavljivanju')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#F5F5F0' }}>
      <div className="px-8 py-6" style={{ background: 'linear-gradient(135deg, #1C1C1E, #2C2C2E)' }}>
        <button onClick={() => navigate('/jobs')}
          className="flex items-center gap-2 text-sm mb-4" style={{ color: '#8E8E93' }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Nazad na poslove
        </button>
        <h1 className="text-2xl font-black text-white">Novi oglas 💼</h1>
        <p style={{ color: '#8E8E93' }} className="mt-1">Nudi ili traži studentski posao</p>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="rounded-2xl p-6" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>

          {error && (
            <div className="px-4 py-3 rounded-xl mb-5 text-sm"
              style={{ background: '#FFF0ED', color: '#FF3B30' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Tip oglasa */}
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">Tip oglasa *</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'NUDIM', label: '💼 Nudim posao', desc: 'Imam posao za studenta' },
                  { value: 'TRAZIM', label: '🙋 Tražim posao', desc: 'Tražim studentski posao' },
                ].map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: t.value })}
                    className="p-4 rounded-xl text-left transition"
                    style={{
                      background: formData.type === t.value ? '#FFF7ED' : '#F5F5F0',
                      border: formData.type === t.value ? '2px solid #FF6B35' : '2px solid transparent',
                    }}>
                    <p className="font-bold text-sm text-gray-900">{t.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Naziv */}
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1.5 block">Naziv posla *</label>
              <input
                style={inputStyle}
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="npr. Konobar/ica vikendom, React developer..."
                onFocus={e => e.target.style.borderColor = '#FF6B35'}
                onBlur={e => e.target.style.borderColor = '#E5E5EA'}
              />
            </div>

            {/* Kategorija */}
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">Kategorija *</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(CATEGORIES).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: key })}
                    className="py-2.5 px-3 rounded-xl text-xs font-medium transition text-left"
                    style={{
                      background: formData.category === key ? '#FF6B35' : '#F5F5F0',
                      color: formData.category === key ? 'white' : '#6B7280',
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Opis */}
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1.5 block">Opis *</label>
              <textarea
                style={{ ...inputStyle, height: '120px', resize: 'none' }}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                required
                placeholder="Opiši posao, zahtjeve, uvjete rada..."
                onFocus={e => e.target.style.borderColor = '#FF6B35'}
                onBlur={e => e.target.style.borderColor = '#E5E5EA'}
              />
            </div>

            {/* Lokacija i remote */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1.5 block">Lokacija</label>
                <input
                  style={inputStyle}
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  placeholder="npr. Sarajevo, Centar"
                  onFocus={e => e.target.style.borderColor = '#FF6B35'}
                  onBlur={e => e.target.style.borderColor = '#E5E5EA'}
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1.5 block">Radno vrijeme</label>
                <input
                  style={inputStyle}
                  value={formData.hours}
                  onChange={e => setFormData({ ...formData, hours: e.target.value })}
                  placeholder="npr. Vikendi, 20h/sedmično"
                  onFocus={e => e.target.style.borderColor = '#FF6B35'}
                  onBlur={e => e.target.style.borderColor = '#E5E5EA'}
                />
              </div>
            </div>

            {/* Remote toggle */}
            <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: '#F5F5F0' }}>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isRemote: !formData.isRemote })}
                className="relative w-12 h-6 rounded-full transition-all flex-shrink-0"
                style={{ background: formData.isRemote ? '#FF6B35' : '#C7C7CC' }}>
                <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                  style={{ left: formData.isRemote ? '26px' : '2px' }} />
              </button>
              <div>
                <p className="text-sm font-semibold text-gray-800">Remote posao 🌐</p>
                <p className="text-xs text-gray-400">Posao se može obavljati od kuće</p>
              </div>
            </div>

            {/* Plata */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1.5 block">Plata (KM)</label>
                <input
                  style={inputStyle}
                  type="number"
                  value={formData.salary}
                  onChange={e => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="npr. 8"
                  min="0"
                  onFocus={e => e.target.style.borderColor = '#FF6B35'}
                  onBlur={e => e.target.style.borderColor = '#E5E5EA'}
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1.5 block">Period</label>
                <select
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  value={formData.salaryPeriod}
                  onChange={e => setFormData({ ...formData, salaryPeriod: e.target.value })}
                  onFocus={e => e.target.style.borderColor = '#FF6B35'}
                  onBlur={e => e.target.style.borderColor = '#E5E5EA'}>
                  <option value="PO_SATU">Po satu</option>
                  <option value="PO_DANU">Po danu</option>
                  <option value="PO_MJESECU">Po mjesecu</option>
                  <option value="DOGOVOR">Dogovor</option>
                </select>
              </div>
            </div>

            {/* Kontakt */}
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">Kontakt info</label>
              <div className="space-y-3">
                <input
                  style={inputStyle}
                  type="email"
                  value={formData.contactEmail}
                  onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="Email (opciono)"
                  onFocus={e => e.target.style.borderColor = '#FF6B35'}
                  onBlur={e => e.target.style.borderColor = '#E5E5EA'}
                />
                <input
                  style={inputStyle}
                  type="tel"
                  value={formData.contactPhone}
                  onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="Telefon (opciono)"
                  onFocus={e => e.target.style.borderColor = '#FF6B35'}
                  onBlur={e => e.target.style.borderColor = '#E5E5EA'}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                💡 Ako ne uneseš kontakt, zainteresirani studenti ti mogu poslati poruku na platformi
              </p>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/jobs')}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ background: '#F5F5F0', color: '#6B7280' }}>
                Odustani
              </button>
              <button
                type="submit"
                disabled={loading || !formData.category}
                className="flex-1 py-3 rounded-xl text-white font-semibold text-sm transition hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }}>
                {loading ? 'Objavljivanje...' : '🚀 Objavi oglas'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}