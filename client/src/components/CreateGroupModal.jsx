import { useState, useEffect } from 'react'
import { searchUsers } from '../api/auth'
import { createGroupChat } from '../api/chat'

export default function CreateGroupModal({ onClose, onCreated }) {
  const [groupName, setGroupName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setSearching(true)
        try {
          const results = await searchUsers(searchQuery)
          setSearchResults(results.filter(u => !selectedUsers.find(s => s.id === u.id)))
        } catch (err) {
          console.error(err)
        } finally {
          setSearching(false)
        }
      } else {
        setSearchResults([])
      }
    }, 300)
    return () => clearTimeout(delay)
  }, [searchQuery, selectedUsers])

  const toggleUser = (user) => {
    if (selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== user.id))
    } else {
      setSelectedUsers([...selectedUsers, user])
    }
  }

  const handleCreate = async () => {
    if (!groupName.trim() || selectedUsers.length < 2) return
    setLoading(true)
    try {
      const conv = await createGroupChat({
        name: groupName,
        memberIds: selectedUsers.map(u => u.id)
      })
      onCreated(conv)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    background: '#EEEBE5', border: '1.5px solid #D8D4CC', color: '#1C1C1E',
    borderRadius: '12px', padding: '11px 14px', fontSize: '14px', width: '100%',
    outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box',
    fontFamily: 'inherit',
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FDFCF9', borderRadius: '24px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
          width: '100%', maxWidth: '440px',
          overflow: 'hidden',
          animation: 'scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.92); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>

        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px',
            }}>
              👥
            </div>
            <h2 style={{ fontWeight: '900', color: '#1C1C1E', fontSize: '17px' }}>
              Nova grupa
            </h2>
          </div>
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

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Naziv grupe */}
          <div>
            <label style={{
              fontSize: '12px', fontWeight: '700', color: '#6B7280',
              marginBottom: '8px', display: 'block',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              Naziv grupe *
            </label>
            <input
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="npr. Informatika 3. godina"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#FF6B35'}
              onBlur={e => e.target.style.borderColor = '#D8D4CC'}
            />
          </div>

          {/* Odabrani korisnici */}
          {selectedUsers.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {selectedUsers.map(u => (
                <span
                  key={u.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '5px 10px 5px 12px', borderRadius: '100px',
                    background: 'rgba(255,107,53,0.12)', color: '#FF6B35',
                    fontSize: '13px', fontWeight: '700',
                    border: '1px solid rgba(255,107,53,0.25)',
                  }}
                >
                  {u.firstName} {u.lastName}
                  <button
                    onClick={() => toggleUser(u)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#FF6B35', fontSize: '14px', lineHeight: 1,
                      padding: '0', opacity: 0.7,
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Pretraga */}
          <div>
            <label style={{
              fontSize: '12px', fontWeight: '700', color: '#6B7280',
              marginBottom: '8px', display: 'block',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              Dodaj članove *
              <span style={{ color: '#AEAEB2', fontWeight: '400', textTransform: 'none', letterSpacing: 0, marginLeft: '6px', fontSize: '11px' }}>
                (min. 2)
              </span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Pretraži studente..."
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#FF6B35'}
                onBlur={e => e.target.style.borderColor = '#D8D4CC'}
              />
              {searching && (
                <div style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  width: '16px', height: '16px', borderRadius: '50%',
                  border: '2px solid #FF6B35', borderTopColor: 'transparent',
                  animation: 'spin 0.8s linear infinite',
                }} />
              )}
            </div>

            {/* Rezultati */}
            {searchResults.length > 0 && (
              <div style={{
                marginTop: '8px', borderRadius: '14px', overflow: 'hidden',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              }}>
                {searchResults.map((u, i) => {
                  const isSelected = !!selectedUsers.find(s => s.id === u.id)
                  return (
                    <button
                      key={u.id}
                      onClick={() => toggleUser(u)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 14px', textAlign: 'left', border: 'none',
                        background: isSelected ? 'rgba(255,107,53,0.06)' : '#FDFCF9',
                        borderBottom: i < searchResults.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                        cursor: 'pointer', transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#EEEBE5' }}
                      onMouseLeave={e => { e.currentTarget.style.background = isSelected ? 'rgba(255,107,53,0.06)' : '#FDFCF9' }}
                    >
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                        {u.profileImage ? (
                          <img src={u.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{
                            width: '100%', height: '100%',
                            background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: '12px', fontWeight: '700',
                          }}>
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#1C1C1E' }}>
                          {u.firstName} {u.lastName}
                        </p>
                        {u.faculty && (
                          <p style={{ fontSize: '12px', color: '#AEAEB2' }}>{u.faculty}</p>
                        )}
                      </div>
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${isSelected ? '#FF6B35' : '#D8D4CC'}`,
                        background: isSelected ? '#FF6B35' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}>
                        {isSelected && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          display: 'flex', gap: '10px',
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '12px', borderRadius: '14px', border: 'none',
              background: '#EEEBE5', color: '#6B7280',
              fontSize: '14px', fontWeight: '700', cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Odustani
          </button>
          <button
            onClick={handleCreate}
            disabled={!groupName.trim() || selectedUsers.length < 2 || loading}
            style={{
              flex: 2, padding: '12px', borderRadius: '14px', border: 'none',
              background: !groupName.trim() || selectedUsers.length < 2 || loading
                ? '#D8D4CC'
                : 'linear-gradient(135deg, #FF6B35, #FFB800)',
              color: !groupName.trim() || selectedUsers.length < 2 || loading
                ? '#AEAEB2' : 'white',
              fontSize: '14px', fontWeight: '800',
              cursor: !groupName.trim() || selectedUsers.length < 2 || loading
                ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: groupName.trim() && selectedUsers.length >= 2 && !loading
                ? '0 4px 16px rgba(255,107,53,0.3)' : 'none',
              transition: 'all 0.2s',
            }}>
            {loading ? (
              <>
                <div style={{
                  width: '14px', height: '14px', borderRadius: '50%',
                  border: '2px solid white', borderTopColor: 'transparent',
                  animation: 'spin 0.8s linear infinite',
                }} />
                Kreiranje...
              </>
            ) : (
              `👥 Kreiraj grupu${selectedUsers.length >= 2 ? ` (${selectedUsers.length})` : ''}`
            )}
          </button>
        </div>
      </div>
    </div>
  )
}