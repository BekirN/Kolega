import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getUserProfile, updateProfile, updateProfileImage } from '../api/auth'
import { sendConnectionRequest, getConnectionStatus, respondToRequest } from '../api/connections'

const YEAR_LABELS = {
  1: '1. godina', 2: '2. godina', 3: '3. godina',
  4: '4. godina', 5: '5. godina'
}

export default function Profile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const isOwnProfile = id === currentUser.id

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [connection, setConnection] = useState(null)
  const [connectionLoading, setConnectionLoading] = useState(false)
  const [formData, setFormData] = useState({})

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      try {
        const data = await getUserProfile(id)
        setProfile(data)
        setFormData({
          firstName: data.firstName,
          lastName: data.lastName,
          university: data.university || '',
          faculty: data.faculty || '',
          yearOfStudy: data.yearOfStudy || '',
          bio: data.bio || '',
        })
        if (!isOwnProfile) {
          try {
            const { connection: conn } = await getConnectionStatus(id)
            setConnection(conn)
          } catch (err) {
            console.error(err)
          }
        }
      } catch (err) {
        console.error(err)
        navigate('/dashboard')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    try {
      const { user } = await updateProfile(formData)
      setProfile(prev => ({ ...prev, ...user }))
      localStorage.setItem('user', JSON.stringify({ ...currentUser, ...user }))
      setEditing(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageUploading(true)
    try {
      const { profileImage } = await updateProfileImage(file)
      setProfile(prev => ({ ...prev, profileImage }))
      localStorage.setItem('user', JSON.stringify({ ...currentUser, profileImage }))
    } catch (err) {
      console.error(err)
    } finally {
      setImageUploading(false)
      e.target.value = ''
    }
  }

  const handleSendRequest = async () => {
    setConnectionLoading(true)
    try {
      const data = await sendConnectionRequest(id)
      setConnection(data.connection)
    } catch (err) {
      console.error(err)
    } finally {
      setConnectionLoading(false)
    }
  }

  const handleRespond = async (action) => {
    setConnectionLoading(true)
    try {
      const data = await respondToRequest(connection.id, action)
      setConnection(data.connection)
    } catch (err) {
      console.error(err)
    } finally {
      setConnectionLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F5F0' }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: '#FF6B35', borderTopColor: 'transparent' }} />
    </div>
  )

  if (!profile) return null

  const renderConnectionButton = () => {
    if (isOwnProfile) return null

    if (!connection) {
      return (
        <button
          onClick={handleSendRequest}
          disabled={connectionLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition hover:opacity-90 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Postani Kolega
        </button>
      )
    }

    if (connection.status === 'PENDING' && connection.senderId === currentUser.id) {
      return (
        <button disabled
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium cursor-not-allowed"
          style={{ background: '#F5F5F0', color: '#8E8E93' }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Zahtjev poslan
        </button>
      )
    }

    if (connection.status === 'PENDING' && connection.receiverId === currentUser.id) {
      return (
        <div className="flex gap-2">
          <button
            onClick={() => handleRespond('accept')}
            disabled={connectionLoading}
            className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }}>
            Prihvati zahtjev
          </button>
          <button
            onClick={() => handleRespond('reject')}
            disabled={connectionLoading}
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50"
            style={{ background: '#F5F5F0', color: '#6B7280' }}>
            Odbij
          </button>
        </div>
      )
    }

    if (connection.status === 'ACCEPTED') {
      return (
        <button
          onClick={() => navigate(`/chat/${profile.id}`)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-80"
          style={{ background: '#FFF7ED', color: '#FF6B35' }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Pošalji poruku
        </button>
      )
    }

    if (connection.status === 'REJECTED') {
      return (
        <button
          onClick={handleSendRequest}
          disabled={connectionLoading}
          className="px-5 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50"
          style={{ background: '#F5F5F0', color: '#6B7280' }}>
          Pošalji novi zahtjev
        </button>
      )
    }
  }

  const inputStyle = {
    background: '#F5F5F0',
    border: '1.5px solid #E5E5EA',
    color: '#1C1C1E',
    borderRadius: '12px',
    padding: '10px 14px',
    fontSize: '14px',
    width: '100%',
    outline: 'none',
  }

  return (
    <div className="min-h-screen" style={{ background: '#F5F5F0' }}>

      {/* Cover */}
      <div className="h-48 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1C1C1E 0%, #2C2C2E 50%, #3A2010 100%)' }}>
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(circle at 80% 50%, rgba(255,107,53,0.3), transparent 60%)' }} />
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(circle at 20% 80%, rgba(255,184,0,0.15), transparent 50%)' }} />
      </div>

      <div className="max-w-4xl mx-auto px-6">

        {/* Avatar sekcija */}
        <div className="relative -mt-16 mb-8 flex items-end justify-between">
          <div className="flex items-end gap-5">

            {/* Avatar */}
            <div className="relative">
              <div className="w-28 h-28 rounded-2xl overflow-hidden flex-shrink-0"
                style={{ border: '4px solid #F5F5F0', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                {profile.profileImage ? (
                  <img src={profile.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-black text-3xl"
                    style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }}>
                    {profile.firstName?.[0]}{profile.lastName?.[0]}
                  </div>
                )}
              </div>

              {isOwnProfile && (
                <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }}>
                  {imageUploading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* Ime i info */}
            <div className="pb-2">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-2xl font-black text-gray-900">
                  {profile.firstName} {profile.lastName}
                </h1>
                {profile.verificationStatus === 'VERIFIED' && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: '#F0FDF4', color: '#16A34A' }}>
                    ✓ Verifikovan
                  </span>
                )}
                {profile.verificationStatus === 'UNVERIFIED' && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ background: '#FFF7ED', color: '#FF6B35' }}>
                    ⚠️ Neverifikovan
                  </span>
                )}
                {connection?.status === 'ACCEPTED' && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: '#FFF7ED', color: '#FF6B35' }}>
                    🤝 Kolega
                  </span>
                )}
              </div>
              {profile.faculty && (
                <p className="text-gray-500 font-medium">{profile.faculty}</p>
              )}
              {profile.university && (
                <p className="text-sm text-gray-400">{profile.university}</p>
              )}
            </div>
          </div>

          {/* Akcije */}
          <div className="flex gap-2 pb-2">
            {isOwnProfile ? (
              <button
                onClick={() => setEditing(!editing)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition"
                style={{
                  background: editing ? '#F5F5F0' : 'white',
                  color: editing ? '#6B7280' : '#1C1C1E',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}>
                {editing ? 'Odustani' : '✏️ Uredi profil'}
              </button>
            ) : renderConnectionButton()}
          </div>
        </div>

        {/* Grid sadržaj */}
        <div className="grid grid-cols-3 gap-5 pb-10">

          {/* Lijeva kolona */}
          <div className="col-span-1 space-y-4">

            {/* Statistike */}
            <div className="rounded-2xl p-5" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <h3 className="text-sm font-bold text-gray-700 mb-4">Aktivnost</h3>
              <div className="space-y-3">
                {[
                  { icon: '🛍️', label: 'Oglasi u Shopu', value: profile._count?.shopItems || 0 },
                  { icon: '📄', label: 'Materijali', value: profile._count?.materials || 0 },
                  { icon: '💬', label: 'Postovi', value: profile._count?.communityPosts || 0 },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{stat.icon} {stat.label}</span>
                    <span className="font-bold text-gray-900 text-sm px-2.5 py-0.5 rounded-lg"
                      style={{ background: '#FFF7ED', color: '#FF6B35' }}>
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Detalji */}
            <div className="rounded-2xl p-5" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <h3 className="text-sm font-bold text-gray-700 mb-4">Detalji</h3>
              <div className="space-y-2.5">
                {profile.university && (
                  <div className="flex items-center gap-2.5 text-sm text-gray-500">
                    <span className="text-base">🎓</span>
                    <span>{profile.university}</span>
                  </div>
                )}
                {profile.faculty && (
                  <div className="flex items-center gap-2.5 text-sm text-gray-500">
                    <span className="text-base">🏛️</span>
                    <span>{profile.faculty}</span>
                  </div>
                )}
                {profile.yearOfStudy && (
                  <div className="flex items-center gap-2.5 text-sm text-gray-500">
                    <span className="text-base">📅</span>
                    <span>{YEAR_LABELS[profile.yearOfStudy]}</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-sm text-gray-500">
                  <span className="text-base">📆</span>
                  <span>
                    Član od {new Date(profile.createdAt).toLocaleDateString('bs-BA', {
                      month: 'long', year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Desna kolona */}
          <div className="col-span-2 space-y-4">

            {/* Edit forma */}
            {editing && isOwnProfile && (
              <div className="rounded-2xl p-6" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '2px solid #FFE0CC' }}>
                <h3 className="font-bold text-gray-900 mb-5 text-lg">Uredi profil ✏️</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-1.5 block">Ime</label>
                      <input
                        style={inputStyle}
                        value={formData.firstName}
                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                        onFocus={e => e.target.style.borderColor = '#FF6B35'}
                        onBlur={e => e.target.style.borderColor = '#E5E5EA'}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-1.5 block">Prezime</label>
                      <input
                        style={inputStyle}
                        value={formData.lastName}
                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                        onFocus={e => e.target.style.borderColor = '#FF6B35'}
                        onBlur={e => e.target.style.borderColor = '#E5E5EA'}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-1.5 block">Bio</label>
                    <textarea
                      style={{ ...inputStyle, height: '90px', resize: 'none' }}
                      value={formData.bio}
                      onChange={e => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Napiši nešto o sebi..."
                      onFocus={e => e.target.style.borderColor = '#FF6B35'}
                      onBlur={e => e.target.style.borderColor = '#E5E5EA'}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-1.5 block">Univerzitet</label>
                      <input
                        style={inputStyle}
                        value={formData.university}
                        onChange={e => setFormData({ ...formData, university: e.target.value })}
                        placeholder="Univerzitet u Sarajevu"
                        onFocus={e => e.target.style.borderColor = '#FF6B35'}
                        onBlur={e => e.target.style.borderColor = '#E5E5EA'}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-1.5 block">Fakultet</label>
                      <input
                        style={inputStyle}
                        value={formData.faculty}
                        onChange={e => setFormData({ ...formData, faculty: e.target.value })}
                        placeholder="ETF"
                        onFocus={e => e.target.style.borderColor = '#FF6B35'}
                        onBlur={e => e.target.style.borderColor = '#E5E5EA'}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-1.5 block">Godina studija</label>
                    <select
                      style={inputStyle}
                      value={formData.yearOfStudy}
                      onChange={e => setFormData({ ...formData, yearOfStudy: e.target.value })}
                      onFocus={e => e.target.style.borderColor = '#FF6B35'}
                      onBlur={e => e.target.style.borderColor = '#E5E5EA'}
                    >
                      <option value="">Odaberi</option>
                      {[1, 2, 3, 4, 5].map(y => (
                        <option key={y} value={y}>{YEAR_LABELS[y]}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-3 rounded-xl text-white font-semibold text-sm transition hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }}
                  >
                    {saving ? 'Čuvanje...' : 'Sačuvaj izmjene'}
                  </button>
                </div>
              </div>
            )}

            {/* Bio */}
            <div className="rounded-2xl p-6" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <h3 className="font-bold text-gray-900 mb-3">O meni</h3>
              {profile.bio ? (
                <p className="text-gray-600 leading-relaxed">{profile.bio}</p>
              ) : (
                <div className="text-center py-6">
                  <p className="text-3xl mb-2">✍️</p>
                  <p className="text-gray-400 text-sm">
                    {isOwnProfile
                      ? 'Dodaj bio klikom na "Uredi profil"'
                      : 'Korisnik nije dodao bio.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}