import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getUserProfile, updateProfile, updateProfileImage, uploadIndexImage } from '../api/auth'
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
  const [indexUploading, setIndexUploading] = useState(false)
  const [verificationMsg, setVerificationMsg] = useState('')
  const indexInputRef = useRef(null)

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

  const refreshProfile = async () => {
    try {
      const data = await getUserProfile(id)
      setProfile(data)
      if (isOwnProfile) {
        const stored = JSON.parse(localStorage.getItem('user') || '{}')
        localStorage.setItem('user', JSON.stringify({
          ...stored,
          verificationStatus: data.verificationStatus,
        }))
      }
    } catch (err) {
      console.error(err)
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

    // Listener za verifikaciju – kada admin odobri/odbije
    const handleNewActivity = async (activity) => {
      if (
        activity?.message?.includes('verifikovan') ||
        activity?.message?.includes('odbijen') ||
        activity?.link?.includes(id)
      ) {
        await refreshProfile()
      }
    }

    // Custom event za profile update
    const handleProfileUpdate = async (e) => {
      const activity = e.detail
      if (
        activity?.message?.includes('verifikovan') ||
        activity?.message?.includes('odbijen') ||
        activity?.link?.includes(id)
      ) {
        await refreshProfile()
      }
    }

    window.addEventListener('connection-updated', handleConnectionUpdate)
    window.addEventListener('profile-update', handleProfileUpdate)
    socket?.on('connection_accepted', handleSocketAccepted)
    socket?.on('connection_request', handleSocketRequest)
    socket?.on('new_activity', handleNewActivity)

    return () => {
      window.removeEventListener('connection-updated', handleConnectionUpdate)
      window.removeEventListener('profile-update', handleProfileUpdate)
      socket?.off('connection_accepted', handleSocketAccepted)
      socket?.off('connection_request', handleSocketRequest)
      socket?.off('new_activity', handleNewActivity)
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

  const handleIndexUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setIndexUploading(true)
    try {
      const data = await uploadIndexImage(file)

      // Odmah ažuriraj profile state bez refresha
      setProfile(prev => ({ ...prev, verificationStatus: 'PENDING' }))

      // Ažuriraj localStorage
      const updatedUser = { ...currentUser, verificationStatus: 'PENDING' }
      localStorage.setItem('user', JSON.stringify(updatedUser))

      setVerificationMsg(data.message)
      setTimeout(() => setVerificationMsg(''), 5000)
    } catch (err) {
      setVerificationMsg(err.response?.data?.message || 'Greška pri uploadu')
      setTimeout(() => setVerificationMsg(''), 4000)
    } finally {
      setIndexUploading(false)
      if (e.target) e.target.value = ''
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
        <button onClick={handleSendRequest} disabled={connectionLoading} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 20px', borderRadius: '14px', border: 'none',
          background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
          color: 'white', fontWeight: '700', fontSize: '14px',
          cursor: connectionLoading ? 'not-allowed' : 'pointer',
          opacity: connectionLoading ? 0.6 : 1,
          boxShadow: '0 4px 16px rgba(255,107,53,0.3)',
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
        <button disabled style={{
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
          <button onClick={() => handleRespond('accept')} disabled={connectionLoading} style={{
            padding: '10px 20px', borderRadius: '14px', border: 'none',
            background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
            color: 'white', fontWeight: '700', fontSize: '14px',
            cursor: connectionLoading ? 'not-allowed' : 'pointer',
            opacity: connectionLoading ? 0.6 : 1,
          }}>
            Prihvati zahtjev
          </button>
          <button onClick={() => handleRespond('reject')} disabled={connectionLoading} style={{
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
        <button onClick={() => navigate(`/chat/${profile.id}`)} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 20px', borderRadius: '14px', border: 'none',
          background: '#FFF7ED', color: '#FF6B35',
          fontWeight: '700', fontSize: '14px', cursor: 'pointer',
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
        <button onClick={handleSendRequest} disabled={connectionLoading} style={{
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

  // Verifikacija badge komponenta
  const VerificationBadge = () => {
    if (profile.verificationStatus === 'VERIFIED') {
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          fontSize: '12px', fontWeight: '700', padding: '4px 12px', borderRadius: '100px',
          background: 'linear-gradient(135deg, rgba(22,163,74,0.15), rgba(74,222,128,0.1))',
          color: '#16A34A', border: '1px solid rgba(22,163,74,0.3)',
        }}>
          🎓 Verifikovani Student
        </span>
      )
    }
    if (profile.verificationStatus === 'PENDING') {
      return (
        <span style={{
          fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '100px',
          background: 'rgba(255,184,0,0.1)', color: '#FFB800',
          border: '1px solid rgba(255,184,0,0.3)',
        }}>
          ⏳ Verifikacija u toku
        </span>
      )
    }
    if (profile.verificationStatus === 'UNVERIFIED') {
      return (
        <span style={{
          fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '100px',
          background: '#FFF7ED', color: '#FF6B35',
          border: '1px solid rgba(255,107,53,0.2)',
        }}>
          ⚠️ Neverifikovan
        </span>
      )
    }
    return null
  }

  return (
    <div style={{ minHeight: '100vh', background: '#EFEDE8' }}>

      {/* Cover */}
      <div style={{
        height: '180px', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #1C1C1E 0%, #2C2C2E 50%, #3A2010 100%)',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 50%, rgba(255,107,53,0.25), transparent 60%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 80%, rgba(255,184,0,0.12), transparent 50%)' }} />
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>

        {/* Avatar + info header */}
        <div style={{
          marginTop: '-56px', marginBottom: '28px',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px' }}>

            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
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

              {/* Verified badge na avataru */}
              {profile.verificationStatus === 'VERIFIED' && (
                <div style={{
                  position: 'absolute', bottom: '-4px', right: '-4px',
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #16A34A, #4ADE80)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid #EFEDE8',
                  boxShadow: '0 2px 8px rgba(22,163,74,0.4)',
                  fontSize: '14px',
                }}>
                  🎓
                </div>
              )}

              {/* Camera button za vlastiti profil */}
              {isOwnProfile && (
                <label style={{
                  position: 'absolute', top: '-4px', right: '-4px',
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', boxShadow: '0 2px 8px rgba(255,107,53,0.4)',
                }}>
                  {imageUploading ? (
                    <div style={{
                      width: '12px', height: '12px', borderRadius: '50%',
                      border: '2px solid white', borderTopColor: 'transparent',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#1C1C1E', letterSpacing: '-0.02em' }}>
                  {profile.firstName} {profile.lastName}
                </h1>
                <VerificationBadge />
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
              <button onClick={() => setEditing(!editing)} style={{
                padding: '10px 20px', borderRadius: '14px', border: 'none',
                background: editing ? '#F0EDE8' : 'white',
                color: editing ? '#6B7280' : '#1C1C1E',
                fontWeight: '700', fontSize: '14px', cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
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

            {/* Verifikacija sekcija – samo vlastiti profil */}
            {isOwnProfile && (
              <div>
                {profile.verificationStatus === 'UNVERIFIED' && (
                  <div style={{
                    background: '#FDFCF9', borderRadius: '20px', padding: '20px',
                    border: '1.5px dashed #D8D4CC',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                        background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                      }}>🎓</div>
                      <div>
                        <p style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '14px', marginBottom: '2px' }}>
                          Verificiraj student status
                        </p>
                        <p style={{ color: '#7A7570', fontSize: '12px', lineHeight: '1.5' }}>
                          Uploaduj sliku indeksa da dobiješ verifikacijski badge
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      {['📸 Indeks', '🔒 Privatno', '⚡ Brza provjera'].map(tip => (
                        <span key={tip} style={{
                          fontSize: '11px', padding: '3px 8px', borderRadius: '100px',
                          background: 'rgba(255,107,53,0.1)', color: '#FF6B35', fontWeight: '600',
                        }}>{tip}</span>
                      ))}
                    </div>
                    <button
                      onClick={() => indexInputRef.current?.click()}
                      disabled={indexUploading}
                      style={{
                        width: '100%', padding: '10px', borderRadius: '12px', border: 'none',
                        background: indexUploading ? '#D8D4CC' : 'linear-gradient(135deg, #FF6B35, #FFB800)',
                        color: indexUploading ? '#9A9690' : 'white',
                        fontWeight: '700', fontSize: '13px',
                        cursor: indexUploading ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      }}>
                      {indexUploading ? (
                        <>
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid white', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                          Uploading...
                        </>
                      ) : '📤 Upload indeksa'}
                    </button>
                    <input ref={indexInputRef} type="file" accept="image/*" onChange={handleIndexUpload} style={{ display: 'none' }} />
                  </div>
                )}

                {profile.verificationStatus === 'PENDING' && (
                  <div style={{
                    background: '#FDFCF9', borderRadius: '20px', padding: '18px',
                    border: '1px solid rgba(255,184,0,0.3)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                        background: 'rgba(255,184,0,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                      }}>⏳</div>
                      <div>
                        <p style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '13px', marginBottom: '2px' }}>
                          Zahtjev na čekanju
                        </p>
                        <p style={{ color: '#7A7570', fontSize: '12px' }}>
                          Admin pregledava tvoj indeks
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {profile.verificationStatus === 'REJECTED' && (
                  <div style={{
                    background: '#FDFCF9', borderRadius: '20px', padding: '18px',
                    border: '1px solid rgba(255,59,48,0.2)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                        background: 'rgba(255,59,48,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                      }}>❌</div>
                      <div>
                        <p style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '13px', marginBottom: '2px' }}>
                          Zahtjev odbijen
                        </p>
                        {profile.verificationNote && (
                          <p style={{ color: '#FF3B30', fontSize: '12px' }}>
                            {profile.verificationNote}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => indexInputRef.current?.click()}
                      disabled={indexUploading}
                      style={{
                        width: '100%', padding: '9px', borderRadius: '10px', border: 'none',
                        background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                        color: 'white', fontWeight: '700', fontSize: '12px', cursor: 'pointer',
                      }}>
                      📤 Pokušaj ponovo
                    </button>
                    <input ref={indexInputRef} type="file" accept="image/*" onChange={handleIndexUpload} style={{ display: 'none' }} />
                  </div>
                )}

                {profile.verificationStatus === 'VERIFIED' && (
                  <div style={{
                    background: '#FDFCF9', borderRadius: '20px', padding: '18px',
                    border: '1px solid rgba(22,163,74,0.25)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                        background: 'linear-gradient(135deg, #16A34A, #4ADE80)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                      }}>🎓</div>
                      <div>
                        <p style={{ fontWeight: '800', color: '#16A34A', fontSize: '13px', marginBottom: '2px' }}>
                          Student verifikovan!
                        </p>
                        <p style={{ color: '#7A7570', fontSize: '12px' }}>
                          Tvoj student status je potvrđen
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success/Error poruka */}
                {verificationMsg && (
                  <div style={{
                    marginTop: '10px', padding: '12px 16px', borderRadius: '12px',
                    background: verificationMsg.includes('Greška') || verificationMsg.includes('odbijen') || verificationMsg.includes('čekanju')
                      ? 'rgba(255,59,48,0.08)' : 'rgba(22,163,74,0.1)',
                    color: verificationMsg.includes('Greška') || verificationMsg.includes('odbijen')
                      ? '#FF3B30' : '#16A34A',
                    fontSize: '13px', fontWeight: '600',
                    border: `1px solid ${verificationMsg.includes('Greška') ? 'rgba(255,59,48,0.2)' : 'rgba(22,163,74,0.2)'}`,
                  }}>
                    {verificationMsg}
                  </div>
                )}
              </div>
            )}

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
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ime</label>
                      <input style={inputStyle} value={formData.firstName}
                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                        onFocus={e => e.target.style.borderColor = '#FF6B35'}
                        onBlur={e => e.target.style.borderColor = '#E8E4DF'} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Prezime</label>
                      <input style={inputStyle} value={formData.lastName}
                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                        onFocus={e => e.target.style.borderColor = '#FF6B35'}
                        onBlur={e => e.target.style.borderColor = '#E8E4DF'} />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bio</label>
                    <textarea style={{ ...inputStyle, height: '90px', resize: 'none' }}
                      value={formData.bio}
                      onChange={e => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Napiši nešto o sebi..."
                      onFocus={e => e.target.style.borderColor = '#FF6B35'}
                      onBlur={e => e.target.style.borderColor = '#E8E4DF'} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Univerzitet</label>
                      <input style={inputStyle} value={formData.university}
                        onChange={e => setFormData({ ...formData, university: e.target.value })}
                        placeholder="Univerzitet u Sarajevu"
                        onFocus={e => e.target.style.borderColor = '#FF6B35'}
                        onBlur={e => e.target.style.borderColor = '#E8E4DF'} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fakultet</label>
                      <input style={inputStyle} value={formData.faculty}
                        onChange={e => setFormData({ ...formData, faculty: e.target.value })}
                        placeholder="ETF"
                        onFocus={e => e.target.style.borderColor = '#FF6B35'}
                        onBlur={e => e.target.style.borderColor = '#E8E4DF'} />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Godina studija</label>
                    <select style={{ ...inputStyle, cursor: 'pointer' }}
                      value={formData.yearOfStudy}
                      onChange={e => setFormData({ ...formData, yearOfStudy: e.target.value })}
                      onFocus={e => e.target.style.borderColor = '#FF6B35'}
                      onBlur={e => e.target.style.borderColor = '#E8E4DF'}>
                      <option value="">Odaberi</option>
                      {[1, 2, 3, 4, 5].map(y => (
                        <option key={y} value={y}>{YEAR_LABELS[y]}</option>
                      ))}
                    </select>
                  </div>

                  <button onClick={handleSave} disabled={saving} style={{
                    padding: '12px', borderRadius: '14px', border: 'none',
                    background: saving ? '#E5E5EA' : 'linear-gradient(135deg, #FF6B35, #FFB800)',
                    color: saving ? '#AEAEB2' : 'white',
                    fontWeight: '800', fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer',
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
                    {isOwnProfile ? 'Dodaj bio klikom na "Uredi profil"' : 'Korisnik nije dodao bio.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}