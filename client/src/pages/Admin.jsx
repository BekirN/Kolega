import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const TABS = [
  { id: 'dashboard', label: '📊 Dashboard' },
  { id: 'users', label: '👥 Korisnici' },
  { id: 'content', label: '🗂️ Sadržaj' },
  { id: 'verifications', label: '🎓 Verifikacije' },
  { id: 'notify', label: '📢 Obavještenja' },
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
  const [verifications, setVerifications] = useState([])
  const [rejectNote, setRejectNote] = useState({})
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [notifyMsg, setNotifyMsg] = useState('')
  const [notifyLink, setNotifyLink] = useState('')
  const [broadcastSubject, setBroadcastSubject] = useState('')
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [broadcastTarget, setBroadcastTarget] = useState('ALL')

  useEffect(() => {
    if (user.role !== 'ADMIN') { navigate('/dashboard'); return }
    fetchStats()
  }, [])

  useEffect(() => {
    if (activeTab === 'users') fetchUsers()
    else if (activeTab === 'content') fetchContent(contentType)
    else if (activeTab === 'verifications') fetchVerifications()
    else if (activeTab === 'dashboard') fetchStats()
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'content') fetchContent(contentType)
  }, [contentType])

  const showSuccess = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3500)
  }

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

  const fetchVerifications = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/verifications')
      console.log('Verifications:', data)
      setVerifications(data)
    } catch (err) {
      console.error('Verifications error:', err.response?.data || err)
    }
    finally { setLoading(false) }
  }

  const handleDeleteUser = async (id, name) => {
    if (!confirm(`Obrisati korisnika ${name}? Nepovratno!`)) return
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
      showSuccess('Korisnik email verifikovan!')
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

  const handleDeleteContent = async (id) => {
    if (!confirm('Obrisati ovaj sadržaj?')) return
    setActionLoading(id)
    try {
      const typeMap = { shop: 'shop', housing: 'housing', jobs: 'job', materials: 'material' }
      await api.delete(`/admin/content/${typeMap[contentType]}/${id}`)
      setContent(prev => prev.filter(c => c.id !== id))
      showSuccess('Sadržaj obrisan!')
    } catch (err) { alert(err.response?.data?.message) }
    finally { setActionLoading(null) }
  }

  const handleReview = async (id, action) => {
    setActionLoading(id)
    try {
      await api.put(`/admin/verifications/${id}`, {
        action,
        note: rejectNote[id] || '',
      })
      setVerifications(prev => prev.filter(v => v.id !== id))
      showSuccess(action === 'approve' ? '✓ Verifikacija odobrena!' : '✕ Verifikacija odbijena!')

      fetchStats()
    } catch (err) {
      console.error('Review error:', err.response?.data || err)
      alert(err.response?.data?.message || 'Greška')
    }
    finally { setActionLoading(null) }
  }

  const handleSendNotification = async () => {
    if (!notifyMsg) return
    setLoading(true)
    try {
      await api.post('/admin/notify', { message: notifyMsg, link: notifyLink })
      setNotifyMsg('')
      setNotifyLink('')
      showSuccess('Notifikacija poslana!')
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

  const inputStyle = {
    background: '#2C2C2E', border: '1px solid #3A3A3C', color: '#E5E5EA',
    borderRadius: '10px', padding: '10px 14px', fontSize: '14px',
    width: '100%', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  }

  const btn = (color = '#FF6B35', extra = {}) => ({
    padding: '7px 14px', borderRadius: '8px', border: 'none',
    background: color, color: 'white', fontSize: '12px',
    fontWeight: '700', cursor: 'pointer', ...extra,
  })

  return (
    <div style={{ minHeight: '100vh', background: '#1C1C1E', color: '#E5E5EA' }}>

      {/* Header */}
      <div style={{
        background: '#2C2C2E', borderBottom: '1px solid #3A3A3C',
        padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: '900', color: 'white',
          }}>K</div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '900', color: 'white', margin: 0 }}>KOLEGA Admin</h1>
            <p style={{ fontSize: '12px', color: '#636366', margin: 0 }}>Upravljačka ploča</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {successMsg && (
            <div style={{
              padding: '8px 16px', borderRadius: '10px',
              background: 'rgba(22,163,74,0.2)', color: '#4ADE80',
              fontSize: '13px', fontWeight: '600',
            }}>
              ✓ {successMsg}
            </div>
          )}
          <button onClick={() => navigate('/dashboard')} style={btn('#3A3A3C')}>
            ← Platforma
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 69px)' }}>

        {/* Sidebar */}
        <div style={{
          width: '200px', background: '#2C2C2E',
          borderRight: '1px solid #3A3A3C', padding: '20px 12px', flexShrink: 0,
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
              {tab.id === 'verifications' && verifications.length > 0 && (
                <span style={{
                  marginLeft: '8px', background: '#FF6B35', color: 'white',
                  fontSize: '10px', fontWeight: '800', padding: '2px 6px',
                  borderRadius: '100px',
                }}>
                  {verifications.length}
                </span>
              )}
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
                {[
                  { label: 'Ukupno korisnika', value: stats.users.total, icon: '👥', color: '#FF6B35' },
                  { label: 'Email verifikovani', value: stats.users.verified, icon: '✅', color: '#16A34A' },
                  { label: 'Neverifikovani', value: stats.users.unverified, icon: '⏳', color: '#FFB800' },
                ].map((s, i) => (
                  <div key={i} style={{ background: '#2C2C2E', borderRadius: '16px', padding: '20px', border: '1px solid #3A3A3C' }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>{s.icon}</div>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '13px', color: '#636366', marginTop: '4px' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#636366', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Sadržaj
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px' }}>
                {[
                  { label: 'Shop', value: stats.content.shopItems, icon: '🛍️' },
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

              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#636366', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Novi korisnici
              </h3>
              <div style={{ background: '#2C2C2E', borderRadius: '16px', border: '1px solid #3A3A3C', overflow: 'hidden' }}>
                {stats.recentUsers.map((u, i) => (
                  <div key={u.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px',
                    borderBottom: i < stats.recentUsers.length - 1 ? '1px solid #3A3A3C' : 'none',
                  }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
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
                      }}>{u.role}</span>
                      <span style={{
                        fontSize: '11px', padding: '3px 8px', borderRadius: '100px',
                        background: u.emailVerified ? 'rgba(22,163,74,0.15)' : 'rgba(255,184,0,0.15)',
                        color: u.emailVerified ? '#4ADE80' : '#FFB800',
                      }}>
                        {u.emailVerified ? '✓ Email OK' : '⏳ Email čeka'}
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
                  onChange={e => { setUserSearch(e.target.value); fetchUsers(e.target.value) }}
                  placeholder="🔍 Pretraži..."
                  style={{ ...inputStyle, width: '260px' }}
                />
              </div>

              <div style={{ background: '#2C2C2E', borderRadius: '16px', border: '1px solid #3A3A3C', overflow: 'hidden' }}>
                {loading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#636366' }}>Učitavanje...</div>
                ) : users.map((u, i) => (
                  <div key={u.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px',
                    borderBottom: i < users.length - 1 ? '1px solid #3A3A3C' : 'none',
                    opacity: actionLoading === u.id ? 0.5 : 1,
                  }}>
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

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <p style={{ fontWeight: '700', color: 'white', fontSize: '14px', margin: 0 }}>
                          {u.firstName} {u.lastName}
                        </p>
                        <span style={{
                          fontSize: '10px', padding: '2px 6px', borderRadius: '100px',
                          background: u.role === 'ADMIN' ? 'rgba(255,107,53,0.2)' : 'rgba(255,255,255,0.06)',
                          color: u.role === 'ADMIN' ? '#FF6B35' : '#636366',
                        }}>{u.role}</span>
                        {u.verificationStatus === 'VERIFIED' && (
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '100px', background: 'rgba(22,163,74,0.15)', color: '#4ADE80' }}>
                            🎓 Verificiran
                          </span>
                        )}
                        {u.verificationStatus === 'PENDING' && (
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '100px', background: 'rgba(255,184,0,0.15)', color: '#FFB800' }}>
                            ⏳ Indeks čeka
                          </span>
                        )}
                        {!u.emailVerified && (
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '100px', background: 'rgba(255,59,48,0.1)', color: '#FF3B30' }}>
                            ✉️ Email neverifikovan
                          </span>
                        )}
                      </div>
                      <p style={{ color: '#636366', fontSize: '12px', margin: '2px 0 0 0' }}>
                        {u.email}{u.faculty ? ` · ${u.faculty}` : ''}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      {!u.emailVerified && (
                        <button onClick={() => handleVerifyUser(u.id)} style={btn('#16A34A')}>
                          ✉️ Verificiraj email
                        </button>
                      )}
                      <button
                        onClick={() => handleRoleChange(u.id, u.role === 'ADMIN' ? 'STUDENT' : 'ADMIN')}
                        style={btn(u.role === 'ADMIN' ? '#636366' : '#7C3AED')}
                      >
                        {u.role === 'ADMIN' ? '↓ Student' : '↑ Admin'}
                      </button>
                      <button onClick={() => navigate(`/profile/${u.id}`)} style={btn('#3A3A3C')}>
                        👁️
                      </button>
                      {u.id !== user.id && (
                        <button onClick={() => handleDeleteUser(u.id, `${u.firstName} ${u.lastName}`)} style={btn('#FF3B30')}>
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
                  const title = item.title || item.description?.slice(0, 80) || 'Bez naziva'
                  return (
                    <div key={item.id} style={{
                      display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px',
                      borderBottom: i < content.length - 1 ? '1px solid #3A3A3C' : 'none',
                      opacity: actionLoading === item.id ? 0.5 : 1,
                    }}>
                      {item.images?.[0] && (
                        <img src={item.images[0]} alt="" style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: '700', color: 'white', fontSize: '14px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {title}
                        </p>
                        <p style={{ color: '#636366', fontSize: '12px', margin: '2px 0 0 0' }}>
                          {owner ? `${owner.firstName} ${owner.lastName}` : ''}
                          {' · '}{new Date(item.createdAt).toLocaleDateString('bs-BA')}
                          {item.price ? ` · ${item.price} KM` : ''}
                        </p>
                      </div>
                      <button onClick={() => handleDeleteContent(item.id)} disabled={actionLoading === item.id} style={btn('#FF3B30')}>
                        🗑️ Obriši
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ─── VERIFIKACIJE ─── */}
          {activeTab === 'verifications' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '900', color: 'white', margin: 0 }}>
                  🎓 Zahtjevi za verifikaciju
                  {verifications.length > 0 && (
                    <span style={{
                      marginLeft: '12px', background: '#FF6B35', color: 'white',
                      fontSize: '14px', padding: '3px 10px', borderRadius: '100px',
                    }}>
                      {verifications.length}
                    </span>
                  )}
                </h2>
                <button onClick={fetchVerifications} style={btn('#3A3A3C')}>
                  🔄 Osvježi
                </button>
              </div>

              {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#636366' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #FF6B35', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                  Učitavanje...
                </div>
              ) : verifications.length === 0 ? (
                <div style={{
                  background: '#2C2C2E', borderRadius: '18px', padding: '64px',
                  textAlign: 'center', border: '1px solid #3A3A3C',
                }}>
                  <p style={{ fontSize: '48px', marginBottom: '16px' }}>🎓</p>
                  <p style={{ color: 'white', fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>
                    Nema zahtjeva
                  </p>
                  <p style={{ color: '#636366', fontSize: '14px' }}>
                    Ovdje će se pojaviti zahtjevi kada studenti uploadaju sliku indeksa
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {verifications.map(v => (
                    <div key={v.id} style={{
                      background: '#2C2C2E', borderRadius: '20px', padding: '24px',
                      border: '1px solid #3A3A3C',
                      opacity: actionLoading === v.id ? 0.6 : 1,
                      transition: 'opacity 0.2s',
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 220px', gap: '24px', alignItems: 'start' }}>

                        {/* Korisnik info */}
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: '700', color: '#636366', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                            Korisnik
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', overflow: 'hidden', flexShrink: 0 }}>
                              {v.profileImage ? (
                                <img src={v.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{
                                  width: '100%', height: '100%',
                                  background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: 'white', fontWeight: '800', fontSize: '16px',
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
                                <p style={{ color: '#FF6B35', fontSize: '12px', margin: 0, fontWeight: '600' }}>{v.faculty}</p>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {v.university && (
                              <p style={{ color: '#8E8E93', fontSize: '12px', margin: 0 }}>🎓 {v.university}</p>
                            )}
                            <p style={{ color: '#48484A', fontSize: '12px', margin: 0 }}>
                              📅 Zahtjev: {new Date(v.createdAt).toLocaleDateString('bs-BA')}
                            </p>
                          </div>
                          <button
                            onClick={() => navigate(`/profile/${v.id}`)}
                            style={{ ...btn('#3A3A3C'), marginTop: '12px', fontSize: '12px' }}
                          >
                            👁️ Pogledaj profil
                          </button>
                        </div>

                        {/* Slika indeksa */}
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: '700', color: '#636366', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                            Slika indeksa
                          </p>
                          {v.indexImage ? (
                            <div>
                              <a href={v.indexImage} target="_blank" rel="noreferrer" style={{ display: 'block' }}>
                                <img
                                  src={v.indexImage}
                                  alt="Indeks"
                                  style={{
                                    width: '100%', maxHeight: '260px', objectFit: 'contain',
                                    borderRadius: '14px', border: '1px solid #3A3A3C',
                                    background: '#1C1C1E', cursor: 'zoom-in',
                                    transition: 'transform 0.2s',
                                  }}
                                  onMouseEnter={e => e.target.style.transform = 'scale(1.02)'}
                                  onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                                />
                              </a>
                              <p style={{ color: '#48484A', fontSize: '11px', marginTop: '8px', textAlign: 'center' }}>
                                🔍 Klikni za pun prikaz
                              </p>
                            </div>
                          ) : (
                            <div style={{
                              height: '120px', borderRadius: '14px', border: '2px dashed #3A3A3C',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#636366', fontSize: '13px',
                            }}>
                              Nema uploadovane slike
                            </div>
                          )}
                        </div>

                        {/* Akcije */}
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: '700', color: '#636366', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                            Odluka
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button
                              onClick={() => handleReview(v.id, 'approve')}
                              disabled={actionLoading === v.id}
                              style={{
                                padding: '13px', borderRadius: '12px', border: 'none',
                                background: actionLoading === v.id
                                  ? '#3A3A3C'
                                  : 'linear-gradient(135deg, #16A34A, #4ADE80)',
                                color: 'white', fontSize: '14px', fontWeight: '800',
                                cursor: actionLoading === v.id ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                              }}>
                              {actionLoading === v.id ? (
                                <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid white', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                              ) : '✓'} Odobri verifikaciju
                            </button>

                            <div style={{ background: '#1C1C1E', borderRadius: '12px', padding: '12px' }}>
                              <input
                                value={rejectNote[v.id] || ''}
                                onChange={e => setRejectNote(prev => ({ ...prev, [v.id]: e.target.value }))}
                                placeholder="Razlog odbijanja (opciono)..."
                                style={{
                                  ...inputStyle,
                                  fontSize: '12px', padding: '8px 12px',
                                  background: '#2C2C2E', marginBottom: '8px',
                                }}
                              />
                              <button
                                onClick={() => handleReview(v.id, 'reject')}
                                disabled={actionLoading === v.id}
                                style={{
                                  width: '100%', padding: '10px', borderRadius: '10px', border: 'none',
                                  background: 'rgba(255,59,48,0.15)', color: '#FF3B30',
                                  fontSize: '13px', fontWeight: '700',
                                  cursor: actionLoading === v.id ? 'not-allowed' : 'pointer',
                                  transition: 'background 0.2s',
                                }}
                                onMouseEnter={e => { if (actionLoading !== v.id) e.currentTarget.style.background = 'rgba(255,59,48,0.25)' }}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,59,48,0.15)'}
                              >
                                ✕ Odbij zahtjev
                              </button>
                            </div>
                          </div>
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
                      style={{ ...btn('#FF6B35'), padding: '12px', fontSize: '14px', opacity: !notifyMsg || loading ? 0.5 : 1 }}
                    >
                      {loading ? 'Slanje...' : '🔔 Pošalji notifikaciju'}
                    </button>
                  </div>
                </div>

                <div style={{ background: '#2C2C2E', borderRadius: '18px', padding: '24px', border: '1px solid #3A3A3C' }}>
                  <h3 style={{ color: 'white', fontWeight: '800', marginBottom: '6px', fontSize: '16px' }}>
                    📧 Broadcast email
                  </h3>
                  <p style={{ color: '#636366', fontSize: '13px', marginBottom: '18px' }}>
                    Pošalji email korisnicima
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <select value={broadcastTarget} onChange={e => setBroadcastTarget(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
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
                      style={{ ...btn('#7C3AED'), padding: '12px', fontSize: '14px', opacity: !broadcastSubject || !broadcastMsg || loading ? 0.5 : 1 }}
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}