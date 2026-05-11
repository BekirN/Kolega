import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCompanyApplications, updateApplicationStatus } from '../api/internships'
import { AnimatedSection, AnimatedScale, AnimatedBlur } from '../components/Animated'

const STATUS_CONFIG = {
  PENDING:   { label: 'Na čekanju',    color: '#FFB800', bg: 'rgba(255,184,0,0.12)',    icon: '⏳' },
  REVIEWING: { label: 'U razmatranju', color: '#0EA5E9', bg: 'rgba(14,165,233,0.12)',   icon: '👀' },
  INTERVIEW: { label: 'Intervju',      color: '#7C3AED', bg: 'rgba(124,58,237,0.12)',   icon: '🎯' },
  ACCEPTED:  { label: 'Prihvaćeno',   color: '#16A34A', bg: 'rgba(22,163,74,0.12)',    icon: '🏆' },
  REJECTED:  { label: 'Odbijeno',     color: '#FF3B30', bg: 'rgba(255,59,48,0.12)',    icon: '❌' },
}

const STATUS_FLOW = ['PENDING', 'REVIEWING', 'INTERVIEW', 'ACCEPTED']

export default function CompanyApplications() {
  const { companyId } = useParams()
  const navigate = useNavigate()

  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [filterInternship, setFilterInternship] = useState('ALL')
  const [actionLoading, setActionLoading] = useState(null)
  const [openNotes, setOpenNotes] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    fetchApplications()
  }, [companyId])

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const data = await getCompanyApplications(companyId)
      setApplications(data)
    } catch (err) {
      console.error(err)
      navigate('/companies')
    } finally {
      setLoading(false)
    }
  }

  const showSuccess = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const handleStatusChange = async (applicationId, status) => {
    setActionLoading(applicationId + status)
    try {
      await updateApplicationStatus(applicationId, status, noteText)
      setApplications(prev => prev.map(a =>
        a.id === applicationId ? { ...a, status, notes: noteText || a.notes } : a
      ))
      setOpenNotes(null)
      setNoteText('')
      showSuccess(`Status promijenjen u: ${STATUS_CONFIG[status].label}`)
    } catch (err) {
      alert(err.response?.data?.message || 'Greška')
    } finally {
      setActionLoading(null)
    }
  }

  // Unikatne prakse za filter
  const internships = [...new Map(
    applications.map(a => [a.internship?.id, a.internship])
  ).values()].filter(Boolean)

  const filtered = applications
    .filter(a => filter === 'ALL' || a.status === filter)
    .filter(a => filterInternship === 'ALL' || a.internship?.id === filterInternship)

  // Statistike
  const stats = Object.keys(STATUS_CONFIG).reduce((acc, key) => {
    acc[key] = applications.filter(a => a.status === key).length
    return acc
  }, {})

  return (
    <div style={{ minHeight: '100vh', background: '#E2DDD6' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1C1C1E 0%, #1C1A2E 60%, #1C1C1E 100%)',
        padding: '28px 40px 40px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 50%, rgba(124,58,237,0.18), transparent 55%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 80%, rgba(255,107,53,0.08), transparent 50%)' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1000px', margin: '0 auto' }}>
          <AnimatedBlur delay={0}>
            <button onClick={() => navigate(`/companies/${companyId}`)} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', color: '#8E8E93',
              fontSize: '14px', cursor: 'pointer', marginBottom: '20px', padding: 0,
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Nazad na firmu
            </button>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '900', color: 'white', letterSpacing: '-0.02em', marginBottom: '6px' }}>
                  HR Dashboard 📋
                </h1>
                <p style={{ color: '#8E8E93', fontSize: '14px' }}>
                  Upravljaj prijavama kandidata
                </p>
              </div>

              {/* Stat chips */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Ukupno', value: applications.length, color: '#E5E5EA' },
                  { label: 'Na čekanju', value: stats.PENDING, color: '#FFB800' },
                  { label: 'Intervju', value: stats.INTERVIEW, color: '#7C3AED' },
                  { label: 'Prihvaćeno', value: stats.ACCEPTED, color: '#16A34A' },
                ].map((s, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.08)', borderRadius: '12px',
                    padding: '10px 16px', backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    textAlign: 'center',
                  }}>
                    <p style={{ fontSize: '20px', fontWeight: '900', color: s.color, margin: 0 }}>{s.value}</p>
                    <p style={{ fontSize: '11px', color: '#8E8E93', margin: 0, fontWeight: '600' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Success msg */}
            {successMsg && (
              <div style={{
                marginTop: '16px', padding: '10px 16px', borderRadius: '10px',
                background: 'rgba(22,163,74,0.2)', color: '#4ADE80',
                fontSize: '13px', fontWeight: '600', display: 'inline-block',
              }}>
                ✓ {successMsg}
              </div>
            )}
          </AnimatedBlur>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 32px 48px' }}>

        {/* Filteri */}
        <AnimatedSection delay={0} direction="up">
          <div style={{
            background: '#EEEBE5', borderRadius: '16px', padding: '16px 20px',
            marginBottom: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap',
            alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            {/* Status filter */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
              {[
                { key: 'ALL', label: `Sve (${applications.length})` },
                ...Object.entries(STATUS_CONFIG).map(([key, val]) => ({
                  key, label: `${val.icon} ${val.label} (${stats[key]})`
                }))
              ].map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)} style={{
                  padding: '6px 12px', borderRadius: '100px', border: 'none', cursor: 'pointer',
                  background: filter === f.key ? '#1C1C1E' : '#D8D4CC',
                  color: filter === f.key ? 'white' : '#6B7280',
                  fontSize: '12px', fontWeight: '700', transition: 'all 0.15s',
                }}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Praksa filter */}
            {internships.length > 1 && (
              <select
                value={filterInternship}
                onChange={e => setFilterInternship(e.target.value)}
                style={{
                  padding: '8px 14px', borderRadius: '10px', border: '1.5px solid #D8D4CC',
                  background: '#EEEBE5', color: '#1C1C1E', fontSize: '13px',
                  fontWeight: '600', outline: 'none', cursor: 'pointer',
                }}>
                <option value="ALL">Sve prakse</option>
                {internships.map(i => (
                  <option key={i.id} value={i.id}>{i.title}</option>
                ))}
              </select>
            )}
          </div>
        </AnimatedSection>

        {/* Lista prijava */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #7C3AED', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <AnimatedScale>
            <div style={{ background: '#EEEBE5', borderRadius: '24px', padding: '64px', textAlign: 'center' }}>
              <p style={{ fontSize: '48px', marginBottom: '12px' }}>📭</p>
              <p style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '20px', marginBottom: '8px' }}>
                Nema prijava
              </p>
              <p style={{ color: '#8E8E93', fontSize: '14px' }}>
                {filter === 'ALL' ? 'Još niko se nije prijavio na prakse ove firme.' : `Nema prijava sa statusom "${STATUS_CONFIG[filter]?.label}".`}
              </p>
            </div>
          </AnimatedScale>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filtered.map((app, i) => {
              const statusConf = STATUS_CONFIG[app.status]
              const isOpen = openNotes === app.id

              return (
                <AnimatedSection key={app.id} delay={i * 0.04} direction="up">
                  <div style={{
                    background: '#EEEBE5', borderRadius: '20px', padding: '20px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                    border: isOpen ? '2px solid rgba(124,58,237,0.25)' : '1px solid rgba(0,0,0,0.05)',
                    transition: 'border 0.2s',
                  }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>

                      {/* Avatar kandidata */}
                      <div style={{
                        width: '48px', height: '48px', borderRadius: '14px',
                        overflow: 'hidden', flexShrink: 0,
                      }}>
                        {app.applicant?.profileImage ? (
                          <img src={app.applicant.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{
                            width: '100%', height: '100%',
                            background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: '800', fontSize: '16px',
                          }}>
                            {app.applicant?.firstName?.[0]}{app.applicant?.lastName?.[0]}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                              <p style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '15px', margin: 0 }}>
                                {app.applicant?.firstName} {app.applicant?.lastName}
                              </p>
                              {app.applicant?.verificationStatus === 'VERIFIED' && (
                                <span style={{
                                  fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '100px',
                                  background: 'rgba(22,163,74,0.12)', color: '#16A34A',
                                }}>🎓 Student</span>
                              )}
                            </div>
                            <p style={{ fontSize: '12px', color: '#8E8E93', margin: 0 }}>
                              {app.applicant?.email}
                              {app.applicant?.faculty && ` · ${app.applicant.faculty}`}
                            </p>
                          </div>

                          {/* Status badge */}
                          <span style={{
                            fontSize: '12px', fontWeight: '700', padding: '5px 12px', borderRadius: '100px',
                            background: statusConf.bg, color: statusConf.color, flexShrink: 0,
                          }}>
                            {statusConf.icon} {statusConf.label}
                          </span>
                        </div>

                        {/* Praksa & datum */}
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                          <span style={{
                            fontSize: '12px', fontWeight: '600', padding: '3px 10px', borderRadius: '100px',
                            background: 'rgba(255,107,53,0.1)', color: '#FF6B35',
                          }}>
                            🏢 {app.internship?.title}
                          </span>
                          <span style={{ fontSize: '12px', color: '#AEAEB2' }}>
                            📅 {new Date(app.createdAt).toLocaleDateString('bs-BA')}
                          </span>
                          {app.cvUrl && (
                            <a href={app.cvUrl} target="_blank" rel="noopener noreferrer" style={{
                              fontSize: '12px', fontWeight: '600', color: '#0EA5E9',
                              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px',
                            }}>
                              📄 Preuzmi CV
                            </a>
                          )}
                        </div>

                        {/* Propratno pismo */}
                        {app.coverLetter && (
                          <div style={{
                            padding: '12px 14px', borderRadius: '12px', marginBottom: '12px',
                            background: '#F5F2ED', border: '1px solid rgba(0,0,0,0.05)',
                          }}>
                            <p style={{ fontSize: '11px', fontWeight: '700', color: '#AEAEB2', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              Propratno pismo
                            </p>
                            <p style={{ fontSize: '13px', color: '#3A3A3C', lineHeight: '1.55', margin: 0 }}>
                              {app.coverLetter}
                            </p>
                          </div>
                        )}

                        {/* Notes od HR */}
                        {app.notes && !isOpen && (
                          <div style={{
                            padding: '10px 14px', borderRadius: '10px', marginBottom: '12px',
                            background: 'rgba(124,58,237,0.08)', borderLeft: '3px solid #7C3AED',
                          }}>
                            <p style={{ fontSize: '11px', color: '#7C3AED', fontWeight: '700', marginBottom: '3px' }}>Vaša bilješka:</p>
                            <p style={{ fontSize: '13px', color: '#3A3A3C', margin: 0 }}>{app.notes}</p>
                          </div>
                        )}

                        {/* Notes forma */}
                        {isOpen && (
                          <div style={{ marginBottom: '14px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              Poruka kandidatu (opciono)
                            </label>
                            <textarea
                              value={noteText}
                              onChange={e => setNoteText(e.target.value)}
                              rows={2}
                              placeholder="npr. Kontaktirat ćemo vas ovaj tjedan za termin intervjua..."
                              style={{
                                width: '100%', padding: '10px 12px', borderRadius: '10px',
                                border: '1.5px solid #D8D4CC', background: '#F5F2ED',
                                color: '#1C1C1E', fontSize: '13px', resize: 'none',
                                outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                              }}
                              onFocus={e => e.target.style.borderColor = '#7C3AED'}
                              onBlur={e => e.target.style.borderColor = '#D8D4CC'}
                            />
                          </div>
                        )}

                        {/* Akcije */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>

                          {/* Profil */}
                          <button
                            onClick={() => navigate(`/profile/${app.applicant?.id}`)}
                            style={{
                              padding: '8px 14px', borderRadius: '10px', border: 'none',
                              background: '#F5F2ED', color: '#3A3A3C',
                              fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                            }}>
                            👤 Profil
                          </button>

                          {/* Chat */}
                          <button
                            onClick={() => navigate(`/chat/${app.applicant?.id}`)}
                            style={{
                              padding: '8px 14px', borderRadius: '10px', border: 'none',
                              background: '#F5F2ED', color: '#3A3A3C',
                              fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                            }}>
                            💬 Poruka
                          </button>

                          {/* Status promjena */}
                          {app.status !== 'ACCEPTED' && app.status !== 'REJECTED' && (
                            <>
                              {!isOpen ? (
                                <button
                                  onClick={() => { setOpenNotes(app.id); setNoteText(app.notes || '') }}
                                  style={{
                                    padding: '8px 14px', borderRadius: '10px', border: 'none',
                                    background: 'rgba(124,58,237,0.1)', color: '#7C3AED',
                                    fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                                  }}>
                                  ✏️ Promijeni status
                                </button>
                              ) : (
                                <>
                                  {STATUS_FLOW.filter(s => s !== app.status && s !== 'PENDING').map(status => (
                                    <button
                                      key={status}
                                      onClick={() => handleStatusChange(app.id, status)}
                                      disabled={actionLoading === app.id + status}
                                      style={{
                                        padding: '8px 14px', borderRadius: '10px', border: 'none',
                                        background: STATUS_CONFIG[status].bg,
                                        color: STATUS_CONFIG[status].color,
                                        fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        opacity: actionLoading === app.id + status ? 0.6 : 1,
                                      }}>
                                      {actionLoading === app.id + status ? (
                                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '1.5px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                                      ) : STATUS_CONFIG[status].icon}
                                      {STATUS_CONFIG[status].label}
                                    </button>
                                  ))}
                                  <button
                                    onClick={() => handleStatusChange(app.id, 'REJECTED')}
                                    disabled={actionLoading === app.id + 'REJECTED'}
                                    style={{
                                      padding: '8px 14px', borderRadius: '10px', border: 'none',
                                      background: 'rgba(255,59,48,0.1)', color: '#FF3B30',
                                      fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                                    }}>
                                    ❌ Odbij
                                  </button>
                                  <button
                                    onClick={() => { setOpenNotes(null); setNoteText('') }}
                                    style={{
                                      padding: '8px 14px', borderRadius: '10px', border: 'none',
                                      background: '#D8D4CC', color: '#6B7280',
                                      fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                                    }}>
                                    Odustani
                                  </button>
                                </>
                              )}
                            </>
                          )}

                          {/* Finalni statusi */}
                          {(app.status === 'ACCEPTED' || app.status === 'REJECTED') && (
                            <button
                              onClick={() => handleStatusChange(app.id, 'REVIEWING')}
                              style={{
                                padding: '8px 14px', borderRadius: '10px', border: 'none',
                                background: '#D8D4CC', color: '#6B7280',
                                fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                              }}>
                              ↩️ Vrati u razmatranje
                            </button>
                          )}
                        </div>
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