import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getConversationMedia, leaveGroup } from '../api/chat'

export default function ChatDetails({ conversation, onClose, currentUser }) {
  const navigate = useNavigate()
  const [media, setMedia] = useState([])
  const [files, setFiles] = useState([])
  const [mediaTab, setMediaTab] = useState('slike')
  const [loading, setLoading] = useState(true)

  const isGroup = conversation?.isGroup
  const otherParticipant = !isGroup
    ? conversation?.participants?.find(p => p.user?.id !== currentUser?.id)?.user
    : null

  useEffect(() => {
    const fetchMedia = async () => {
      if (!conversation) return
      setLoading(true)
      try {
        const data = await getConversationMedia(conversation.id)
        setMedia(data.filter(m => m.fileType === 'image'))
        setFiles(data.filter(m => m.fileType === 'file'))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchMedia()
  }, [conversation?.id])

  const handleLeaveGroup = async () => {
    if (!confirm('Jesi li siguran da želiš napustiti grupu?')) return
    try {
      await leaveGroup(conversation.id)
      onClose()
      navigate('/chat')
      window.location.reload()
    } catch (err) {
      console.error(err)
    }
  }

  if (!conversation) return null

  return (
    <div style={{
      width: '300px', flexShrink: 0,
      background: '#FDFCF9',
      borderLeft: '1px solid rgba(0,0,0,0.06)',
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
    }}>

      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <h3 style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '15px' }}>
          Detalji
        </h3>
        <button
          onClick={onClose}
          style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: '#EEEBE5', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#6B7280', fontSize: '14px', transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#E2DDD6'}
          onMouseLeave={e => e.currentTarget.style.background = '#EEEBE5'}
        >
          ✕
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* Profil info */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          textAlign: 'center',
        }}>
          {isGroup ? (
            <>
              <div style={{
                width: '72px', height: '72px', borderRadius: '20px',
                background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '32px', margin: '0 auto 12px',
                boxShadow: '0 4px 16px rgba(255,107,53,0.25)',
              }}>
                👥
              </div>
              <h2 style={{ fontWeight: '900', color: '#1C1C1E', fontSize: '17px', marginBottom: '4px' }}>
                {conversation.name}
              </h2>
              <p style={{ fontSize: '13px', color: '#8E8E93' }}>
                {conversation.participants?.length} članova
              </p>
            </>
          ) : (
            <>
              <div style={{
                width: '72px', height: '72px', borderRadius: '20px',
                overflow: 'hidden', margin: '0 auto 12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              }}>
                {otherParticipant?.profileImage ? (
                  <img src={otherParticipant.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: '900', fontSize: '24px',
                  }}>
                    {otherParticipant?.firstName?.[0]}{otherParticipant?.lastName?.[0]}
                  </div>
                )}
              </div>
              <h2 style={{ fontWeight: '900', color: '#1C1C1E', fontSize: '17px', marginBottom: '4px' }}>
                {otherParticipant?.firstName} {otherParticipant?.lastName}
              </h2>
              {otherParticipant?.faculty && (
                <p style={{ fontSize: '13px', color: '#8E8E93', marginBottom: '12px' }}>
                  {otherParticipant.faculty}
                </p>
              )}
              <button
                onClick={() => navigate(`/profile/${otherParticipant?.id}`)}
                style={{
                  padding: '8px 18px', borderRadius: '100px', border: 'none',
                  background: '#FFF7ED', color: '#FF6B35',
                  fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Pogledaj profil →
              </button>
            </>
          )}
        </div>

        {/* Članovi grupe */}
        {isGroup && (
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
          }}>
            <p style={{
              fontSize: '11px', fontWeight: '700', color: '#AEAEB2',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px',
            }}>
              Članovi ({conversation.participants?.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {conversation.participants?.map(p => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/profile/${p.user?.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 10px', borderRadius: '12px',
                    cursor: 'pointer', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#EEEBE5'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                    {p.user?.profileImage ? (
                      <img src={p.user.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%',
                        background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '12px', fontWeight: '700',
                      }}>
                        {p.user?.firstName?.[0]}{p.user?.lastName?.[0]}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: '#1C1C1E', marginBottom: '1px' }}>
                      {p.user?.firstName} {p.user?.lastName}
                      {p.user?.id === currentUser?.id && (
                        <span style={{ color: '#AEAEB2', fontWeight: '400' }}> (ti)</span>
                      )}
                    </p>
                    {p.user?.faculty && (
                      <p style={{ fontSize: '11px', color: '#AEAEB2' }}>{p.user.faculty}</p>
                    )}
                  </div>
                  {conversation.adminId === p.user?.id && (
                    <span style={{
                      fontSize: '10px', fontWeight: '700', padding: '2px 8px',
                      borderRadius: '100px',
                      background: 'rgba(255,107,53,0.1)', color: '#FF6B35',
                    }}>
                      Admin
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Media tabovi */}
        <div style={{ padding: '16px 20px' }}>
          <p style={{
            fontSize: '11px', fontWeight: '700', color: '#AEAEB2',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px',
          }}>
            Dijeljeni sadržaj
          </p>

          {/* Tab switcher */}
          <div style={{
            display: 'flex', gap: '6px', marginBottom: '14px',
            background: '#EEEBE5', padding: '4px', borderRadius: '12px',
          }}>
            {[
              { id: 'slike', label: `🖼️ Slike (${media.length})` },
              { id: 'fajlovi', label: `📎 Fajlovi (${files.length})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setMediaTab(tab.id)}
                style={{
                  flex: 1, padding: '7px', borderRadius: '9px', border: 'none',
                  background: mediaTab === tab.id ? '#FDFCF9' : 'transparent',
                  color: mediaTab === tab.id ? '#1C1C1E' : '#8E8E93',
                  fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                  boxShadow: mediaTab === tab.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s',
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#AEAEB2', fontSize: '13px' }}>
              <div style={{
                width: '20px', height: '20px', borderRadius: '50%',
                border: '2px solid #FF6B35', borderTopColor: 'transparent',
                animation: 'spin 0.8s linear infinite', margin: '0 auto 8px',
              }} />
              Učitavanje...
            </div>
          ) : mediaTab === 'slike' ? (
            media.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px' }}>
                <p style={{ fontSize: '28px', marginBottom: '8px' }}>🖼️</p>
                <p style={{ color: '#AEAEB2', fontSize: '13px' }}>Nema dijeljenih slika</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                {media.map(msg => (
                  
                  <a  key={msg.id}
                    href={msg.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      aspectRatio: '1', overflow: 'hidden', borderRadius: '10px',
                      display: 'block', transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    <img
                      src={msg.fileUrl}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </a>
                ))}
              </div>
            )
          ) : (
            files.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px' }}>
                <p style={{ fontSize: '28px', marginBottom: '8px' }}>📎</p>
                <p style={{ color: '#AEAEB2', fontSize: '13px' }}>Nema dijeljenih fajlova</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {files.map(msg => (
                  
                  <a   key={msg.id}
                    href={msg.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 12px', borderRadius: '12px',
                      background: '#EEEBE5', textDecoration: 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#E2DDD6'}
                    onMouseLeave={e => e.currentTarget.style.background = '#EEEBE5'}
                  >
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: '#FFF7ED', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      📄
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: '13px', fontWeight: '700', color: '#1C1C1E',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        marginBottom: '2px',
                      }}>
                        {msg.content}
                      </p>
                      <p style={{ fontSize: '11px', color: '#AEAEB2' }}>
                        {msg.sender?.firstName} · {new Date(msg.createdAt).toLocaleDateString('bs-BA')}
                      </p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#AEAEB2" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Footer */}
      {isGroup && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          flexShrink: 0,
        }}>
          <button
            onClick={handleLeaveGroup}
            style={{
              width: '100%', padding: '10px', borderRadius: '12px', border: 'none',
              background: 'rgba(255,59,48,0.08)', color: '#FF3B30',
              fontSize: '13px', fontWeight: '700', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,59,48,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,59,48,0.08)'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Napusti grupu
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}