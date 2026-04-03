import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatedSection, AnimatedList, AnimatedBlur, AnimatedLine, AnimatedScale } from '../components/Animated'

const MODULES = [
  { path: '/shop', emoji: '🛍️', label: 'Student Shop', description: 'Kupi ili prodaj knjige i opremu', gradient: 'linear-gradient(135deg, #FF6B35, #FF8C5A)' },
  { path: '/housing', emoji: '🏠', label: 'Stanovi', description: 'Pronađi smještaj ili cimera', gradient: 'linear-gradient(135deg, #FFB800, #FFD04D)' },
  { path: '/tutoring', emoji: '📚', label: 'Instrukcije', description: 'Zakaži ili ponudi instrukcije', gradient: 'linear-gradient(135deg, #FF6B35, #FFB800)' },
  { path: '/companies', emoji: '🏢', label: 'Firme & Prakse', description: 'Pronađi praksu i ocijeni firmu', gradient: 'linear-gradient(135deg, #FFB800, #FF6B35)' },
  { path: '/materials', emoji: '📄', label: 'Materijali', description: 'Dijeli i preuzimaj skripte', gradient: 'linear-gradient(135deg, #FF8C5A, #FFD04D)' },
  { path: '/jobs', emoji: '💼', label: 'Student Jobs', description: 'Tražim i nudim studentske poslove', gradient: 'linear-gradient(135deg, #FF6B35, #FF8C5A)' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) { navigate('/login'); return }
    setUser(JSON.parse(stored))
  }, [])

  if (!user) return null

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Dobro jutro' : hour < 18 ? 'Dobar dan' : 'Dobro veče'

  return (
    <div style={{ minHeight: '100vh', background: '#EFEDE8' }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1C1C1E 0%, #2C2C2E 100%)',
        padding: '48px 32px 56px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 80% 50%, rgba(255,107,53,0.15), transparent 60%)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 20% 80%, rgba(255,184,0,0.08), transparent 50%)',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px' }}>
          <AnimatedBlur delay={0}>
            {user.verificationStatus === 'UNVERIFIED' && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '8px 16px', borderRadius: '100px', marginBottom: '20px',
                background: 'rgba(255,184,0,0.15)', color: '#FFB800',
                border: '1px solid rgba(255,184,0,0.3)', fontSize: '13px', fontWeight: '500',
              }}>
                ⚠️ Nalog nije verifikovan
              </div>
            )}
          </AnimatedBlur>

          <AnimatedSection delay={0.1} direction="up" distance={24}>
            <h1 style={{
              fontSize: 'clamp(28px, 4vw, 48px)',
              fontWeight: '900',
              color: 'white',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              marginBottom: '12px',
            }}>
              {greeting},{' '}
              <span style={{
                background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {user.firstName}!
              </span>{' '}
              👋
            </h1>
          </AnimatedSection>

          <AnimatedSection delay={0.2} direction="up" distance={20}>
            <p style={{ color: '#8E8E93', fontSize: '18px', marginBottom: '32px' }}>
              Šta tražiš danas?
            </p>
          </AnimatedSection>

          <AnimatedLine delay={0.3} />
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 32px' }}>

        {/* Section label */}
        <AnimatedSection delay={0} direction="left">
          <p style={{
            fontSize: '11px', fontWeight: '700', letterSpacing: '0.12em',
            textTransform: 'uppercase', color: '#AEAEB2', marginBottom: '20px',
          }}>
            Moduli platforme
          </p>
        </AnimatedSection>

        {/* Grid modula */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '40px' }}>
          {MODULES.map((module, i) => (
            <AnimatedScale key={module.path} delay={i * 0.07}>
              <button
                onClick={() => navigate(module.path)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '20px',
                  borderRadius: '20px',
                  border: 'none',
                  background: '#FDFCF9',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)'
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
                }}
              >
                <div style={{
                  width: '48px', height: '48px', borderRadius: '16px',
                  background: module.gradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', marginBottom: '14px',
                  boxShadow: '0 4px 12px rgba(255,107,53,0.25)',
                }}>
                  {module.emoji}
                </div>
                <p style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '15px', marginBottom: '4px' }}>
                  {module.label}
                </p>
                <p style={{ color: '#8E8E93', fontSize: '13px', lineHeight: '1.4' }}>
                  {module.description}
                </p>
              </button>
            </AnimatedScale>
          ))}
        </div>

        <AnimatedLine />

        {/* Quick links */}
        <AnimatedSection delay={0.1} direction="up" style={{ marginTop: '32px' }}>
          <p style={{
            fontSize: '11px', fontWeight: '700', letterSpacing: '0.12em',
            textTransform: 'uppercase', color: '#AEAEB2', marginBottom: '16px',
          }}>
            Brzi pristup
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {[
              { icon: '📍', label: 'Sarajevo', sub: 'Lokacija' },
              { icon: '🎓', label: 'KOLEGA', sub: 'Student Hub' },
              { icon: '👥', label: 'Zajednica', sub: 'Studenata' },
            ].map((stat, i) => (
              <AnimatedSection key={i} delay={0.15 + i * 0.08} direction="up">
                <div style={{
                  background: '#FDFCF9',
                  borderRadius: '16px',
                  padding: '16px',
                  textAlign: 'center',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}>
                  <p style={{ fontSize: '24px', marginBottom: '6px' }}>{stat.icon}</p>
                  <p style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '14px' }}>{stat.label}</p>
                  <p style={{ color: '#AEAEB2', fontSize: '12px', marginTop: '2px' }}>{stat.sub}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </div>
  )
}