import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPost } from '../api/community'

const CATEGORIES = [
  { value: 'OBAVJESTENJE', label: 'Obavještenje' },
  { value: 'PITANJE', label: 'Pitanje' },
  { value: 'DISKUSIJA', label: 'Diskusija' },
  { value: 'OGLAS', label: 'Oglas' },
  { value: 'OSTALO', label: 'Ostalo' },
]

export default function NewPost() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await createPost(formData)
      navigate('/community')
    } catch (err) {
      setError(err.response?.data?.message || 'Greška pri kreiranju posta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/community')} className="text-gray-400 hover:text-gray-600">
          Nazad
        </button>
        <h1 className="font-semibold text-gray-800">Novi post</h1>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Kategorija *</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
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
              <label className="text-sm text-gray-600 mb-1 block">Naslov *</label>
              <input
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Naslov posta"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">Sadržaj *</label>
              <textarea
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                required
                rows={6}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                placeholder="Napiši post..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/community')}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition"
              >
                Odustani
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm transition disabled:opacity-50"
              >
                {loading ? 'Objavljivanje...' : 'Objavi post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}