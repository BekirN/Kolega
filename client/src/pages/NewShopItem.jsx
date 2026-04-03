import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createShopItem } from '../api/shop'

const CONDITIONS = [
  { value: 'NEW', label: 'Novo' },
  { value: 'LIKE_NEW', label: 'Kao novo' },
  { value: 'GOOD', label: 'Dobro' },
  { value: 'FAIR', label: 'Prihvatljivo' },
]

const CATEGORIES = [
  { value: 'KNJIGE', label: '📚 Knjige' },
  { value: 'SKRIPTA', label: '📄 Skripta' },
  { value: 'ELEKTRONIKA', label: '💻 Elektronika' },
  { value: 'OPREMA', label: '🎒 Oprema' },
  { value: 'OSTALO', label: '📦 Ostalo' },
]

export default function NewShopItem() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ title: '', description: '', price: '', condition: '', category: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const inputStyle = {
    background: 'white',
    border: '1.5px solid #E5E5EA',
    color: '#1C1C1E',
    borderRadius: '12px',
    padding: '10px 16px',
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
      await createShopItem(formData)
      navigate('/shop')
    } catch (err) {
      setError(err.response?.data?.message || 'Greška pri kreiranju oglasa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#F5F5F0' }}>
      <div style={{ background: 'linear-gradient(135deg, #1C1C1E, #2C2C2E)' }} className="px-8 py-6">
        <button onClick={() => navigate('/shop')} className="flex items-center gap-2 text-sm mb-4" style={{ color: '#8E8E93' }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Nazad na Shop
        </button>
        <h1 className="text-2xl font-bold text-white">Novi oglas 🛍️</h1>
      </div>

      <div className="max-w-lg mx-auto px-6 py-8">
        <div className="rounded-2xl p-6" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>

          {error && (
            <div className="px-4 py-3 rounded-xl mb-5 text-sm" style={{ background: '#FFF0ED', color: '#FF3B30' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Naziv *</label>
              <input
                style={inputStyle}
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="npr. Matematička analiza 1"
                onFocus={e => e.target.style.borderColor = '#FF6B35'}
                onBlur={e => e.target.style.borderColor = '#E5E5EA'}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Opis</label>
              <textarea
                style={{ ...inputStyle, resize: 'none', height: '100px' }}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Opiši predmet..."
                onFocus={e => e.target.style.borderColor = '#FF6B35'}
                onBlur={e => e.target.style.borderColor = '#E5E5EA'}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Cijena (KM) *</label>
              <input
                style={inputStyle}
                type="number"
                min="0"
                step="0.50"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                required
                placeholder="15.00"
                onFocus={e => e.target.style.borderColor = '#FF6B35'}
                onBlur={e => e.target.style.borderColor = '#E5E5EA'}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Kategorija *</label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: c.value })}
                    className="py-2.5 px-3 rounded-xl text-sm font-medium transition"
                    style={{
                      background: formData.category === c.value ? '#FF6B35' : '#F5F5F0',
                      color: formData.category === c.value ? 'white' : '#6B7280',
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Stanje *</label>
              <div className="grid grid-cols-2 gap-2">
                {CONDITIONS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, condition: c.value })}
                    className="py-2.5 rounded-xl text-sm font-medium transition"
                    style={{
                      background: formData.condition === c.value ? '#FF6B35' : '#F5F5F0',
                      color: formData.condition === c.value ? 'white' : '#6B7280',
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/shop')}
                className="flex-1 py-3 rounded-xl text-sm font-medium"
                style={{ background: '#F5F5F0', color: '#6B7280' }}
              >
                Odustani
              </button>
              <button
                type="submit"
                disabled={loading || !formData.category || !formData.condition}
                className="flex-1 py-3 rounded-xl text-white font-semibold text-sm transition hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }}
              >
                {loading ? 'Objavljivanje...' : 'Objavi oglas'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}