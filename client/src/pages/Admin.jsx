import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const TABS = [
  { id: 'dashboard', label: '📊 Dashboard' },
  { id: 'users', label: '👥 Korisnici' },
  { id: 'companies', label: '🏢 Firme & Role' },
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

const ROLE_CONFIG = {
  STUDENT: { label: 'Student', color: '#8E8E93', bg: 'rgba(142,142,147,0.15)' },
  ADMIN: { label: 'Admin', color: '#FF6B35', bg: 'rgba(255,107,53,0.2)' },
}

const COMPANY_ROLE_CONFIG = {
  OWNER: { label: 'Owner', color: '#FFB800', bg: 'rgba(255,184,0,0.15)' },
  HR: { label: 'HR', color: '#7C3AED', bg: 'rgba(124,58,237,0.15)' },
  RECRUITER: { label: 'Recruiter', color: '#0EA5E9', bg: 'rgba(14,165,233,0.15)' },
}

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
  const [companies, setCompanies] = useState([])
  const [rejectNote, setRejectNote] = useState({})
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [notifyMsg, setNotifyMsg] = useState('')
  const [notifyLink, setNotifyLink] = useState('')
  const [broadcastSubject, setBroadcastSubject] = useState('')
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [broadcastTarget, setBroadcastTarget] = useState('ALL')

  // Company member modal
  const [showMemberModal, setShowMemberModal] = useState(null) // companyId
  const [memberUserId, setMemberUserId] = useState('')
  const [memberRole, setMemberRole] = useState('HR')
  const [memberLoading, setMemberLoading] = useState(false)

  // Role dropdown state
  const [openRoleDropdown, setOpenRoleDropdown] = useState(null)

  useEffect(() => {
    if (user.role !== 'ADMIN') { navigate('/dashboard'); return }
    fetchStats()
  }, [])

  useEffect(() => {
    if (activeTab === 'users') fetchUsers()
    else if (activeTab === 'content') fetchContent(contentType)
    else if (activeTab === 'verifications') fetchVerifications()
    else if (activeTab === 'dashboard') fetchStats()
    else if (activeTab === 'companies') fetchCompanies()
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'content') fetchContent(contentType)
  }, [contentType])

  // Zatvori dropdown kada klikneš van
  useEffect(() => {
    const handleClick = () => setOpenRoleDropdown(null)
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

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
      setVerifications(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const fetchCompanies = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/companies')
      setCompanies(data)
    } catch (err) { console.error(err) }
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
      showSuccess('Email verifikovan!')
    } catch (err) { alert(err.response?.data?.message) }
    finally { setActionLoading(null) }
  }

  const handleRoleChange = async (id, role) => {
    setActionLoading(id)
    setOpenRoleDropdown(null)
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
      await api.put(`/admin/verifications/${id}`, { action, note: rejectNote[id] || '' })
      setVerifications(prev => prev.filter(v => v.id !== id))
      showSuccess(action === 'approve' ? '✓ Verifikacija odobrena!' : '✕ Verifikacija odbijena!')
      fetchStats()
    } catch (err) {
      alert(err.response?.data?.message || 'Greška')
    } finally { setActionLoading(null) }
  }

  const handleAssignMember = async () => {
    if (!memberUserId || !showMemberModal) return
    setMemberLoading(true)
    try {
      const { data } = await api.post('/admin/companies/member', {
        userId: memberUserId,
        companyId: showMemberModal,
        role: memberRole,
      })
      showSuccess(data.message)
      setShowMemberModal(null)
      setMemberUserId('')
      fetchCompanies()
    } catch (err) { alert(err.response?.data?.message) }
    finally { setMemberLoading(false) }
  }

  const handleRemoveMember = async (userId, companyId, name) => {
    if (!confirm(`Ukloniti ${name} iz firme?`)) return
    try {
      await api.delete('/admin/companies/member', { data: { userId, companyId } })
      showSuccess('Membership uklonjen!')
      fetchCompanies()
    } catch (err) { alert(err.response?.data?.message) }
  }

  const handleSendNotification = async () => {
    if (!notifyMsg) return
    setLoading(true)
    try {
      await api.post('/admin/notify', { message: notifyMsg, link: notifyLink })
      setNotifyMsg(''); setNotifyLink('')
      showSuccess('Notifikacija poslana!')
    } catch (err) { alert(err.response?.data?.message) }
    finally { setLoading(false) }
  }

  const handleSendBroadcast = async () => {
    if (!broadcastSubject || !broadcastMsg) return
    setLoading(true)
    try {
      const { data } = await api.post('/admin/broadcast', {
        subject: broadcastSubject, message: broadcastMsg, targetRole: broadcastTarget,
      })
      setBroadcastSubject(''); setBroadcastMsg('')
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

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
            }}>✓ {successMsg}</div>
          )}
          <button onClick={() => navigate('/dashboard')} style={btn('#3A3A3C')}>← Platforma</button>
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
                  fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '100px',
                }}>{verifications.length}</span>
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
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#636366', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sadržaj</h3>
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
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#636366', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Novi korisnici</h3>
              <div style={{ background: '#2C2C2E', borderRadius: '16px', border: '1px solid #3A3A3C', overflow: 'hidden' }}>
                {stats.recentUsers.map((u, i) => (
                  <div key={u.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px',
                    borderBottom: i < stats.recentUsers.length - 1 ? '1px solid #3A3A3C' : 'none',
                  }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                      {u.profileImage
                        ? <img src={u.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #FF6B35, #FFB800)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '13px' }}>{u.firstName?.[0]}{u.lastName?.[0]}</div>
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: '700', color: 'white', fontSize: '14px', margin: 0 }}>{u.firstName} {u.lastName}</p>
                      <p style={{ color: '#636366', fontSize: '12px', margin: 0 }}>{u.email}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '100px', background: ROLE_CONFIG[u.role]?.bg, color: ROLE_CONFIG[u.role]?.color }}>{u.role}</span>
                      <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '100px', background: u.emailVerified ? 'rgba(22,163,74,0.15)' : 'rgba(255,184,0,0.15)', color: u.emailVerified ? '#4ADE80' : '#FFB800' }}>
                        {u.emailVerified ? '✓ Email OK' : '⏳ Email čeka'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#636366' }}>{new Date(u.createdAt).toLocaleDateString('bs-BA')}</span>
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
                    {/* Avatar */}
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                      {u.profileImage
                        ? <img src={u.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #FF6B35, #FFB800)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '14px' }}>{u.firstName?.[0]}{u.lastName?.[0]}</div>
                      }
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <p style={{ fontWeight: '700', color: 'white', fontSize: '14px', margin: 0 }}>
                          {u.firstName} {u.lastName}
                        </p>
                        <span style={{
                          fontSize: '10px', padding: '2px 8px', borderRadius: '100px',
                          background: ROLE_CONFIG[u.role]?.bg || 'rgba(255,255,255,0.06)',
                          color: ROLE_CONFIG[u.role]?.color || '#636366',
                          fontWeight: '700',
                        }}>{u.role}</span>
                        {u.verificationStatus === 'VERIFIED' && (
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '100px', background: 'rgba(22,163,74,0.15)', color: '#4ADE80' }}>🎓 Verificiran</span>
                        )}
                        {u.verificationStatus === 'PENDING' && (
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '100px', background: 'rgba(255,184,0,0.15)', color: '#FFB800' }}>⏳ Indeks čeka</span>
                        )}
                        {!u.emailVerified && (
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '100px', background: 'rgba(255,59,48,0.1)', color: '#FF3B30' }}>✉️ Neverifikovan</span>
                        )}
                      </div>
                      <p style={{ color: '#636366', fontSize: '12px', margin: '2px 0 0 0' }}>
                        {u.email}{u.faculty ? ` · ${u.faculty}` : ''}
                      </p>
                    </div>

                    {/* Akcije */}
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
                      {!u.emailVerified && (
                        <button onClick={() => handleVerifyUser(u.id)} style={btn('#16A34A')}>
                          ✉️ Verificiraj
                        </button>
                      )}

                      {/* Role dropdown */}
                      {u.id !== user.id && (
                        <div style={{ position: 'relative' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenRoleDropdown(openRoleDropdown === u.id ? null : u.id)
                            }}
                            style={{
                              ...btn('#3A3A3C'),
                              display: 'flex', alignItems: 'center', gap: '6px',
                              background: openRoleDropdown === u.id ? '#4A4A4C' : '#3A3A3C',
                            }}>
                            🔑 Rola ▾
                          </button>

                          {openRoleDropdown === u.id && (
                            <div
                              onClick={e => e.stopPropagation()}
                              style={{
                                position: 'absolute', right: 0, top: '36px', zIndex: 100,
                                background: '#2C2C2E', border: '1px solid #3A3A3C',
                                borderRadius: '12px', padding: '6px', minWidth: '160px',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                              }}>
                              <p style={{ fontSize: '10px', color: '#636366', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 10px 8px' }}>
                                Platforma rola
                              </p>
                              {Object.entries(ROLE_CONFIG).map(([role, conf]) => (
                                <button
                                  key={role}
                                  onClick={() => handleRoleChange(u.id, role)}
                                  style={{
                                    width: '100%', padding: '9px 12px', borderRadius: '8px',
                                    border: 'none', textAlign: 'left', cursor: 'pointer',
                                    background: u.role === role ? `${conf.bg}` : 'transparent',
                                    color: u.role === role ? conf.color : '#E5E5EA',
                                    fontSize: '13px', fontWeight: u.role === role ? '700' : '500',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    transition: 'background 0.15s',
                                  }}
                                  onMouseEnter={e => { if (u.role !== role) e.currentTarget.style.background = '#3A3A3C' }}
                                  onMouseLeave={e => { if (u.role !== role) e.currentTarget.style.background = 'transparent' }}
                                >
                                  {conf.label}
                                  {u.role === role && <span style={{ fontSize: '12px' }}>✓</span>}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

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

          {/* ─── FIRME & ROLE ─── */}
          {activeTab === 'companies' && (
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '900', color: 'white', marginBottom: '20px' }}>
                🏢 Firme & Company Role
              </h2>

              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#636366' }}>Učitavanje...</div>
              ) : companies.length === 0 ? (
                <div style={{ background: '#2C2C2E', borderRadius: '16px', padding: '48px', textAlign: 'center', border: '1px solid #3A3A3C' }}>
                  <p style={{ fontSize: '40px', marginBottom: '12px' }}>🏢</p>
                  <p style={{ color: 'white', fontWeight: '800', fontSize: '18px' }}>Nema firmi</p>
                  <p style={{ color: '#636366', fontSize: '14px', marginTop: '8px' }}>Firme se dodaju kroz Companies stranicu</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {companies.map(company => (
                    <div key={company.id} style={{
                      background: '#2C2C2E', borderRadius: '16px', padding: '20px',
                      border: '1px solid #3A3A3C',
                    }}>
                      {/* Company header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div>
                          <h3 style={{ color: 'white', fontWeight: '800', fontSize: '16px', margin: 0, marginBottom: '4px' }}>
                            {company.name}
                          </h3>
                          {company.industry && (
                            <p style={{ color: '#FF6B35', fontSize: '13px', fontWeight: '600', margin: 0 }}>
                              {company.industry}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => { setShowMemberModal(company.id); setMemberUserId(''); setMemberRole('HR') }}
                          style={btn('#7C3AED')}>
                          + Dodaj člana
                        </button>
                      </div>

                      {/* Članovi */}
                      {company.members?.length === 0 ? (
                        <p style={{ color: '#636366', fontSize: '13px', padding: '12px 0' }}>
                          Nema članova – dodaj HR ili Recruitera
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {company.members.map(member => (
                            <div key={member.id} style={{
                              display: 'flex', alignItems: 'center', gap: '12px',
                              padding: '10px 14px', borderRadius: '10px',
                              background: '#1C1C1E',
                            }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                                {member.user?.profileImage
                                  ? <img src={member.user.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #FF6B35, #FFB800)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: '700' }}>{member.user?.firstName?.[0]}{member.user?.lastName?.[0]}</div>
                                }
                              </div>
                              <div style={{ flex: 1 }}>
                                <p style={{ color: 'white', fontWeight: '700', fontSize: '13px', margin: 0 }}>
                                  {member.user?.firstName} {member.user?.lastName}
                                </p>
                                <p style={{ color: '#636366', fontSize: '11px', margin: 0 }}>{member.user?.email}</p>
                              </div>
                              <span style={{
                                fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '100px',
                                background: COMPANY_ROLE_CONFIG[member.role]?.bg,
                                color: COMPANY_ROLE_CONFIG[member.role]?.color,
                              }}>
                                {member.role}
                              </span>
                              <button
                                onClick={() => handleRemoveMember(member.user?.id, company.id, `${member.user?.firstName} ${member.user?.lastName}`)}
                                style={{ ...btn('#FF3B30'), padding: '5px 10px', fontSize: '11px' }}>
                                Ukloni
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Modal za dodavanje člana */}
              {showMemberModal && (
                <div style={{
                  position: 'fixed', inset: 0, zIndex: 1000,
                  background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} onClick={() => setShowMemberModal(null)}>
                  <div style={{
                    background: '#2C2C2E', borderRadius: '20px', padding: '28px',
                    width: '100%', maxWidth: '440px', border: '1px solid #3A3A3C',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
                  }} onClick={e => e.stopPropagation()}>
                    <h3 style={{ color: 'white', fontWeight: '900', fontSize: '18px', marginBottom: '6px' }}>
                      Dodaj člana firme
                    </h3>
                    <p style={{ color: '#636366', fontSize: '13px', marginBottom: '20px' }}>
                      Upiši User ID korisnika koga hoćeš da dodaš
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '12px', color: '#8E8E93', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          User ID *
                        </label>
                        <input
                          value={memberUserId}
                          onChange={e => setMemberUserId(e.target.value)}
                          placeholder="npr. abc123-def456..."
                          style={inputStyle}
                        />
                        <p style={{ fontSize: '11px', color: '#636366', marginTop: '6px' }}>
                          💡 User ID nađeš u URL-u profila: /profile/<strong>USER_ID</strong>
                        </p>
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', color: '#8E8E93', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Company rola
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {Object.entries(COMPANY_ROLE_CONFIG).map(([role, conf]) => (
                            <button key={role} type="button"
                              onClick={() => setMemberRole(role)}
                              style={{
                                flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                                cursor: 'pointer', fontWeight: '700', fontSize: '13px',
                                background: memberRole === role ? conf.bg : '#1C1C1E',
                                color: memberRole === role ? conf.color : '#636366',
                                outline: memberRole === role ? `2px solid ${conf.color}40` : 'none',
                                transition: 'all 0.15s',
                              }}>
                              {role}
                            </button>
                          ))}
                        </div>
                        <div style={{ marginTop: '10px', padding: '10px 14px', background: '#1C1C1E', borderRadius: '10px' }}>
                          <p style={{ fontSize: '12px', color: '#636366', margin: 0, lineHeight: '1.5' }}>
                            {memberRole === 'OWNER' && '👑 Puni pristup – može sve'}
                            {memberRole === 'HR' && '📋 Može objavljivati prakse i upravljati aplikacijama'}
                            {memberRole === 'RECRUITER' && '🔍 Može pregledati aplikacije'}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                        <button onClick={() => setShowMemberModal(null)} style={{
                          flex: 1, padding: '12px', borderRadius: '12px', border: 'none',
                          background: '#3A3A3C', color: '#8E8E93', fontWeight: '700', cursor: 'pointer',
                        }}>Odustani</button>
                        <button
                          onClick={handleAssignMember}
                          disabled={!memberUserId || memberLoading}
                          style={{
                            flex: 2, padding: '12px', borderRadius: '12px', border: 'none',
                            background: !memberUserId || memberLoading ? '#3A3A3C' : 'linear-gradient(135deg, #7C3AED, #A855F7)',
                            color: !memberUserId || memberLoading ? '#636366' : 'white',
                            fontWeight: '800', fontSize: '14px', cursor: !memberUserId || memberLoading ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                          }}>
                          {memberLoading ? (
                            <><div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid white', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />Dodajem...</>
                          ) : '+ Dodaj člana'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── SADRŽAJ ─── */}
          {activeTab === 'content' && (
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '900', color: 'white', marginBottom: '20px' }}>🗂️ Moderacija sadržaja</h2>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {CONTENT_TABS.map(tab => (
                  <button key={tab.id} onClick={() => setContentType(tab.id)} style={{
                    padding: '8px 16px', borderRadius: '10px', border: 'none',
                    background: contentType === tab.id ? '#FF6B35' : '#2C2C2E',
                    color: contentType === tab.id ? 'white' : '#8E8E93',
                    fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                  }}>{tab.label}</button>
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
                        <p style={{ fontWeight: '700', color: 'white', fontSize: '14px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</p>
                        <p style={{ color: '#636366', fontSize: '12px', margin: '2px 0 0 0' }}>
                          {owner ? `${owner.firstName} ${owner.lastName}` : ''} · {new Date(item.createdAt).toLocaleDateString('bs-BA')}{item.price ? ` · ${item.price} KM` : ''}
                        </p>
                      </div>
                      <button onClick={() => handleDeleteContent(item.id)} disabled={actionLoading === item.id} style={btn('#FF3B30')}>🗑️ Obriši</button>
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
                    <span style={{ marginLeft: '12px', background: '#FF6B35', color: 'white', fontSize: '14px', padding: '3px 10px', borderRadius: '100px' }}>{verifications.length}</span>
                  )}
                </h2>
                <button onClick={fetchVerifications} style={btn('#3A3A3C')}>🔄 Osvježi</button>
              </div>
              {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#636366' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #FF6B35', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                  Učitavanje...
                </div>
              ) : verifications.length === 0 ? (
                <div style={{ background: '#2C2C2E', borderRadius: '18px', padding: '64px', textAlign: 'center', border: '1px solid #3A3A3C' }}>
                  <p style={{ fontSize: '48px', marginBottom: '16px' }}>🎓</p>
                  <p style={{ color: 'white', fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>Nema zahtjeva</p>
                  <p style={{ color: '#636366', fontSize: '14px' }}>Ovdje će se pojaviti zahtjevi kada studenti uploadaju sliku indeksa</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {verifications.map(v => (
                    <div key={v.id} style={{ background: '#2C2C2E', borderRadius: '20px', padding: '24px', border: '1px solid #3A3A3C', opacity: actionLoading === v.id ? 0.6 : 1 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 220px', gap: '24px', alignItems: 'start' }}>
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: '700', color: '#636366', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Korisnik</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', overflow: 'hidden', flexShrink: 0 }}>
                              {v.profileImage
                                ? <img src={v.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #FF6B35, #FFB800)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '16px' }}>{v.firstName?.[0]}{v.lastName?.[0]}</div>
                              }
                            </div>
                            <div>
                              <p style={{ fontWeight: '800', color: 'white', fontSize: '15px', margin: 0 }}>{v.firstName} {v.lastName}</p>
                              <p style={{ color: '#636366', fontSize: '12px', margin: '2px 0' }}>{v.email}</p>
                              {v.faculty && <p style={{ color: '#FF6B35', fontSize: '12px', margin: 0, fontWeight: '600' }}>{v.faculty}</p>}
                            </div>
                          </div>
                          <button onClick={() => navigate(`/profile/${v.id}`)} style={{ ...btn('#3A3A3C'), marginTop: '4px', fontSize: '12px' }}>👁️ Pogledaj profil</button>
                        </div>
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: '700', color: '#636366', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Slika indeksa</p>
                          {v.indexImage ? (
                            <a href={v.indexImage} target="_blank" rel="noreferrer">
                              <img src={v.indexImage} alt="Indeks" style={{ width: '100%', maxHeight: '260px', objectFit: 'contain', borderRadius: '14px', border: '1px solid #3A3A3C', background: '#1C1C1E', cursor: 'zoom-in' }} />
                            </a>
                          ) : (
                            <div style={{ height: '120px', borderRadius: '14px', border: '2px dashed #3A3A3C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#636366', fontSize: '13px' }}>Nema slike</div>
                          )}
                        </div>
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: '700', color: '#636366', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Odluka</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button onClick={() => handleReview(v.id, 'approve')} disabled={actionLoading === v.id} style={{ padding: '13px', borderRadius: '12px', border: 'none', background: actionLoading === v.id ? '#3A3A3C' : 'linear-gradient(135deg, #16A34A, #4ADE80)', color: 'white', fontSize: '14px', fontWeight: '800', cursor: actionLoading === v.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                              {actionLoading === v.id ? <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid white', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} /> : '✓'} Odobri
                            </button>
                            <div style={{ background: '#1C1C1E', borderRadius: '12px', padding: '12px' }}>
                              <input value={rejectNote[v.id] || ''} onChange={e => setRejectNote(prev => ({ ...prev, [v.id]: e.target.value }))} placeholder="Razlog odbijanja..." style={{ ...inputStyle, fontSize: '12px', padding: '8px 12px', background: '#2C2C2E', marginBottom: '8px' }} />
                              <button onClick={() => handleReview(v.id, 'reject')} disabled={actionLoading === v.id} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: 'none', background: 'rgba(255,59,48,0.15)', color: '#FF3B30', fontSize: '13px', fontWeight: '700', cursor: actionLoading === v.id ? 'not-allowed' : 'pointer' }}>✕ Odbij</button>
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
              <h2 style={{ fontSize: '22px', fontWeight: '900', color: 'white', marginBottom: '24px' }}>📢 Obavještenja i emailovi</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ background: '#2C2C2E', borderRadius: '18px', padding: '24px', border: '1px solid #3A3A3C' }}>
                  <h3 style={{ color: 'white', fontWeight: '800', marginBottom: '6px', fontSize: '16px' }}>🔔 Sistemska notifikacija</h3>
                  <p style={{ color: '#636366', fontSize: '13px', marginBottom: '18px' }}>Pojavljuje se u Activity panelu svih korisnika</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <textarea value={notifyMsg} onChange={e => setNotifyMsg(e.target.value)} placeholder="Poruka notifikacije..." rows={4} style={{ ...inputStyle, resize: 'none' }} />
                    <input value={notifyLink} onChange={e => setNotifyLink(e.target.value)} placeholder="Link (npr. /jobs) – opciono" style={inputStyle} />
                    <button onClick={handleSendNotification} disabled={!notifyMsg || loading} style={{ ...btn('#FF6B35'), padding: '12px', fontSize: '14px', opacity: !notifyMsg || loading ? 0.5 : 1 }}>
                      {loading ? 'Slanje...' : '🔔 Pošalji notifikaciju'}
                    </button>
                  </div>
                </div>
                <div style={{ background: '#2C2C2E', borderRadius: '18px', padding: '24px', border: '1px solid #3A3A3C' }}>
                  <h3 style={{ color: 'white', fontWeight: '800', marginBottom: '6px', fontSize: '16px' }}>📧 Broadcast email</h3>
                  <p style={{ color: '#636366', fontSize: '13px', marginBottom: '18px' }}>Pošalji email korisnicima</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <select value={broadcastTarget} onChange={e => setBroadcastTarget(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="ALL">Svi korisnici</option>
                      <option value="STUDENT">Samo studenti</option>
                      <option value="ADMIN">Samo admini</option>
                    </select>
                    <input value={broadcastSubject} onChange={e => setBroadcastSubject(e.target.value)} placeholder="Subject emaila..." style={inputStyle} />
                    <textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} placeholder="Tekst emaila..." rows={4} style={{ ...inputStyle, resize: 'none' }} />
                    <button onClick={handleSendBroadcast} disabled={!broadcastSubject || !broadcastMsg || loading} style={{ ...btn('#7C3AED'), padding: '12px', fontSize: '14px', opacity: !broadcastSubject || !broadcastMsg || loading ? 0.5 : 1 }}>
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