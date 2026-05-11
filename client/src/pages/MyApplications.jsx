import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyApplications, withdrawApplication } from '../api/internships'
import { getSocket } from '../services/socket'
import { AnimatedSection, AnimatedScale, AnimatedBlur } from '../components/Animated'

const STATUS_CONFIG = {
  PENDING:   { label: 'Na čekanju',    color: '#FFB800', bg: 'rgba(255,184,0,0.1)',  icon: '⏳' },
  REVIEWING: { label: 'U razmatranju', color: '#0EA5E9', bg: 'rgba(14,165,233,0.1)', icon: '👀' },
  INTERVIEW: { label: 'Intervju zakazan', color: '#7C3AED', bg: 'rgba(124,58,237,0.1)', icon: '🎯' },
  ACCEPTED:  { label: 'Prihvaćeno',   color: '#16A34A', bg: 'rgba(22,163,74,0.1)',  icon: '🏆' },
  REJECTED:  { label: 'Odbijeno',     color: '#FF3B30', bg: 'rgba(255,59,48,0.1)',  icon: '❌' },
}

export default function MyApplications() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [liveUpdate, setLiveUpdate] = useState(null) // toast za live update

  const fetchApplications = useCallback(async () => {
    try {
      const data = await getMyApplications()
      setApplications(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApplications()
  }, [])

  // ─── Socket listener za live status update ────────────────────
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleActivity = async (activity) => {
      // Ako je link na my-applications, znači HR je promijenio status
      if (activity.link === '/companies/my-applications') {
        // Refetchaj sve aplikacije
        const data = await getMyApplications()
        setApplications(data)

        // Prikaži live toast
        setLiveUpdate(activity.message)
        setTimeout(() => setLiveUpdate(null), 5000)
      }
    }

    socket.on('new_activity', handleActivity)

    return () => {
      socket.off('new_activity', handleActivity)
    }
  }, [])

  const handleWithdraw = async (applicationId) => {
    if (!confirm('Povući prijavu?')) return
    try {
      await withdrawApplication(applicationId)
      setApplications(prev => prev.filter(a => a.id !== applicationId))
    } catch (err) {
      console.error(err)
    }
  }

  const filtered = filter === 'ALL'
    ? applications
    : applications.filter(a => a.status === filter)

  return (
    <div style={{ minHeight: '100vh', background: '#E2DDD6' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* Live update toast */}
      {liveUpdate && (
        <div style={{
          position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, padding: '14px 24px', borderRadius: '100px',
          background: '#1C1C1E', color: 'white', fontSize: '14px', fontWeight: '700',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          display: 'flex', alignItems: 'center', gap: '10px',
          animation: 'slideUp 0.3s ease',
          whiteSpace: 'nowrap', maxWidth: '90vw',
        }}>
          <span style={{ fontSize: '18px' }}>🔔</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{liveUpdate}</span>
        </div>
      )}

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1C1C1E 0%, #1A1C2E 60%, #1C1C1E 100%)',
        padding: '32px 40px 40px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 50%, rgba(124,58,237,0.15), transparent 55%)' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '860px', margin: '0 auto' }}>
          <AnimatedBlur delay={0}>
            <button onClick={() => navigate('/companies')} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', color: '#8E8E93',
              fontSize: '14px', cursor: 'pointer', marginBottom: '20px', padding: 0,
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Nazad na firme
            </button>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '900', color: 'white', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                  Moje prijave 📋
                </h1>
                <p style={{ color: '#8E8E93', fontSize: '15px' }}>
                  Prati status svojih prijava za prakse
                </p>
              </div>

              {/* Live indikator */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(255,255,255,0.08)', borderRadius: '100px',
                padding: '8px 14px', border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: '#4ADE80',
                  boxShadow: '0 0 0 3px rgba(74,222,128,0.2)',
                  animation: 'pulse 2s infinite',
                }} />
                <span style={{ fontSize: '12px', color: '#8E8E93', fontWeight: '600' }}>Live</span>
              </div>
            </div>
          </AnimatedBlur>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(74,222,128,0.2); }
          50% { box-shadow: 0 0 0 6px rgba(74,222,128,0.1); }
        }
      `}</style>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '28px 32px 48px' }}>

        {/* Filter chips */}
        <AnimatedSection delay={0} direction="up">
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
            {[
              { key: 'ALL', label: `Sve (${applications.length})` },
              ...Object.entries(STATUS_CONFIG).map(([key, val]) => ({
                key,
                label: `${val.icon} ${val.label} (${applications.filter(a => a.status === key).length})`
              }))
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding: '7px 14px', borderRadius: '100px', border: 'none', cursor: 'pointer',
                background: filter === f.key ? '#1C1C1E' : '#EEEBE5',
                color: filter === f.key ? 'white' : '#6B7280',
                fontSize: '13px', fontWeight: '700', transition: 'all 0.15s',
              }}>
                {f.label}
              </button>
            ))}
          </div>
        </AnimatedSection>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #FF6B35', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <AnimatedScale>
            <div style={{ background: '#EEEBE5', borderRadius: '24px', padding: '64px', textAlign: 'center' }}>
              <p style={{ fontSize: '48px', marginBottom: '16px' }}>📋</p>
              <p style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '20px', marginBottom: '8px' }}>Nema prijava</p>
              <p style={{ color: '#8E8E93', marginBottom: '24px' }}>Prijavite se na prakse na stranici firmi</p>
              <button onClick={() => navigate('/companies')} style={{
                padding: '12px 28px', borderRadius: '14px', border: 'none',
                background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                color: 'white', fontWeight: '700', cursor: 'pointer',
              }}>Pretraži prakse</button>
            </div>
          </AnimatedScale>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filtered.map((app, i) => {
              const statusConf = STATUS_CONFIG[app.status]
              return (
                <AnimatedSection key={app.id} delay={i * 0.05} direction="up">
                  <div style={{
                    background: '#EEEBE5', borderRadius: '20px', padding: '20px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(0,0,0,0.05)',
                    transition: 'border-color 0.3s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                      <div style={{ flex: 1 }}>
                        {/* Firma & praksa */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                          <div style={{
                            width: '40px', height: '40px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0,
                            background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: '800', fontSize: '14px',
                          }}>
                            {app.internship?.company?.logoUrl
                              ? <img src={app.internship.company.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : app.internship?.company?.name?.[0]
                            }
                          </div>
                          <div>
                            <p style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '15px', margin: 0 }}>
                              {app.internship?.title}
                            </p>
                            <p style={{ fontSize: '13px', color: '#8E8E93', margin: 0 }}>
                              {app.internship?.company?.name}
                            </p>
                          </div>
                        </div>

                        {/* Status */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '13px', fontWeight: '700', padding: '6px 14px', borderRadius: '100px',
                            background: statusConf.bg, color: statusConf.color,
                            transition: 'all 0.3s',
                          }}>
                            {statusConf.icon} {statusConf.label}
                          </span>
                          <span style={{ fontSize: '12px', color: '#AEAEB2' }}>
                            📅 {new Date(app.createdAt).toLocaleDateString('bs-BA')}
                          </span>
                        </div>

                        {/* Notes od HR */}
                        {app.notes && (
                          <div style={{
                            marginTop: '12px', padding: '10px 14px', borderRadius: '10px',
                            background: 'rgba(124,58,237,0.08)', borderLeft: '3px solid #7C3AED',
                          }}>
                            <p style={{ fontSize: '12px', color: '#7C3AED', fontWeight: '700', marginBottom: '3px' }}>
                              💬 Poruka od HR-a:
                            </p>
                            <p style={{ fontSize: '13px', color: '#3A3A3C', margin: 0 }}>{app.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Akcije */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                        <button onClick={() => navigate(`/companies/${app.internship?.company?.id}`)} style={{
                          padding: '8px 14px', borderRadius: '10px', border: 'none',
                          background: '#F5F2ED', color: '#1C1C1E',
                          fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                        }}>
                          Pogledaj firmu
                        </button>
                        {app.status === 'PENDING' && (
                          <button onClick={() => handleWithdraw(app.id)} style={{
                            padding: '8px 14px', borderRadius: '10px', border: 'none',
                            background: 'rgba(255,59,48,0.08)', color: '#FF3B30',
                            fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                          }}>
                            Povuci prijavu
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}