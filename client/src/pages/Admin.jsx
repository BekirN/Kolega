import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const TABS = [
  { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
  { id: 'users', label: '👥 Korisnici', icon: '👥' },
  { id: 'content', label: '🗂️ Sadržaj', icon: '🗂️' },
  { id: 'notify', label: '📢 Obavještenja', icon: '📢' },
  { id: 'verifications', label: '🎓 Verifikacije', icon: '🎓' },
]

const CONTENT_TABS = [
  { id: 'shop', label: '🛍️ Shop' },
  { id: 'housing', label: '🏠 Stanovi' },
  { id: 'jobs', label: '💼 Poslovi' },
  { id: 'materials', label: '📄 Materijali' },
  
]

export default function Admin() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [content, setContent] = useState([])
  const [contentType, setContentType] = useState('shop')
  const [loading, setLoading] = useState(false)
  const [notifyMsg, setNotifyMsg] = useState('')
  const [notifyLink, setNotifyLink] = useState('')
  const [broadcastSubject, setBroadcastSubject] = useState('')
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [broadcastTarget, setBroadcastTarget] = useState('ALL')
  const [actionLoading, setActionLoading] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')

  const [verifications, setVerifications] = useState([])
  const [rejectNote, setRejectNote] = useState({})
  useEffect(() => {
    if (user.role !== 'ADMIN') {
      navigate('/dashboard')
      return
    }
    fetchStats()
  }, [])

  useEffect(() => {
    if (activeTab === 'users') fetchUsers()
    if (activeTab === 'content') fetchContent(contentType)
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'content') fetchContent(contentType)
  }, [contentType])

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/stats')
      setStats(data)
    } catch (err) { console.error(err) }
  }

  const fetchUsers = async (search = '') => {
    setLoading(true)
    try {
      const { data } = await api.get(`/admin/users?search=${search}&limit=50`)
      setUsers(data.users)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const fetchContent = async (type) => {
    setLoading(true)
    try {
      const { data } = await api.get(`/admin/content/${type}`)
      setContent(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleDeleteUser = async (id, name) => {
    if (!confirm(`Obrisati korisnika ${name}? Ova akcija je nepovratna!`)) return
    setActionLoading(id)
    try {
      await api.delete(`/admin/users/${id}`)
      setUsers(prev => prev.filter(u => u.id !== id))
      showSuccess('Korisnik obrisan!')
    } catch (err) { alert(err.response?.data?.message) }
    finally { setActionLoading(null) }
  }

  const handleVerifyUser = async (id) => {
    setActionLoading(id)
    try {
      await api.put(`/admin/users/${id}/verify`)
      setUsers(prev => prev.map(u => u.id === id ? { ...u, emailVerified: true } : u))
      showSuccess('Korisnik verifikovan!')
    } catch (err) { alert(err.response?.data?.message) }
    finally { setActionLoading(null) }
  }

  const handleRoleChange = async (id, role) => {
    setActionLoading(id)
    try {
      await api.put(`/admin/users/${id}/role`, { role })
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
      showSuccess(`Rola promijenjena u ${role}!`)
    } catch (err) { alert(err.response?.data?.message) }
    finally { setActionLoading(null) }
  }

  const handleDeleteContent = async (type, id) => {
    if (!confirm('Obrisati ovaj sadržaj?')) return
    setActionLoading(id)
    try {
      const typeMap = { shop: 'shop', housing: 'housing', jobs: 'job', posts: 'post', materials: 'material' }
      await api.delete(`/admin/content/${typeMap[contentType]}/${id}`)
      setContent(prev => prev.filter(c => c.id !== id))
      showSuccess('Sadržaj obrisan!')
    } catch (err) { alert(err.response?.data?.message) }
    finally { setActionLoading(null) }
  }

  const handleSendNotification = async () => {
    if (!notifyMsg) return
    setLoading(true)
    try {
      await api.post('/admin/notify', { message: notifyMsg, link: notifyLink })
      setNotifyMsg('')
      setNotifyLink('')
      showSuccess('Notifikacija poslana svim korisnicima!')
    } catch (err) { alert(err.response?.data?.message) }
    finally { setLoading(false) }
  }

  const handleSendBroadcast = async () => {
    if (!broadcastSubject || !broadcastMsg) return
    setLoading(true)
    try {
      const { data } = await api.post('/admin/broadcast', {
        subject: broadcastSubject,
        message: broadcastMsg,
        targetRole: broadcastTarget,
      })
      setBroadcastSubject('')
      setBroadcastMsg('')
      showSuccess(data.message)
    } catch (err) { alert(err.response?.data?.message) }
    finally { setLoading(false) }
  }

  const showSuccess = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const inputStyle = {
    background: '#2C2C2E', border: '1px solid #3A3A3C', color: '#E5E5EA',
    borderRadius: '10px', padding: '10px 14px', fontSize: '14px',
    width: '100%', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  }

  const btnStyle = (color = '#FF6B35') => ({
    padding: '7px 14px', borderRadius: '8px', border: 'none',
    background: color, color: 'white', fontSize: '12px',
    fontWeight: '700', cursor: 'pointer', transition: 'opacity 0.2s',
  })
  
  const fetchVerifications = async () => {
    setLoading(true)
    try {
        const { data } = await api.get('/admin/verifications')
        setVerifications(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
    }

    useEffect(() => {
    if (activeTab === 'verifications') fetchVerifications()
    }, [activeTab])

    const handleReview = async (id, action) => {
        setActionLoading(id)
        try {
            await api.put(`/admin/verifications/${id}`, {
            action,
            note: rejectNote[id] || '',
            })
            setVerifications(prev => prev.filter(v => v.id !== id))
            showSuccess(action === 'approve' ? 'Verifikacija odobrena!' : 'Verifikacija odbijena!')
        } catch (err) { alert(err.response?.data?.message) }
        finally { setActionLoading(null) }
        }
    
  return (
    <div style={{ minHeight: '100vh', background: '#1C1C1E', color: '#E5E5EA' }}>

      {/* Header */}
      <div style={{
        background: '#2C2C2E', borderBottom: '1px solid #3A3A3C',
        padding: '16px 32px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: '900', color: 'white',
          }}>K</div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '900', color: 'white', margin: 0 }}>
              KOLEGA Admin
            </h1>
            <p style={{ fontSize: '12px', color: '#636366', margin: 0 }}>
              Upravljačka ploča
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {successMsg && (
            <div style={{
              padding: '8px 16px', borderRadius: '10px',
              background: 'rgba(22,163,74,0.2)', color: '#4ADE80',
              fontSize: '13px', fontWeight: '600',
              animation: 'fadeSlideUp 0.3s ease',
            }}>
              ✓ {successMsg}
            </div>
          )}
          <button onClick={() => navigate('/dashboard')} style={{
            ...btnStyle('#3A3A3C'), display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            ← Platforma
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 69px)' }}>

        {/* Sidebar */}
        <div style={{
          width: '200px', background: '#2C2C2E',
          borderRight: '1px solid #3A3A3C', padding: '20px 12px',
          flexShrink: 0,
        }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              width: '100%', padding: '10px 14px', borderRadius: '10px',
              border: 'none', textAlign: 'left', cursor: 'pointer',
              marginBottom: '4px', fontSize: '14px', fontWeight: '600',
              background: activeTab === tab.id ? 'rgba(255,107,53,0.15)' : 'transparent',
              color: activeTab === tab.id ? '#FF6B35' : '#8E8E93',
              transition: 'all 0.15s',
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>

          {/* ─── DASHBOARD ─── */}
          {activeTab === 'dashboard' && stats && (
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '900', marginBottom: '24px', color: 'white' }}>
                📊 Statistike platforme
              </h2>

              {/* Users stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
                {[
                  { label: 'Ukupno korisnika', value: stats.users.total, icon: '👥', color: '#FF6B35' },
                  { label: 'Verifikovani', value: stats.users.verified, icon: '✅', color: '#16A34A' },
                  { label: 'Neverifikovani', value: stats.users.unverified, icon: '⏳', color: '#FFB800' },
                ].map((s, i) => (
                  <div key={i} style={{
                    background: '#2C2C2E', borderRadius: '16px', padding: '20px',
                    border: '1px solid #3A3A3C',
                  }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>{s.icon}</div>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '13px', color: '#636366', marginTop: '4px' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Content stats */}
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#8E8E93', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Sadržaj
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px' }}>
                {[
                  { label: 'Shop oglasi', value: stats.content.shopItems, icon: '🛍️' },
                  { label: 'Stanovi', value: stats.content.housingListings, icon: '🏠' },
                  { label: 'Poslovi', value: stats.content.jobs, icon: '💼' },
                  { label: 'Prakse', value: stats.content.internships, icon: '🏢' },
                  { label: 'Materijali', value: stats.content.materials, icon: '📄' },
                  { label: 'Rezervacije', value: stats.content.bookings, icon: '📅' },
                ].map((s, i) => (
                  <div key={i} style={{
                    background: '#2C2C2E', borderRadius: '14px', padding: '16px',
                    border: '1px solid #3A3A3C', display: 'flex', alignItems: 'center', gap: '12px',
                  }}>
                    <span style={{ fontSize: '22px' }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize: '22px', fontWeight: '900', color: 'white' }}>{s.value}</div>
                      <div style={{ fontSize: '11px', color: '#636366' }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Nedavni korisnici */}
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#8E8E93', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Novi korisnici
              </h3>
              <div style={{ background: '#2C2C2E', borderRadius: '16px', border: '1px solid #3A3A3C', overflow: 'hidden' }}>
                {stats.recentUsers.map((u, i) => (
                  <div key={u.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '14px 20px',
                    borderBottom: i < stats.recentUsers.length - 1 ? '1px solid #3A3A3C' : 'none',
                  }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                    }}>
                      {u.profileImage ? (
                        <img src={u.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{
                          width: '100%', height: '100%',
                          background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: '700', fontSize: '13px',
                        }}>
                          {u.firstName?.[0]}{u.lastName?.[0]}
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: '700', color: 'white', fontSize: '14px', margin: 0 }}>
                        {u.firstName} {u.lastName}
                      </p>
                      <p style={{ color: '#636366', fontSize: '12px', margin: 0 }}>{u.email}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '11px', padding: '3px 8px', borderRadius: '100px',
                        background: u.role === 'ADMIN' ? 'rgba(255,107,53,0.2)' : 'rgba(255,255,255,0.08)',
                        color: u.role === 'ADMIN' ? '#FF6B35' : '#8E8E93',
                      }}>
                        {u.role}
                      </span>
                      <span style={{
                        fontSize: '11px', padding: '3px 8px', borderRadius: '100px',
                        background: u.emailVerified ? 'rgba(22,163,74,0.15)' : 'rgba(255,184,0,0.15)',
                        color: u.emailVerified ? '#4ADE80' : '#FFB800',
                      }}>
                        {u.emailVerified ? '✓ Verifikovan' : '⏳ Na čekanju'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#636366' }}>
                        {new Date(u.createdAt).toLocaleDateString('bs-BA')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── KORISNICI ─── */}
          {activeTab === 'users' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '900', color: 'white', margin: 0 }}>
                  👥 Korisnici ({users.length})
                </h2>
                <input
                  value={userSearch}
                  onChange={e => {
                    setUserSearch(e.target.value)
                    fetchUsers(e.target.value)
                  }}
                  placeholder="🔍 Pretraži korisnike..."
                  style={{ ...inputStyle, width: '260px' }}
                />
              </div>

              <div style={{ background: '#2C2C2E', borderRadius: '16px', border: '1px solid #3A3A3C', overflow: 'hidden' }}>
                {loading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#636366' }}>Učitavanje...</div>
                ) : users.map((u, i) => (
                  <div key={u.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '14px 20px',
                    borderBottom: i < users.length - 1 ? '1px solid #3A3A3C' : 'none',
                    opacity: actionLoading === u.id ? 0.5 : 1,
                  }}>
                    {/* Avatar */}
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                      {u.profileImage ? (
                        <img src={u.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{
                          width: '100%', height: '100%',
                          background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: '700', fontSize: '14px',
                        }}>
                          {u.firstName?.[0]}{u.lastName?.[0]}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <p style={{ fontWeight: '700', color: 'white', fontSize: '14px', margin: 0 }}>
                          {u.firstName} {u.lastName}
                        </p>
                        <span style={{
                          fontSize: '10px', padding: '2px 6px', borderRadius: '100px',
                          background: u.role === 'ADMIN' ? 'rgba(255,107,53,0.2)' : 'rgba(255,255,255,0.06)',
                          color: u.role === 'ADMIN' ? '#FF6B35' : '#636366',
                        }}>
                          {u.role}
                        </span>
                        {!u.emailVerified && (
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '100px', background: 'rgba(255,184,0,0.15)', color: '#FFB800' }}>
                            ⏳ Neverifikovan
                          </span>
                        )}
                      </div>
                      <p style={{ color: '#636366', fontSize: '12px', margin: '2px 0 0 0' }}>
                        {u.email} {u.faculty ? `· ${u.faculty}` : ''}
                      </p>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: '12px', marginRight: '12px' }}>
                      {[
                        { label: 'Shop', val: u._count?.shopItems },
                        { label: 'Materijali', val: u._count?.uploadedMaterials },
                      ].map(s => (
                        <div key={s.label} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '14px', fontWeight: '800', color: '#FF6B35' }}>{s.val}</div>
                          <div style={{ fontSize: '10px', color: '#48484A' }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Akcije */}
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      {!u.emailVerified && (
                        <button onClick={() => handleVerifyUser(u.id)} style={btnStyle('#16A34A')}>
                          ✓ Verificiraj
                        </button>
                      )}
                      <button
                        onClick={() => handleRoleChange(u.id, u.role === 'ADMIN' ? 'STUDENT' : 'ADMIN')}
                        style={btnStyle(u.role === 'ADMIN' ? '#636366' : '#7C3AED')}
                      >
                        {u.role === 'ADMIN' ? '↓ Student' : '↑ Admin'}
                      </button>
                      <button
                        onClick={() => navigate(`/profile/${u.id}`)}
                        style={btnStyle('#3A3A3C')}
                      >
                        👁️
                      </button>
                      {u.id !== user.id && (
                        <button onClick={() => handleDeleteUser(u.id, `${u.firstName} ${u.lastName}`)} style={btnStyle('#FF3B30')}>
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── SADRŽAJ ─── */}
          {activeTab === 'content' && (
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '900', color: 'white', marginBottom: '20px' }}>
                🗂️ Moderacija sadržaja
              </h2>

              {/* Content type tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {CONTENT_TABS.map(tab => (
                  <button key={tab.id} onClick={() => setContentType(tab.id)} style={{
                    padding: '8px 16px', borderRadius: '10px', border: 'none',
                    background: contentType === tab.id ? '#FF6B35' : '#2C2C2E',
                    color: contentType === tab.id ? 'white' : '#8E8E93',
                    fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                  }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div style={{ background: '#2C2C2E', borderRadius: '16px', border: '1px solid #3A3A3C', overflow: 'hidden' }}>
                {loading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#636366' }}>Učitavanje...</div>
                ) : content.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#636366' }}>Nema sadržaja</div>
                ) : content.map((item, i) => {
                  const owner = item.seller || item.owner || item.user || item.author || item.uploader
                  const title = item.title || item.description?.slice(0, 60) || item.subject || 'Bez naziva'
                  return (
                    <div key={item.id} style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '14px 20px',
                      borderBottom: i < content.length - 1 ? '1px solid #3A3A3C' : 'none',
                      opacity: actionLoading === item.id ? 0.5 : 1,
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: '700', color: 'white', fontSize: '14px', margin: 0,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {title}
                        </p>
                        <p style={{ color: '#636366', fontSize: '12px', margin: '2px 0 0 0' }}>
                          {owner ? `${owner.firstName} ${owner.lastName} · ${owner.email}` : ''}
                          {' · '}
                          {new Date(item.createdAt).toLocaleDateString('bs-BA')}
                          {item.price ? ` · ${item.price} KM` : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteContent(contentType, item.id)}
                        disabled={actionLoading === item.id}
                        style={btnStyle('#FF3B30')}
                      >
                        🗑️ Obriši
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {activeTab === 'verifications' && (
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '900', color: 'white', margin: 0 }}>
                    🎓 Zahtjevi za verifikaciju ({verifications.length})
                </h2>
                </div>

                {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#636366' }}>Učitavanje...</div>
                ) : verifications.length === 0 ? (
                <div style={{
                    background: '#2C2C2E', borderRadius: '18px', padding: '60px',
                    textAlign: 'center', border: '1px solid #3A3A3C',
                }}>
                    <p style={{ fontSize: '48px', marginBottom: '12px' }}>🎓</p>
                    <p style={{ color: '#636366', fontSize: '16px' }}>Nema zahtjeva za verifikaciju</p>
                </div>
                ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {verifications.map(v => (
                    <div key={v.id} style={{
                        background: '#2C2C2E', borderRadius: '18px', padding: '24px',
                        border: '1px solid #3A3A3C',
                        opacity: actionLoading === v.id ? 0.6 : 1,
                    }}>
                        <div style={{ display: 'flex', gap: '20px' }}>

                        {/* Korisnik info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                            {v.profileImage ? (
                                <img src={v.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{
                                width: '100%', height: '100%',
                                background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontWeight: '700', fontSize: '16px',
                                }}>
                                {v.firstName?.[0]}{v.lastName?.[0]}
                                </div>
                            )}
                            </div>
                            <div>
                            <p style={{ fontWeight: '800', color: 'white', fontSize: '15px', margin: 0 }}>
                                {v.firstName} {v.lastName}
                            </p>
                            <p style={{ color: '#636366', fontSize: '12px', margin: '2px 0' }}>{v.email}</p>
                            {v.faculty && (
                                <p style={{ color: '#FF6B35', fontSize: '12px', margin: 0 }}>{v.faculty}</p>
                            )}
                            <p style={{ color: '#48484A', fontSize: '11px', margin: '4px 0 0 0' }}>
                                {new Date(v.createdAt).toLocaleDateString('bs-BA')}
                            </p>
                            </div>
                        </div>

                        {/* Slika indeksa */}
                        <div style={{ flex: 1 }}>
                            {v.indexImage ? (
                            <div>
                                <p style={{ color: '#8E8E93', fontSize: '12px', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Slika indeksa
                                </p>
                                <a href={v.indexImage} target="_blank" rel="noreferrer">
                                <img
                                    src={v.indexImage}
                                    alt="Indeks"
                                    style={{
                                    width: '100%', maxHeight: '200px', objectFit: 'cover',
                                    borderRadius: '12px', cursor: 'pointer',
                                    border: '1px solid #3A3A3C',
                                    transition: 'opacity 0.2s',
                                    }}
                                    onMouseEnter={e => e.target.style.opacity = '0.8'}
                                    onMouseLeave={e => e.target.style.opacity = '1'}
                                />
                                </a>
                                <p style={{ color: '#48484A', fontSize: '11px', marginTop: '6px' }}>
                                Klikni na sliku za pun prikaz
                                </p>
                            </div>
                            ) : (
                            <div style={{ color: '#636366', fontSize: '13px' }}>Nema slike</div>
                            )}
                        </div>

                        {/* Akcije */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '200px' }}>
                            <button
                            onClick={() => handleReview(v.id, 'approve')}
                            disabled={actionLoading === v.id}
                            style={{
                                padding: '12px', borderRadius: '12px', border: 'none',
                                background: 'linear-gradient(135deg, #16A34A, #4ADE80)',
                                color: 'white', fontSize: '14px', fontWeight: '800',
                                cursor: 'pointer', transition: 'opacity 0.2s',
                            }}>
                            ✓ Odobri verifikaciju
                            </button>

                            <div>
                            <input
                                value={rejectNote[v.id] || ''}
                                onChange={e => setRejectNote(prev => ({ ...prev, [v.id]: e.target.value }))}
                                placeholder="Razlog odbijanja (opciono)..."
                                style={{ ...inputStyle, marginBottom: '8px', fontSize: '12px', padding: '8px 12px' }}
                            />
                            <button
                                onClick={() => handleReview(v.id, 'reject')}
                                disabled={actionLoading === v.id}
                                style={{
                                width: '100%', padding: '10px', borderRadius: '12px', border: 'none',
                                background: 'rgba(255,59,48,0.15)', color: '#FF3B30',
                                fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                                }}>
                                ✕ Odbij zahtjev
                            </button>
                            </div>

                            <button
                            onClick={() => navigate(`/profile/${v.id}`)}
                            style={{
                                padding: '8px', borderRadius: '10px', border: 'none',
                                background: '#3A3A3C', color: '#8E8E93',
                                fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                            }}>
                            👁️ Pogledaj profil
                            </button>
                        </div>
                        </div>
                    </div>
                    ))}
                </div>
                )}
            </div>
            )}

          {/* ─── OBAVJEŠTENJA ─── */}
          {activeTab === 'notify' && (
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '900', color: 'white', marginBottom: '24px' }}>
                📢 Obavještenja i emailovi
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                {/* Sistemska notifikacija */}
                <div style={{ background: '#2C2C2E', borderRadius: '18px', padding: '24px', border: '1px solid #3A3A3C' }}>
                  <h3 style={{ color: 'white', fontWeight: '800', marginBottom: '6px', fontSize: '16px' }}>
                    🔔 Sistemska notifikacija
                  </h3>
                  <p style={{ color: '#636366', fontSize: '13px', marginBottom: '18px' }}>
                    Pojavljuje se u Activity panelu svih korisnika
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <textarea
                      value={notifyMsg}
                      onChange={e => setNotifyMsg(e.target.value)}
                      placeholder="Poruka notifikacije..."
                      rows={4}
                      style={{ ...inputStyle, resize: 'none' }}
                    />
                    <input
                      value={notifyLink}
                      onChange={e => setNotifyLink(e.target.value)}
                      placeholder="Link (npr. /jobs) – opciono"
                      style={inputStyle}
                    />
                    <button
                      onClick={handleSendNotification}
                      disabled={!notifyMsg || loading}
                      style={{
                        ...btnStyle('#FF6B35'),
                        padding: '12px',
                        fontSize: '14px',
                        opacity: !notifyMsg || loading ? 0.5 : 1,
                      }}
                    >
                      {loading ? 'Slanje...' : '🔔 Pošalji notifikaciju'}
                    </button>
                  </div>
                </div>

                {/* Broadcast email */}
                <div style={{ background: '#2C2C2E', borderRadius: '18px', padding: '24px', border: '1px solid #3A3A3C' }}>
                  <h3 style={{ color: 'white', fontWeight: '800', marginBottom: '6px', fontSize: '16px' }}>
                    📧 Broadcast email
                  </h3>
                  <p style={{ color: '#636366', fontSize: '13px', marginBottom: '18px' }}>
                    Pošalji email svim korisnicima
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <select
                      value={broadcastTarget}
                      onChange={e => setBroadcastTarget(e.target.value)}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value="ALL">Svi korisnici</option>
                      <option value="STUDENT">Samo studenti</option>
                      <option value="ADMIN">Samo admini</option>
                    </select>
                    <input
                      value={broadcastSubject}
                      onChange={e => setBroadcastSubject(e.target.value)}
                      placeholder="Subject emaila..."
                      style={inputStyle}
                    />
                    <textarea
                      value={broadcastMsg}
                      onChange={e => setBroadcastMsg(e.target.value)}
                      placeholder="Tekst emaila..."
                      rows={4}
                      style={{ ...inputStyle, resize: 'none' }}
                    />
                    <button
                      onClick={handleSendBroadcast}
                      disabled={!broadcastSubject || !broadcastMsg || loading}
                      style={{
                        ...btnStyle('#7C3AED'),
                        padding: '12px',
                        fontSize: '14px',
                        opacity: !broadcastSubject || !broadcastMsg || loading ? 0.5 : 1,
                      }}
                    >
                      {loading ? 'Slanje...' : '📧 Pošalji email'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}