import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getUserProfile, updateProfile, updateProfileImage } from '../api/auth'
import { sendConnectionRequest, getConnectionStatus, respondToRequest } from '../api/connections'
import { getSocket } from '../services/socket'

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

  const refreshConnectionStatus = async () => {
    if (!isOwnProfile && id) {
      try {
        const { connection: conn } = await getConnectionStatus(id)
        setConnection(conn)
      } catch (err) {
        console.error(err)
      }
    }
  }

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

  // Socket + custom event listeners
  useEffect(() => {
    const socket = getSocket()

    const handleSocketAccepted = () => refreshConnectionStatus()
    const handleSocketRequest = () => refreshConnectionStatus()
    const handleConnectionUpdate = () => refreshConnectionStatus()

    window.addEventListener('connection-updated', handleConnectionUpdate)
    socket?.on('connection_accepted', handleSocketAccepted)
    socket?.on('connection_request', handleSocketRequest)

    return () => {
      window.removeEventListener('connection-updated', handleConnectionUpdate)
      socket?.off('connection_accepted', handleSocketAccepted)
      socket?.off('connection_request', handleSocketRequest)
    }
  }, [id, isOwnProfile])

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
      window.dispatchEvent(new CustomEvent('connection-updated'))
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
      window.dispatchEvent(new CustomEvent('connection-updated'))
    } catch (err) {
      console.error(err)
    } finally {
      setConnectionLoading(false)
    }
  }

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#EFEDE8',
    }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%',
        border: '2px solid #FF6B35', borderTopColor: 'transparent',
        animation: 'spin 0.8s linear infinite',
      }} />
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
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '14px', border: 'none',
            background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
            color: 'white', fontWeight: '700', fontSize: '14px',
            cursor: connectionLoading ? 'not-allowed' : 'pointer',
            opacity: connectionLoading ? 0.6 : 1,
            boxShadow: '0 4px 16px rgba(255,107,53,0.3)',
            transition: 'opacity 0.2s',
          }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Postani Kolega
        </button>
      )
    }

    if (connection.status === 'PENDING' && connection.senderId === currentUser.id) {
      return (
        <button
          disabled
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '14px', border: 'none',
            background: '#F0EDE8', color: '#8E8E93',
            fontWeight: '700', fontSize: '14px', cursor: 'not-allowed',
          }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Zahtjev poslan
        </button>
      )
    }

    if (connection.status === 'PENDING' && connection.receiverId === currentUser.id) {
      return (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handleRespond('accept')}
            disabled={connectionLoading}
            style={{
              padding: '10px 20px', borderRadius: '14px', border: 'none',
              background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
              color: 'white', fontWeight: '700', fontSize: '14px',
              cursor: connectionLoading ? 'not-allowed' : 'pointer',
              opacity: connectionLoading ? 0.6 : 1,
            }}>
            Prihvati zahtjev
          </button>
          <button
            onClick={() => handleRespond('reject')}
            disabled={connectionLoading}
            style={{
              padding: '10px 20px', borderRadius: '14px', border: 'none',
              background: '#F0EDE8', color: '#6B7280',
              fontWeight: '700', fontSize: '14px',
              cursor: connectionLoading ? 'not-allowed' : 'pointer',
              opacity: connectionLoading ? 0.6 : 1,
            }}>
            Odbij
          </button>
        </div>
      )
    }

    if (connection.status === 'ACCEPTED') {
      return (
        <button
          onClick={() => navigate(`/chat/${profile.id}`)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '14px', border: 'none',
            background: '#FFF7ED', color: '#FF6B35',
            fontWeight: '700', fontSize: '14px', cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          style={{
            padding: '10px 20px', borderRadius: '14px', border: 'none',
            background: '#F0EDE8', color: '#6B7280',
            fontWeight: '700', fontSize: '14px',
            cursor: connectionLoading ? 'not-allowed' : 'pointer',
            opacity: connectionLoading ? 0.6 : 1,
          }}>
          Pošalji novi zahtjev
        </button>
      )
    }
  }

  const inputStyle = {
    background: '#F0EDE8', border: '1.5px solid #E8E4DF', color: '#1C1C1E',
    borderRadius: '12px', padding: '10px 14px', fontSize: '14px', width: '100%',
    outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box',
    fontFamily: 'inherit',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#EFEDE8' }}>

      {/* Cover */}
      <div style={{
        height: '180px', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #1C1C1E 0%, #2C2C2E 50%, #3A2010 100%)',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 80% 50%, rgba(255,107,53,0.25), transparent 60%)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 20% 80%, rgba(255,184,0,0.12), transparent 50%)',
        }} />
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>

        {/* Avatar sekcija */}
        <div style={{
          marginTop: '-56px', marginBottom: '28px',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px' }}>

            {/* Avatar */}
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '112px', height: '112px', borderRadius: '24px',
                overflow: 'hidden', border: '4px solid #EFEDE8',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              }}>
                {profile.profileImage ? (
                  <img src={profile.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: '900', fontSize: '36px',
                  }}>
                    {profile.firstName?.[0]}{profile.lastName?.[0]}
                  </div>
                )}
              </div>

              {isOwnProfile && (
                <label style={{
                  position: 'absolute', bottom: '-4px', right: '-4px',
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', boxShadow: '0 2px 8px rgba(255,107,53,0.4)',
                }}>
                  {imageUploading ? (
                    <div style={{
                      width: '14px', height: '14px', borderRadius: '50%',
                      border: '2px solid white', borderTopColor: 'transparent',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>
              )}
            </div>

            {/* Ime i info */}
            <div style={{ paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#1C1C1E', letterSpacing: '-0.02em' }}>
                  {profile.firstName} {profile.lastName}
                </h1>
                {profile.verificationStatus === 'VERIFIED' && (
                  <span style={{
                    fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '100px',
                    background: 'rgba(22,163,74,0.1)', color: '#16A34A',
                  }}>
                    ✓ Verifikovan
                  </span>
                )}
                {profile.verificationStatus === 'UNVERIFIED' && (
                  <span style={{
                    fontSize: '12px', fontWeight: '600', padding: '3px 10px', borderRadius: '100px',
                    background: '#FFF7ED', color: '#FF6B35',
                  }}>
                    ⚠️ Neverifikovan
                  </span>
                )}
                {connection?.status === 'ACCEPTED' && (
                  <span style={{
                    fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '100px',
                    background: '#FFF7ED', color: '#FF6B35',
                  }}>
                    🤝 Kolega
                  </span>
                )}
              </div>
              {profile.faculty && (
                <p style={{ color: '#6B7280', fontWeight: '500', fontSize: '15px' }}>{profile.faculty}</p>
              )}
              {profile.university && (
                <p style={{ color: '#AEAEB2', fontSize: '13px', marginTop: '2px' }}>{profile.university}</p>
              )}
            </div>
          </div>

          {/* Akcije */}
          <div style={{ display: 'flex', gap: '8px', paddingBottom: '8px' }}>
            {isOwnProfile ? (
              <button
                onClick={() => setEditing(!editing)}
                style={{
                  padding: '10px 20px', borderRadius: '14px', border: 'none',
                  background: editing ? '#F0EDE8' : 'white',
                  color: editing ? '#6B7280' : '#1C1C1E',
                  fontWeight: '700', fontSize: '14px', cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  transition: 'all 0.15s',
                }}>
                {editing ? 'Odustani' : '✏️ Uredi profil'}
              </button>
            ) : renderConnectionButton()}
          </div>
        </div>

        {/* Grid sadržaj */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', paddingBottom: '40px' }}>

          {/* Lijeva kolona */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Statistike */}
            <div style={{
              background: '#FDFCF9', borderRadius: '20px', padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}>
              <p style={{
                fontSize: '11px', fontWeight: '700', color: '#AEAEB2',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px',
              }}>
                Aktivnost
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { icon: '🛍️', label: 'Oglasi u Shopu', value: profile._count?.shopItems || 0 },
                  { icon: '📄', label: 'Materijali', value: profile._count?.uploadedMaterials || 0 },
                  { icon: '💬', label: 'Postovi', value: profile._count?.communityPosts || 0 },
                ].map((stat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: '#6B7280' }}>{stat.icon} {stat.label}</span>
                    <span style={{
                      fontWeight: '800', fontSize: '13px', padding: '2px 10px',
                      borderRadius: '100px', background: '#FFF7ED', color: '#FF6B35',
                    }}>
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Detalji */}
            <div style={{
              background: '#FDFCF9', borderRadius: '20px', padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}>
              <p style={{
                fontSize: '11px', fontWeight: '700', color: '#AEAEB2',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px',
              }}>
                Detalji
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {profile.university && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>🎓</span>
                    <span style={{ fontSize: '13px', color: '#6B7280' }}>{profile.university}</span>
                  </div>
                )}
                {profile.faculty && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>🏛️</span>
                    <span style={{ fontSize: '13px', color: '#6B7280' }}>{profile.faculty}</span>
                  </div>
                )}
                {profile.yearOfStudy && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>📅</span>
                    <span style={{ fontSize: '13px', color: '#6B7280' }}>{YEAR_LABELS[profile.yearOfStudy]}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>📆</span>
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>
                    Član od {new Date(profile.createdAt).toLocaleDateString('bs-BA', {
                      month: 'long', year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Desna kolona */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Edit forma */}
            {editing && isOwnProfile && (
              <div style={{
                background: '#FDFCF9', borderRadius: '20px', padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: '2px solid rgba(255,107,53,0.2)',
              }}>
                <h3 style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '17px', marginBottom: '20px' }}>
                  Uredi profil ✏️
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Ime
                      </label>
                      <input style={inputStyle} value={formData.firstName}
                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                        onFocus={e => e.target.style.borderColor = '#FF6B35'}
                        onBlur={e => e.target.style.borderColor = '#E8E4DF'}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Prezime
                      </label>
                      <input style={inputStyle} value={formData.lastName}
                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                        onFocus={e => e.target.style.borderColor = '#FF6B35'}
                        onBlur={e => e.target.style.borderColor = '#E8E4DF'}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Bio
                    </label>
                    <textarea style={{ ...inputStyle, height: '90px', resize: 'none' }}
                      value={formData.bio}
                      onChange={e => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Napiši nešto o sebi..."
                      onFocus={e => e.target.style.borderColor = '#FF6B35'}
                      onBlur={e => e.target.style.borderColor = '#E8E4DF'}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Univerzitet
                      </label>
                      <input style={inputStyle} value={formData.university}
                        onChange={e => setFormData({ ...formData, university: e.target.value })}
                        placeholder="Univerzitet u Sarajevu"
                        onFocus={e => e.target.style.borderColor = '#FF6B35'}
                        onBlur={e => e.target.style.borderColor = '#E8E4DF'}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Fakultet
                      </label>
                      <input style={inputStyle} value={formData.faculty}
                        onChange={e => setFormData({ ...formData, faculty: e.target.value })}
                        placeholder="ETF"
                        onFocus={e => e.target.style.borderColor = '#FF6B35'}
                        onBlur={e => e.target.style.borderColor = '#E8E4DF'}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Godina studija
                    </label>
                    <select style={{ ...inputStyle, cursor: 'pointer' }}
                      value={formData.yearOfStudy}
                      onChange={e => setFormData({ ...formData, yearOfStudy: e.target.value })}
                      onFocus={e => e.target.style.borderColor = '#FF6B35'}
                      onBlur={e => e.target.style.borderColor = '#E8E4DF'}
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
                    style={{
                      padding: '12px', borderRadius: '14px', border: 'none',
                      background: saving ? '#E5E5EA' : 'linear-gradient(135deg, #FF6B35, #FFB800)',
                      color: saving ? '#AEAEB2' : 'white',
                      fontWeight: '800', fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer',
                      transition: 'opacity 0.2s',
                    }}>
                    {saving ? 'Čuvanje...' : 'Sačuvaj izmjene'}
                  </button>
                </div>
              </div>
            )}

            {/* Bio */}
            <div style={{
              background: '#FDFCF9', borderRadius: '20px', padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}>
              <h3 style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '17px', marginBottom: '14px' }}>
                O meni
              </h3>
              {profile.bio ? (
                <p style={{ color: '#3A3A3C', lineHeight: '1.65', fontSize: '15px' }}>
                  {profile.bio}
                </p>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <p style={{ fontSize: '32px', marginBottom: '8px' }}>✍️</p>
                  <p style={{ color: '#AEAEB2', fontSize: '14px' }}>
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