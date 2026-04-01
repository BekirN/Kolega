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
  { value: 'KNJIGE', label: 'Knjige' },
  { value: 'SKRIPTA', label: 'Skripta' },
  { value: 'ELEKTRONIKA', label: 'Elektronika' },
  { value: 'OPREMA', label: 'Oprema' },
  { value: 'OSTALO', label: 'Ostalo' },
]

export default function NewShopItem() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    condition: '',
    category: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/shop')} className="text-gray-400 hover:text-gray-600">
          ← Nazad
        </button>
        <h1 className="font-semibold text-gray-800">Novi oglas</h1>
      </nav>

      <div className="max-w-lg mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Detalji oglasa</h2>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Naziv *</label>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="npr. Matematička analiza 1"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">Opis</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                placeholder="Opiši predmet..."
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">Cijena (KM) *</label>
              <input
                name="price"
                type="number"
                min="0"
                step="0.50"
                value={formData.price}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="15.00"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">Kategorija *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">Odaberi kategoriju</option>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">Stanje *</label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">Odaberi stanje</option>
                {CONDITIONS.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/shop')}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition"
              >
                Odustani
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm transition disabled:opacity-50"
              >
                {loading ? 'Kreiranje...' : 'Objavi oglas'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}