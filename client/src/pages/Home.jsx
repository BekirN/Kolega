import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatedSection, AnimatedScale, AnimatedBlur } from '../components/Animated'

// Preview sadržaj za svaki modul
const MODULES = [
  {
    path: '/shop',
    emoji: '🛍️',
    label: 'Prodavnica',
    description: 'Kupi ili prodaj knjige i opremu',
    gradient: 'linear-gradient(135deg, #FF6B35, #FF8C5A)',
    accentColor: '#FF6B35',
    size: 'large', // large | medium | small
    preview: [
      { icon: '📚', text: 'Matematika 1', price: '15 KM' },
      { icon: '💻', text: 'Laptop stiker', price: '3 KM' },
      { icon: '📓', text: 'Bilježnica', price: '5 KM' },
    ],
    tag: 'Novo',
    tagColor: '#FF6B35',
  },
  {
    path: '/housing',
    emoji: '🏠',
    label: 'Stanovi',
    description: 'Pronađi smještaj ili cimera',
    gradient: 'linear-gradient(135deg, #7C3AED, #A855F7)',
    accentColor: '#7C3AED',
    size: 'medium',
    preview: [
      { icon: '🏢', text: 'Garsonjera, Centar', price: '450 KM' },
      { icon: '🛏️', text: 'Soba, Grbavica', price: '220 KM' },
    ],
    tag: 'Cimerstvo',
    tagColor: '#7C3AED',
  },
  {
    path: '/tutoring',
    emoji: '📚',
    label: 'Instrukcije',
    description: 'Zakaži ili ponudi instrukcije',
    gradient: 'linear-gradient(135deg, #FFB800, #FFD04D)',
    accentColor: '#FFB800',
    size: 'medium',
    preview: [
      { icon: '🧮', text: 'Matematička analiza', price: '20 KM/h' },
      { icon: '⚡', text: 'Elektrotehnike', price: '25 KM/h' },
    ],
    tag: 'Popularno',
    tagColor: '#FFB800',
  },
  {
    path: '/companies',
    emoji: '🏢',
    label: 'Firme & Prakse',
    description: 'Pronađi praksu i ocijeni firmu',
    gradient: 'linear-gradient(135deg, #0EA5E9, #38BDF8)',
    accentColor: '#0EA5E9',
    size: 'small',
    preview: [
      { icon: '⭐', text: '4.8 prosječna ocjena' },
      { icon: '🏆', text: '24 firme u bazi' },
    ],
    tag: 'Prakse',
    tagColor: '#0EA5E9',
  },
  {
    path: '/materials',
    emoji: '📄',
    label: 'Materijali',
    description: 'Dijeli i preuzimaj skripte',
    gradient: 'linear-gradient(135deg, #16A34A, #4ADE80)',
    accentColor: '#16A34A',
    size: 'small',
    preview: [
      { icon: '📄', text: 'Skripta Fizika 2' },
      { icon: '📊', text: 'Prezentacije PMF' },
    ],
    tag: 'Biblioteka',
    tagColor: '#16A34A',
  },
  {
    path: '/jobs',
    emoji: '💼',
    label: 'Studentski poslovi',
    description: 'Tražim i nudim studentske poslove',
    gradient: 'linear-gradient(135deg, #EC4899, #F472B6)',
    accentColor: '#EC4899',
    size: 'large',
    preview: [
      { icon: '🍽️', text: 'Konobar vikendom', price: '8 KM/h' },
      { icon: '💻', text: 'React developer', price: '15 KM/h' },
      { icon: '📢', text: 'Promoter, Centar', price: '10 KM/h' },
    ],
    tag: 'Novo',
    tagColor: '#EC4899',
  },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [hoveredCard, setHoveredCard] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const cardRefs = useRef({})

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) { navigate('/login'); return }
    setUser(JSON.parse(stored))
  }, [])

  const handleMouseMove = (e, path) => {
    const card = cardRefs.current[path]
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setMousePos({ x, y })
  }

  if (!user) return null

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Dobro jutro' : hour < 18 ? 'Dobar dan' : 'Dobro veče'
  const greetingEmoji = hour < 12 ? '☀️' : hour < 18 ? '👋' : '🌙'

  return (
    <div style={{ minHeight: '100vh', background: '#EFEDE8' }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(160deg, #1C1C1E 0%, #2C1810 50%, #1C1C1E 100%)',
        padding: '48px 40px 60px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Dekoracija */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 85% 50%, rgba(255,107,53,0.18), transparent 55%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 15% 80%, rgba(255,184,0,0.1), transparent 50%)' }} />

        {/* Grain */}
        <div style={{
          position: 'absolute', inset: '-50%', width: '200%', height: '200%', opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '860px' }}>
          <AnimatedBlur delay={0}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              {user.verificationStatus === 'UNVERIFIED' && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '6px 14px', borderRadius: '100px',
                  background: 'rgba(255,184,0,0.15)', color: '#FFB800',
                  border: '1px solid rgba(255,184,0,0.3)', fontSize: '12px', fontWeight: '600',
                }}>
                  ⚠️ Nalog nije verifikovan
                </div>
              )}
            </div>

            <h1 style={{
              fontSize: 'clamp(32px, 4vw, 52px)',
              fontWeight: '900', color: 'white',
              letterSpacing: '-0.03em', lineHeight: 1.05,
              marginBottom: '10px',
            }}>
              {greeting}, {' '}
              <span style={{
                background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                {user.firstName}
              </span>
              {' '}{greetingEmoji}
            </h1>
            <p style={{ color: '#636366', fontSize: '17px' }}>
              Dobrodošao na KOLEGA · Student Hub Sarajevo
            </p>
          </AnimatedBlur>
        </div>
      </div>

      {/* Bento grid */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 32px 48px' }}>

        <AnimatedSection delay={0} direction="up">
          <p style={{
            fontSize: '11px', fontWeight: '700', letterSpacing: '0.14em',
            textTransform: 'uppercase', color: '#AEAEB2', marginBottom: '20px',
          }}>
            Platforma
          </p>
        </AnimatedSection>

        {/* BENTO GRID */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gridTemplateRows: 'auto',
          gap: '14px',
        }}>

          {/* Prodavnica – LARGE (4 kolone) */}
          <AnimatedScale delay={0.05} style={{ gridColumn: 'span 4' }}>
            <BentoCard
              module={MODULES[0]}
              hovered={hoveredCard === MODULES[0].path}
              mousePos={mousePos}
              onMouseEnter={() => setHoveredCard(MODULES[0].path)}
              onMouseLeave={() => setHoveredCard(null)}
              onMouseMove={(e) => handleMouseMove(e, MODULES[0].path)}
              ref={el => cardRefs.current[MODULES[0].path] = el}
              navigate={navigate}
              height="200px"
            />
          </AnimatedScale>

          {/* Stanovi – MEDIUM (2 kolone) */}
          <AnimatedScale delay={0.1} style={{ gridColumn: 'span 2' }}>
            <BentoCard
              module={MODULES[1]}
              hovered={hoveredCard === MODULES[1].path}
              mousePos={mousePos}
              onMouseEnter={() => setHoveredCard(MODULES[1].path)}
              onMouseLeave={() => setHoveredCard(null)}
              onMouseMove={(e) => handleMouseMove(e, MODULES[1].path)}
              ref={el => cardRefs.current[MODULES[1].path] = el}
              navigate={navigate}
              height="200px"
            />
          </AnimatedScale>

          {/* Materijali – SMALL (2 kolone) */}
          <AnimatedScale delay={0.15} style={{ gridColumn: 'span 2' }}>
            <BentoCard
              module={MODULES[4]}
              hovered={hoveredCard === MODULES[4].path}
              mousePos={mousePos}
              onMouseEnter={() => setHoveredCard(MODULES[4].path)}
              onMouseLeave={() => setHoveredCard(null)}
              onMouseMove={(e) => handleMouseMove(e, MODULES[4].path)}
              ref={el => cardRefs.current[MODULES[4].path] = el}
              navigate={navigate}
              height="180px"
            />
          </AnimatedScale>

          {/* Instrukcije – MEDIUM (2 kolone) */}
          <AnimatedScale delay={0.2} style={{ gridColumn: 'span 2' }}>
            <BentoCard
              module={MODULES[2]}
              hovered={hoveredCard === MODULES[2].path}
              mousePos={mousePos}
              onMouseEnter={() => setHoveredCard(MODULES[2].path)}
              onMouseLeave={() => setHoveredCard(null)}
              onMouseMove={(e) => handleMouseMove(e, MODULES[2].path)}
              ref={el => cardRefs.current[MODULES[2].path] = el}
              navigate={navigate}
              height="180px"
            />
          </AnimatedScale>

          {/* Firme & Prakse – SMALL (2 kolone) */}
          <AnimatedScale delay={0.25} style={{ gridColumn: 'span 2' }}>
            <BentoCard
              module={MODULES[3]}
              hovered={hoveredCard === MODULES[3].path}
              mousePos={mousePos}
              onMouseEnter={() => setHoveredCard(MODULES[3].path)}
              onMouseLeave={() => setHoveredCard(null)}
              onMouseMove={(e) => handleMouseMove(e, MODULES[3].path)}
              ref={el => cardRefs.current[MODULES[3].path] = el}
              navigate={navigate}
              height="180px"
            />
          </AnimatedScale>

          {/* Studentski poslovi – LARGE (6 kolona – cijeli red) */}
          <AnimatedScale delay={0.3} style={{ gridColumn: 'span 6' }}>
            <BentoCard
              module={MODULES[5]}
              hovered={hoveredCard === MODULES[5].path}
              mousePos={mousePos}
              onMouseEnter={() => setHoveredCard(MODULES[5].path)}
              onMouseLeave={() => setHoveredCard(null)}
              onMouseMove={(e) => handleMouseMove(e, MODULES[5].path)}
              ref={el => cardRefs.current[MODULES[5].path] = el}
              navigate={navigate}
              height="160px"
              wide
            />
          </AnimatedScale>
        </div>

        {/* Stats bar */}
        <AnimatedSection delay={0.35} direction="up" style={{ marginTop: '20px' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
          }}>
            {[
              { icon: '📍', label: 'Sarajevo', sub: 'Student Hub' },
              { icon: '🎓', label: user.faculty || 'Student', sub: user.university || 'KOLEGA platforma' },
              { icon: '🤝', label: 'Zajednica', sub: 'Studenata Sarajeva' },
            ].map((stat, i) => (
              <div key={i} style={{
                background: '#FDFCF9', borderRadius: '16px', padding: '14px 18px',
                display: 'flex', alignItems: 'center', gap: '12px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              }}>
                <span style={{ fontSize: '22px' }}>{stat.icon}</span>
                <div>
                  <p style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '14px' }}>{stat.label}</p>
                  <p style={{ color: '#AEAEB2', fontSize: '12px', marginTop: '1px' }}>{stat.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) rotate(25deg); }
          100% { transform: translateX(300%) rotate(25deg); }
        }
      `}</style>
    </div>
  )
}

// ─── BENTO CARD ───────────────────────────────────────────────────
import { forwardRef } from 'react'

const BentoCard = forwardRef(({
  module, hovered, mousePos, onMouseEnter,
  onMouseLeave, onMouseMove, navigate, height, wide
}, ref) => {

  return (
    <div
      ref={ref}
      onClick={() => navigate(module.path)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMove}
      style={{
        height,
        borderRadius: '20px',
        padding: '20px',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        background: '#FDFCF9',
        boxShadow: hovered
          ? `0 20px 40px rgba(0,0,0,0.12), 0 0 0 1.5px ${module.accentColor}40`
          : '0 2px 8px rgba(0,0,0,0.06)',
        transform: hovered ? 'translateY(-4px) scale(1.005)' : 'none',
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease',
        display: 'flex',
        flexDirection: wide ? 'row' : 'column',
        gap: wide ? '24px' : '0',
        alignItems: wide ? 'center' : 'flex-start',
      }}
    >
      {/* Spotlight efekat */}
      {hovered && (
        <div style={{
          position: 'absolute',
          width: '200px', height: '200px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${module.accentColor}18 0%, transparent 70%)`,
          left: `${mousePos.x}%`,
          top: `${mousePos.y}%`,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          transition: 'left 0.1s, top 0.1s',
        }} />
      )}

      {/* Shimmer efekat pri hoveru */}
      {hovered && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)',
          animation: 'shimmer 0.6s ease-out',
          pointerEvents: 'none',
        }} />
      )}

      {/* Gornji lijevi detalj */}
      <div style={{
        position: 'absolute', top: '-20px', right: '-20px',
        width: '80px', height: '80px', borderRadius: '50%',
        background: module.gradient,
        opacity: 0.08,
        transition: 'opacity 0.3s, transform 0.3s',
        transform: hovered ? 'scale(1.5)' : 'scale(1)',
      }} />

      {/* Emoji ikona */}
      <div style={{
        width: wide ? '56px' : '44px',
        height: wide ? '56px' : '44px',
        borderRadius: '14px',
        background: module.gradient,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: wide ? '26px' : '20px',
        flexShrink: 0,
        boxShadow: `0 4px 14px ${module.accentColor}40`,
        marginBottom: wide ? 0 : '12px',
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: hovered ? 'scale(1.1) rotate(-3deg)' : 'scale(1)',
      }}>
        {module.emoji}
      </div>

      {/* Tekst i preview */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <p style={{
              fontWeight: '800', color: '#1C1C1E',
              fontSize: wide ? '17px' : '15px',
              letterSpacing: '-0.01em',
            }}>
              {module.label}
            </p>
            <span style={{
              fontSize: '10px', fontWeight: '700',
              padding: '2px 8px', borderRadius: '100px',
              background: `${module.accentColor}18`,
              color: module.accentColor,
            }}>
              {module.tag}
            </span>
          </div>

          {/* Arrow */}
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: hovered ? module.accentColor : '#F0EDE8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.25s',
            flexShrink: 0,
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke={hovered ? 'white' : '#AEAEB2'} strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        <p style={{
          color: '#8E8E93', fontSize: '12px', marginBottom: '12px',
          display: wide ? 'block' : '-webkit-box',
          WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {module.description}
        </p>

        {/* Preview kartice */}
        {module.preview && (
          <div style={{
            display: 'flex', gap: '6px',
            flexWrap: wide ? 'nowrap' : 'wrap',
          }}>
            {module.preview.slice(0, wide ? 3 : 2).map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '5px 10px', borderRadius: '10px',
                background: hovered ? `${module.accentColor}10` : '#F5F3EF',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: '12px' }}>{item.icon}</span>
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#3A3A3C', whiteSpace: 'nowrap' }}>
                  {item.text}
                </span>
                {item.price && (
                  <span style={{
                    fontSize: '11px', fontWeight: '800',
                    color: module.accentColor, marginLeft: '2px',
                  }}>
                    {item.price}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
})

BentoCard.displayName = 'BentoCard'