import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPosts, createPost, deletePost, createComment } from '../api/community'

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  if (seconds < 60) return 'upravo'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  return `${Math.floor(seconds / 86400)}d`
}

const CATEGORY_STYLES = {
  OBAVJESTENJE: { bg: 'rgba(37,99,235,0.12)', color: '#60A5FA', label: '📣 Obavještenje' },
  PITANJE: { bg: 'rgba(124,58,237,0.12)', color: '#A78BFA', label: '❓ Pitanje' },
  DISKUSIJA: { bg: 'rgba(22,163,74,0.12)', color: '#4ADE80', label: '💬 Diskusija' },
  OGLAS: { bg: 'rgba(255,107,53,0.15)', color: '#FF6B35', label: '📢 Oglas' },
  OSTALO: { bg: 'rgba(255,255,255,0.08)', color: '#8E8E93', label: '✨ Objava' },
}

export default function Home() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // Intro / scroll state
  const [scrollY, setScrollY] = useState(0)
  const [introPhase, setIntroPhase] = useState('idle') // idle | animating | done
  const [logoReady, setLogoReady] = useState(false)
  const containerRef = useRef(null)
  const hasTriggered = useRef(false)

  // Feed state
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [content, setContent] = useState('')
  const [selectedImages, setSelectedImages] = useState([])
  const [imagePreview, setImagePreview] = useState([])
  const [activeCategory, setActiveCategory] = useState('OSTALO')
  const [expandedPost, setExpandedPost] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const fileInputRef = useRef(null)

  // Logo mount animation
  useEffect(() => {
    setTimeout(() => setLogoReady(true), 100)
  }, [])

  // Scroll listener – trigger intro transition
  useEffect(() => {
    const handleScroll = (e) => {
      if (introPhase !== 'idle') return

      const scrolled = window.scrollY || document.documentElement.scrollTop
      setScrollY(scrolled)

      if (scrolled > 60 && !hasTriggered.current) {
        hasTriggered.current = true
        setIntroPhase('animating')
        // Lock scroll durante animación
        document.body.style.overflow = 'hidden'
        setTimeout(() => {
          setIntroPhase('done')
          document.body.style.overflow = ''
          window.scrollTo(0, 0)
        }, 1000)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [introPhase])

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true)
      try {
        const filters = activeCategory !== 'OSTALO' ? { category: activeCategory } : {}
        const data = await getPosts(filters)
        setPosts(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [activeCategory])

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 4) return
    setSelectedImages(files)
    setImagePreview(files.map(f => URL.createObjectURL(f)))
  }

  const handlePost = async () => {
    if (!content.trim()) return
    setPosting(true)
    try {
      const data = await createPost({ content, category: activeCategory, images: selectedImages })
      setPosts(prev => [data.post, ...prev])
      setContent('')
      setSelectedImages([])
      setImagePreview([])
    } catch (err) {
      console.error(err)
    } finally {
      setPosting(false)
    }
  }

  const handleDeletePost = async (postId) => {
    if (!confirm('Obrisati objavu?')) return
    try {
      await deletePost(postId)
      setPosts(prev => prev.filter(p => p.id !== postId))
    } catch (err) {
      console.error(err)
    }
  }

  const handleComment = async (postId) => {
    if (!commentText.trim()) return
    setCommentLoading(true)
    try {
      await createComment(postId, { content: commentText })
      setCommentText('')
      const filters = activeCategory !== 'OSTALO' ? { category: activeCategory } : {}
      const data = await getPosts(filters)
      setPosts(data)
    } catch (err) {
      console.error(err)
    } finally {
      setCommentLoading(false)
    }
  }

  // ─── INTRO SCREEN ───────────────────────────────────────────────
  if (introPhase !== 'done') {
    const isAnimating = introPhase === 'animating'

    return (
      <>
        <style>{`
          @keyframes grain {
            0%, 100% { transform: translate(0, 0); }
            10% { transform: translate(-2%, -3%); }
            20% { transform: translate(3%, 2%); }
            30% { transform: translate(-1%, 4%); }
            40% { transform: translate(4%, -1%); }
            50% { transform: translate(-3%, 3%); }
            60% { transform: translate(2%, -4%); }
            70% { transform: translate(-4%, 1%); }
            80% { transform: translate(1%, -2%); }
            90% { transform: translate(3%, 4%); }
          }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(40px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes pulseRing {
            0% { transform: scale(0.8); opacity: 0.8; }
            100% { transform: scale(2.5); opacity: 0; }
          }
          @keyframes scrollBounce {
            0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.7; }
            50% { transform: translateX(-50%) translateY(8px); opacity: 0.3; }
          }
          @keyframes slideUp {
            from { transform: translateY(0); opacity: 1; }
            to { transform: translateY(-100vh); opacity: 0; }
          }
          @keyframes revealFeed {
            from { transform: translateY(80px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .intro-exit { animation: slideUp 0.9s cubic-bezier(0.76, 0, 0.24, 1) forwards; }
          .logo-enter { animation: fadeUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
          .tagline-enter { animation: fadeUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both; }
          .scroll-hint { animation: fadeIn 1s ease 1.5s both; }
          .scroll-bounce { animation: scrollBounce 1.8s ease-in-out infinite; }
        `}</style>

        <div
          className={isAnimating ? 'intro-exit' : ''}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#1C1C1E',
            overflow: 'hidden',
          }}
        >
          {/* Grain texture overlay */}
          <div style={{
            position: 'absolute',
            inset: '-50%',
            width: '200%',
            height: '200%',
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.06'/%3E%3C/svg%3E")`,
            animation: 'grain 0.5s steps(2) infinite',
            opacity: 0.4,
            pointerEvents: 'none',
          }} />

          {/* Ambient glow orbs */}
          <div style={{
            position: 'absolute',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,107,53,0.12) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            filter: 'blur(40px)',
          }} />
          <div style={{
            position: 'absolute',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,184,0,0.08) 0%, transparent 70%)',
            top: '30%',
            left: '60%',
            transform: 'translate(-50%, -50%)',
            filter: 'blur(60px)',
          }} />

          {/* Pulse rings */}
          {logoReady && [0, 0.4, 0.8].map((delay, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              border: '1px solid rgba(255,107,53,0.2)',
              animation: `pulseRing 2.4s ease-out ${delay}s infinite`,
            }} />
          ))}

          {/* Main content */}
          <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>

            {/* Logo mark */}
            {logoReady && (
              <div className="logo-enter" style={{ marginBottom: '24px' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '24px',
                  background: 'linear-gradient(135deg, #FF6B35 0%, #FFB800 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  boxShadow: '0 0 60px rgba(255,107,53,0.4)',
                }}>
                  <span style={{ color: 'white', fontWeight: '900', fontSize: '36px', lineHeight: 1 }}>K</span>
                </div>

                {/* Naziv */}
                <div style={{
                  fontSize: 'clamp(56px, 10vw, 100px)',
                  fontWeight: '900',
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  background: 'linear-gradient(135deg, #FFFFFF 0%, rgba(255,255,255,0.7) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '4px',
                }}>
                  KOLEGA
                </div>
              </div>
            )}

            {/* Tagline */}
            {logoReady && (
              <div className="tagline-enter">
                <p style={{
                  color: '#636366',
                  fontSize: '15px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontWeight: '500',
                  marginBottom: '6px',
                }}>
                  Student Hub · Sarajevo
                </p>
                <p style={{
                  color: '#48484A',
                  fontSize: '13px',
                  letterSpacing: '0.06em',
                }}>
                  Sve što trebaš kao student, na jednom mjestu
                </p>
              </div>
            )}
          </div>

          {/* Scroll hint */}
          {logoReady && (
            <div className="scroll-hint" style={{
              position: 'absolute',
              bottom: '48px',
              left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center',
            }}>
              <p style={{ color: '#48484A', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
                Skrolaj da uđeš
              </p>
              {/* Animated scroll line */}
              <div style={{
                width: '1px',
                height: '48px',
                background: 'linear-gradient(to bottom, rgba(255,107,53,0.8), transparent)',
                margin: '0 auto',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: '#FF6B35',
                  animation: 'scrollBounce 1.8s ease-in-out infinite',
                }} />
              </div>
            </div>
          )}

          {/* Horizontal lines decoration */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255,107,53,0.3), transparent)',
          }} />
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255,184,0,0.2), transparent)',
          }} />

          {/* Corner marks */}
          {[
            { top: '32px', left: '32px' },
            { top: '32px', right: '32px' },
            { bottom: '32px', left: '32px' },
            { bottom: '32px', right: '32px' },
          ].map((pos, i) => (
            <div key={i} style={{
              position: 'absolute',
              ...pos,
              width: '20px',
              height: '20px',
              borderTop: i < 2 ? '1px solid rgba(255,107,53,0.3)' : 'none',
              borderBottom: i >= 2 ? '1px solid rgba(255,107,53,0.3)' : 'none',
              borderLeft: (i === 0 || i === 2) ? '1px solid rgba(255,107,53,0.3)' : 'none',
              borderRight: (i === 1 || i === 3) ? '1px solid rgba(255,107,53,0.3)' : 'none',
            }} />
          ))}
        </div>

        {/* Invisible scroll trigger */}
        <div style={{ height: '200vh' }} />
      </>
    )
  }

  // ─── FEED ────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes revealFeed {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .feed-reveal { animation: revealFeed 0.7s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .post-card { animation: fadeSlideUp 0.4s ease-out both; }
      `}</style>

      <div style={{ background: '#EFEDE8', minHeight: '100vh' }} className="feed-reveal">

        {/* Feed header */}
        <div style={{
          background: 'linear-gradient(180deg, #1C1C1E 0%, #242424 100%)',
          padding: '32px 0 0',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}>
          <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 20px' }}>

            {/* Top bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ color: 'white', fontWeight: '900', fontSize: '14px' }}>K</span>
                </div>
                <span style={{ color: '#E5E5EA', fontWeight: '800', fontSize: '18px', letterSpacing: '-0.02em' }}>
                  Feed
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#636366', fontSize: '13px' }}>
                  Zdravo, {user.firstName} 👋
                </span>
              </div>
            </div>

            {/* Category filter tabs */}
            <div style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '16px',
              scrollbarWidth: 'none',
            }}>
              {[
                { value: 'OSTALO', label: '✨ Sve' },
                { value: 'PITANJE', label: '❓ Pitanja' },
                { value: 'OGLAS', label: '📢 Oglasi' },
                { value: 'DISKUSIJA', label: '💬 Diskusije' },
                { value: 'OBAVJESTENJE', label: '📣 Obavještenja' },
              ].map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  style={{
                    flexShrink: 0,
                    padding: '7px 16px',
                    borderRadius: '100px',
                    fontSize: '13px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: activeCategory === cat.value
                      ? 'linear-gradient(135deg, #FF6B35, #FFB800)'
                      : 'rgba(255,255,255,0.08)',
                    color: activeCategory === cat.value ? 'white' : '#8E8E93',
                  }}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feed content */}
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '20px' }}>

          {/* Compose */}
          <div style={{
            background: '#FDFCF9',
            borderRadius: '20px',
            padding: '16px',
            marginBottom: '16px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              {/* Avatar */}
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                flexShrink: 0, overflow: 'hidden',
              }}>
                {user.profileImage ? (
                  <img src={user.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: '700', fontSize: '14px',
                  }}>
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder={`Šta ima, ${user.firstName}? Podijeli nešto...`}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '15px',
                    color: '#1C1C1E',
                    resize: 'none',
                    minHeight: '64px',
                    fontFamily: 'inherit',
                    lineHeight: '1.5',
                  }}
                  rows={3}
                />

                {/* Image previews */}
                {imagePreview.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: imagePreview.length === 1 ? '1fr' : '1fr 1fr',
                    gap: '6px',
                    marginTop: '10px',
                  }}>
                    {imagePreview.map((src, i) => (
                      <div key={i} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '16/9' }}>
                        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          onClick={() => {
                            setImagePreview(p => p.filter((_, idx) => idx !== i))
                            setSelectedImages(p => p.filter((_, idx) => idx !== i))
                          }}
                          style={{
                            position: 'absolute', top: '6px', right: '6px',
                            width: '22px', height: '22px', borderRadius: '50%',
                            background: 'rgba(0,0,0,0.6)', color: 'white',
                            border: 'none', cursor: 'pointer', fontSize: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginTop: '12px', paddingTop: '12px',
                  borderTop: '1px solid #F0EDE8',
                }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '6px 12px', borderRadius: '100px', border: 'none',
                        background: '#FFF7ED', color: '#FF6B35', cursor: 'pointer',
                        fontSize: '13px', fontWeight: '600',
                      }}>
                      📷 Slika
                    </button>
                    <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />

                    <select
                      value={activeCategory}
                      onChange={e => setActiveCategory(e.target.value)}
                      style={{
                        padding: '6px 12px', borderRadius: '100px', border: 'none',
                        background: '#F0EDE8', color: '#6B7280', fontSize: '13px',
                        fontWeight: '500', cursor: 'pointer', outline: 'none',
                      }}>
                      <option value="OSTALO">📝 Ostalo</option>
                      <option value="PITANJE">❓ Pitanje</option>
                      <option value="OGLAS">📢 Oglas</option>
                      <option value="DISKUSIJA">💬 Diskusija</option>
                      <option value="OBAVJESTENJE">📣 Obavještenje</option>
                    </select>
                  </div>

                  <button
                    onClick={handlePost}
                    disabled={!content.trim() || posting}
                    style={{
                      padding: '8px 20px', borderRadius: '100px', border: 'none',
                      background: content.trim()
                        ? 'linear-gradient(135deg, #FF6B35, #FFB800)'
                        : '#E5E5EA',
                      color: content.trim() ? 'white' : '#AEAEB2',
                      fontSize: '14px', fontWeight: '700', cursor: content.trim() ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s',
                    }}>
                    {posting ? '...' : 'Objavi'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Posts */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                border: '2px solid #FF6B35', borderTopColor: 'transparent',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto',
              }} />
            </div>
          ) : posts.length === 0 ? (
            <div style={{
              background: '#FDFCF9', borderRadius: '20px', padding: '48px',
              textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}>
              <p style={{ fontSize: '40px', marginBottom: '12px' }}>🌟</p>
              <p style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '18px', marginBottom: '6px' }}>
                Budi prvi!
              </p>
              <p style={{ color: '#8E8E93', fontSize: '14px' }}>
                Napiši prvu objavu i pokreni razgovor
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {posts.map((post, index) => (
                <PostCard
                  key={post.id}
                  post={post}
                  user={user}
                  index={index}
                  expandedPost={expandedPost}
                  setExpandedPost={setExpandedPost}
                  commentText={commentText}
                  setCommentText={setCommentText}
                  commentLoading={commentLoading}
                  handleComment={handleComment}
                  handleDeletePost={handleDeletePost}
                  navigate={navigate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─── POST CARD ────────────────────────────────────────────────────
function PostCard({
  post, user, index, expandedPost, setExpandedPost,
  commentText, setCommentText, commentLoading,
  handleComment, handleDeletePost, navigate
}) {
  const isExpanded = expandedPost === post.id
  const isOwnPost = post.authorId === user.id
  const catStyle = CATEGORY_STYLES[post.category] || CATEGORY_STYLES.OSTALO

  return (
    <div
      className="post-card"
      style={{
        background: '#FDFCF9',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        animationDelay: `${index * 0.04}s`,
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'}
    >
      {/* Post header */}
      <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', flexShrink: 0 }}
            onClick={() => navigate(`/profile/${post.authorId}`)}>
            {post.author?.profileImage ? (
              <img src={post.author.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: '700', fontSize: '14px',
              }}>
                {post.author?.firstName?.[0]}{post.author?.lastName?.[0]}
              </div>
            )}
          </div>
          <div>
            <p
              style={{ fontWeight: '700', color: '#1C1C1E', fontSize: '14px', cursor: 'pointer' }}
              onClick={() => navigate(`/profile/${post.authorId}`)}>
              {post.author?.firstName} {post.author?.lastName}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              {post.author?.faculty && (
                <span style={{ color: '#AEAEB2', fontSize: '12px' }}>{post.author.faculty}</span>
              )}
              <span style={{ color: '#3A3A3C', fontSize: '12px' }}>·</span>
              <span style={{ color: '#AEAEB2', fontSize: '12px' }}>{timeAgo(post.createdAt)}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '100px',
            background: catStyle.bg, color: catStyle.color,
          }}>
            {catStyle.label}
          </span>
          {isOwnPost && (
            <button
              onClick={() => handleDeletePost(post.id)}
              style={{
                padding: '6px', borderRadius: '8px', border: 'none', background: 'transparent',
                color: '#C7C7CC', cursor: 'pointer', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#FFF0ED'; e.currentTarget.style.color = '#FF3B30' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#C7C7CC' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '0 16px 12px' }}>
        {post.title && (
          <p style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '16px', marginBottom: '6px' }}>
            {post.title}
          </p>
        )}
        <p style={{ color: '#3A3A3C', fontSize: '15px', lineHeight: '1.55', whiteSpace: 'pre-wrap' }}>
          {post.content}
        </p>
      </div>

      {/* Images */}
      {post.images?.length > 0 && (
        <div style={{
          padding: '0 16px 12px',
          display: 'grid',
          gap: '4px',
          gridTemplateColumns: post.images.length === 1 ? '1fr' : '1fr 1fr',
        }}>
          {post.images.slice(0, 4).map((img, i) => (
            <div key={i} style={{
              borderRadius: '12px', overflow: 'hidden',
              aspectRatio: post.images.length === 1 ? '16/9' : '1',
              gridColumn: post.images.length === 3 && i === 0 ? 'span 2' : 'auto',
              position: 'relative',
            }}>
              <img src={img} alt="" style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transition: 'transform 0.3s',
                cursor: 'pointer',
              }}
                onMouseEnter={e => e.target.style.transform = 'scale(1.03)'}
                onMouseLeave={e => e.target.style.transform = 'scale(1)'}
              />
              {post.images.length > 4 && i === 3 && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: '800', fontSize: '22px',
                }}>
                  +{post.images.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions bar */}
      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid #F0EDE8',
        display: 'flex', alignItems: 'center', gap: '4px',
      }}>
        <button
          onClick={() => setExpandedPost(isExpanded ? null : post.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '7px 14px', borderRadius: '100px', border: 'none', cursor: 'pointer',
            background: isExpanded ? '#FFF7ED' : 'transparent',
            color: isExpanded ? '#FF6B35' : '#8E8E93',
            fontSize: '13px', fontWeight: '600', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (!isExpanded) { e.currentTarget.style.background = '#F0EDE8'; e.currentTarget.style.color = '#3A3A3C' } }}
          onMouseLeave={e => { if (!isExpanded) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8E8E93' } }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {post._count?.comments || 0}
        </button>

        <button
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '7px 14px', borderRadius: '100px', border: 'none', cursor: 'pointer',
            background: 'transparent', color: '#8E8E93',
            fontSize: '13px', fontWeight: '600', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F0EDE8'; e.currentTarget.style.color = '#3A3A3C' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8E8E93' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Podijeli
        </button>
      </div>

      {/* Comments section */}
      {isExpanded && (
        <div style={{ padding: '12px 16px 16px', borderTop: '1px solid #F0EDE8' }}>
          {/* Comment input */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
              {user.profileImage ? (
                <img src={user.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: '700', fontSize: '12px',
                }}>
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
              )}
            </div>
            <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Napiši komentar..."
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleComment(post.id)}
                style={{
                  flex: 1, padding: '8px 14px', borderRadius: '100px',
                  border: '1.5px solid #E8E4DF', background: '#F0EDE8',
                  color: '#1C1C1E', fontSize: '13px', outline: 'none',
                  transition: 'border-color 0.15s',
                  fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = '#FF6B35'}
                onBlur={e => e.target.style.borderColor = '#E8E4DF'}
              />
              <button
                onClick={() => handleComment(post.id)}
                disabled={!commentText.trim() || commentLoading}
                style={{
                  padding: '8px 16px', borderRadius: '100px', border: 'none',
                  background: commentText.trim() ? 'linear-gradient(135deg, #FF6B35, #FFB800)' : '#E5E5EA',
                  color: commentText.trim() ? 'white' : '#AEAEB2',
                  fontSize: '13px', fontWeight: '700', cursor: commentText.trim() ? 'pointer' : 'not-allowed',
                }}>
                →
              </button>
            </div>
          </div>

          {/* Comments list */}
          {post.comments?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {post.comments.map(comment => (
                <div key={comment.id} style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                    {comment.author?.profileImage ? (
                      <img src={comment.author.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%',
                        background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: '700', fontSize: '11px',
                      }}>
                        {comment.author?.firstName?.[0]}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, background: '#F0EDE8', borderRadius: '14px', padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '700', color: '#1C1C1E', fontSize: '13px' }}>
                        {comment.author?.firstName} {comment.author?.lastName}
                      </span>
                      {comment.author?.faculty && (
                        <span style={{ color: '#AEAEB2', fontSize: '11px' }}>· {comment.author.faculty}</span>
                      )}
                      <span style={{ color: '#AEAEB2', fontSize: '11px' }}>· {timeAgo(comment.createdAt)}</span>
                    </div>
                    <p style={{ color: '#3A3A3C', fontSize: '13px', lineHeight: '1.45' }}>{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#AEAEB2', fontSize: '13px', padding: '12px 0' }}>
              Nema komentara · Budi prvi! 💬
            </p>
          )}
        </div>
      )}
    </div>
  )
}