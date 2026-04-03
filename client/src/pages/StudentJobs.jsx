import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getJobs, deleteJob } from '../api/jobs'

const CATEGORIES = {
  UGOSTITELJSTVO: { label: 'Ugostiteljstvo', emoji: '🍽️' },
  TRGOVINA: { label: 'Trgovina', emoji: '🛒' },
  ADMINISTRACIJA: { label: 'Administracija', emoji: '📋' },
  IT: { label: 'IT', emoji: '💻' },
  TUTORING: { label: 'Tutoring', emoji: '📚' },
  DOSTAVA: { label: 'Dostava', emoji: '🚴' },
  PROMOCIJA: { label: 'Promocija', emoji: '📢' },
  FIZICKI_RAD: { label: 'Fizički rad', emoji: '💪' },
  OSTALO: { label: 'Ostalo', emoji: '✨' },
}

const SALARY_PERIOD = {
  PO_SATU: '/sat',
  PO_DANU: '/dan',
  PO_MJESECU: '/mj.',
  DOGOVOR: 'dogovor',
}

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`
  return new Date(date).toLocaleDateString('bs-BA')
}

export default function StudentJobs() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [search, setSearch] = useState('')
  const [selectedJob, setSelectedJob] = useState(null)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const filters = {}
      if (activeType) filters.type = activeType
      if (activeCategory) filters.category = activeCategory
      if (search) filters.search = search
      const data = await getJobs(filters)
      setJobs(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchJobs() }, [activeType, activeCategory])

  const handleDelete = async (id) => {
    if (!confirm('Obrisati oglas?')) return
    try {
      await deleteJob(id)
      setJobs(prev => prev.filter(j => j.id !== id))
      if (selectedJob?.id === id) setSelectedJob(null)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#F5F5F0' }}>

      {/* Hero Header */}
      <div className="relative overflow-hidden px-8 pt-10 pb-8"
        style={{ background: 'linear-gradient(135deg, #1C1C1E 0%, #2C1810 60%, #1C1C1E 100%)' }}>

        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(255,107,53,0.2), transparent 60%)' }} />
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 80% 30%, rgba(255,184,0,0.1), transparent 50%)' }} />

        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4"
            style={{ background: 'rgba(255,107,53,0.15)', color: '#FF6B35', border: '1px solid rgba(255,107,53,0.3)' }}>
            💼 Studentski poslovi
          </div>
          <h1 className="text-4xl font-black text-white mb-2">
            Nađi posao ili{' '}
            <span style={{
              background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              zaposli studenta
            </span>
          </h1>
          <p style={{ color: '#8E8E93' }} className="text-base mb-6">
            Konobarisanje, IT poslovi, tutoring, dostava i još mnogo toga.
          </p>

          {/* Search */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#8E8E93' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchJobs()}
                placeholder="Pretraži poslove..."
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none"
                style={{ background: '#2C2C2E', color: '#E5E5EA', border: '1px solid #3A3A3C' }}
              />
            </div>
            <button
              onClick={fetchJobs}
              className="px-6 py-3 rounded-xl text-white font-semibold text-sm"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }}>
              Traži
            </button>
            <button
              onClick={() => navigate('/jobs/new')}
              className="px-6 py-3 rounded-xl text-white font-semibold text-sm flex items-center gap-2"
              style={{ background: '#2C2C2E', border: '1px solid #3A3A3C' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Objavi
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Filteri */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Tip */}
          <div className="flex gap-2">
            {[
              { value: '', label: '🔍 Sve' },
              { value: 'NUDIM', label: '💼 Nudim posao' },
              { value: 'TRAZIM', label: '🙋 Tražim posao' },
            ].map(t => (
              <button
                key={t.value}
                onClick={() => setActiveType(t.value)}
                className="px-4 py-2 rounded-full text-sm font-medium transition"
                style={{
                  background: activeType === t.value ? '#FF6B35' : 'white',
                  color: activeType === t.value ? 'white' : '#6B7280',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Separator */}
          <div className="w-px" style={{ background: '#E5E5EA' }} />

          {/* Kategorije */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveCategory('')}
              className="px-4 py-2 rounded-full text-sm font-medium transition"
              style={{
                background: activeCategory === '' ? '#1C1C1E' : 'white',
                color: activeCategory === '' ? 'white' : '#6B7280',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}>
              Sve kategorije
            </button>
            {Object.entries(CATEGORIES).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className="px-4 py-2 rounded-full text-sm font-medium transition"
                style={{
                  background: activeCategory === key ? '#1C1C1E' : 'white',
                  color: activeCategory === key ? 'white' : '#6B7280',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}>
                {val.emoji} {val.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sadržaj */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: '#FF6B35', borderTopColor: 'transparent' }} />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 rounded-2xl"
            style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p className="text-5xl mb-4">💼</p>
            <p className="text-xl font-bold text-gray-800 mb-2">Nema oglasa</p>
            <p className="text-gray-400 mb-6">Budi prvi koji objavljuje posao!</p>
            <button onClick={() => navigate('/jobs/new')}
              className="px-6 py-3 rounded-xl text-white font-semibold text-sm"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }}>
              Objavi oglas
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Lista poslova */}
            <div className="lg:col-span-1 space-y-3">
              <p className="text-sm text-gray-400 font-medium mb-3">{jobs.length} oglasa</p>
              {jobs.map(job => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className="rounded-2xl p-4 cursor-pointer transition-all"
                  style={{
                    background: selectedJob?.id === job.id ? '#FFF7ED' : 'white',
                    boxShadow: selectedJob?.id === job.id
                      ? '0 0 0 2px #FF6B35'
                      : '0 1px 3px rgba(0,0,0,0.08)',
                    transform: selectedJob?.id === job.id ? 'scale(1.01)' : 'scale(1)',
                  }}>

                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{
                          background: job.type === 'NUDIM' ? '#F0FDF4' : '#EFF6FF',
                          color: job.type === 'NUDIM' ? '#16A34A' : '#2563EB',
                        }}>
                        {job.type === 'NUDIM' ? '💼 Nudim' : '🙋 Tražim'}
                      </span>
                      <span className="text-xs text-gray-400">{timeAgo(job.createdAt)}</span>
                    </div>
                    {job.isRemote && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: '#F5F3FF', color: '#7C3AED' }}>
                        🌐 Remote
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{job.title}</h3>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: '#FFF7ED', color: '#FF6B35' }}>
                      {CATEGORIES[job.category]?.emoji} {CATEGORIES[job.category]?.label}
                    </span>
                    {job.location && (
                      <span className="text-xs text-gray-400">📍 {job.location}</span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{job.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden">
                        {job.author?.profileImage ? (
                          <img src={job.author.profileImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }}>
                            {job.author?.firstName?.[0]}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {job.author?.firstName} {job.author?.lastName}
                      </span>
                    </div>
                    {job.salary && (
                      <span className="text-sm font-black" style={{ color: '#FF6B35' }}>
                        {job.salary} KM{job.salaryPeriod ? SALARY_PERIOD[job.salaryPeriod] : ''}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Detalji posla */}
            <div className="lg:col-span-2">
              {!selectedJob ? (
                <div className="rounded-2xl flex flex-col items-center justify-center py-20"
                  style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  <p className="text-5xl mb-4">👈</p>
                  <p className="text-gray-500 font-medium">Odaberi oglas za pregled</p>
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>

                  {/* Header */}
                  <div className="p-6 pb-4"
                    style={{ background: 'linear-gradient(135deg, #1C1C1E, #2C2C2E)' }}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                            style={{
                              background: selectedJob.type === 'NUDIM'
                                ? 'rgba(22,163,74,0.2)' : 'rgba(37,99,235,0.2)',
                              color: selectedJob.type === 'NUDIM' ? '#4ADE80' : '#60A5FA',
                            }}>
                            {selectedJob.type === 'NUDIM' ? '💼 Nudim posao' : '🙋 Tražim posao'}
                          </span>
                          {selectedJob.isRemote && (
                            <span className="text-xs px-3 py-1.5 rounded-full font-medium"
                              style={{ background: 'rgba(124,58,237,0.2)', color: '#A78BFA' }}>
                              🌐 Remote
                            </span>
                          )}
                        </div>
                        <h2 className="text-2xl font-black text-white">{selectedJob.title}</h2>
                      </div>

                      {user.id === selectedJob.authorId && (
                        <button
                          onClick={() => handleDelete(selectedJob.id)}
                          className="p-2 rounded-xl transition"
                          style={{ background: 'rgba(255,59,48,0.15)', color: '#FF3B30' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-wrap gap-3">
                      <span className="flex items-center gap-1.5 text-sm"
                        style={{ color: '#8E8E93' }}>
                        {CATEGORIES[selectedJob.category]?.emoji}
                        {CATEGORIES[selectedJob.category]?.label}
                      </span>
                      {selectedJob.location && (
                        <span className="flex items-center gap-1.5 text-sm" style={{ color: '#8E8E93' }}>
                          📍 {selectedJob.location}
                        </span>
                      )}
                      {selectedJob.hours && (
                        <span className="flex items-center gap-1.5 text-sm" style={{ color: '#8E8E93' }}>
                          ⏰ {selectedJob.hours}
                        </span>
                      )}
                      {selectedJob.salary && (
                        <span className="flex items-center gap-1.5 text-sm font-bold" style={{ color: '#FF6B35' }}>
                          💰 {selectedJob.salary} KM
                          {selectedJob.salaryPeriod ? SALARY_PERIOD[selectedJob.salaryPeriod] : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* Opis */}
                    <div>
                      <h3 className="font-bold text-gray-900 mb-3">O poslu</h3>
                      <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {selectedJob.description}
                      </p>
                    </div>

                    {/* Kontakt */}
                    <div className="rounded-2xl p-5" style={{ background: '#FFF7ED' }}>
                      <h3 className="font-bold text-gray-900 mb-4">Kontaktiraj oglašivača</h3>

                      {/* Profil */}
                      <div
                        className="flex items-center gap-3 mb-4 cursor-pointer"
                        onClick={() => navigate(`/profile/${selectedJob.authorId}`)}>
                        <div className="w-12 h-12 rounded-xl overflow-hidden">
                          {selectedJob.author?.profileImage ? (
                            <img src={selectedJob.author.profileImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-bold"
                              style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }}>
                              {selectedJob.author?.firstName?.[0]}{selectedJob.author?.lastName?.[0]}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">
                            {selectedJob.author?.firstName} {selectedJob.author?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {selectedJob.author?.faculty || selectedJob.author?.university || 'Student'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {selectedJob.contactEmail && (
                          
                            <a href={`mailto:${selectedJob.contactEmail}`}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
                            style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }}>
                            ✉️ {selectedJob.contactEmail}
                          </a>
                        )}
                        {selectedJob.contactPhone && (
                          
                           <a href={`tel:${selectedJob.contactPhone}`}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-80"
                            style={{ background: 'white', color: '#FF6B35' }}>
                            📞 {selectedJob.contactPhone}
                          </a>
                        )}
                        {user.id !== selectedJob.authorId && (
                          <button
                            onClick={() => navigate(`/chat/${selectedJob.authorId}`)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-80"
                            style={{ background: 'white', color: '#1C1C1E' }}>
                            💬 Pošalji poruku
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Datum */}
                    <p className="text-xs text-gray-400">
                      Objavljeno: {new Date(selectedJob.createdAt).toLocaleDateString('bs-BA', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}