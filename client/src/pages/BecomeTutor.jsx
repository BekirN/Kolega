import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTutorProfile } from '../api/tutoring'

export default function BecomeTutor() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    bio: '',
    hourlyRate: '',
    subjects: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await createTutorProfile({
        ...formData,
        subjects: formData.subjects.split(',').map(s => s.trim()).filter(Boolean),
      })
      navigate('/tutoring')
    } catch (err) {
      setError(err.response?.data?.message || 'Greška pri kreiranju profila')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/tutoring')} className="text-gray-400 hover:text-gray-600">
          Nazad
        </button>
        <h1 className="font-semibold text-gray-800">Postani tutor</h1>
      </nav>

      <div className="max-w-lg mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Kreiraj tutor profil</h2>
          <p className="text-sm text-gray-500 mb-6">
            Pomozi kolegama studentima i zaradi dodatni džeparac!
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">O sebi</label>
              <textarea
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                placeholder="Opiši svoje iskustvo i pristup predavanju..."
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">
                Predmeti * <span className="text-gray-400">(odvojeni zarezom)</span>
              </label>
              <input
                value={formData.subjects}
                onChange={e => setFormData({ ...formData, subjects: e.target.value })}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Matematika, Fizika, Programiranje"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">Satnica (KM/h) *</label>
              <input
                type="number"
                min="5"
                step="1"
                value={formData.hourlyRate}
                onChange={e => setFormData({ ...formData, hourlyRate: e.target.value })}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="15"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/tutoring')}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition"
              >
                Odustani
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm transition disabled:opacity-50"
              >
                {loading ? 'Kreiranje...' : 'Kreiraj profil'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}