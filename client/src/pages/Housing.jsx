import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getListings, deleteListing } from '../api/housing'
import { AnimatedSection, AnimatedScale, AnimatedBlur, AnimatedLine } from '../components/Animated'

const TYPE_LABELS = {
  APARTMAN: { label: 'Apartman', emoji: '🏢' },
  SOBA: { label: 'Soba', emoji: '🛏️' },
  GARSONJERA: { label: 'Garsonjera', emoji: '🏠' },
  CIMER: { label: 'Tražim cimera', emoji: '👥' },
}

const TYPE_COLORS = {
  APARTMAN: { bg: 'rgba(37,99,235,0.1)', color: '#2563EB' },
  SOBA: { bg: 'rgba(255,107,53,0.1)', color: '#FF6B35' },
  GARSONJERA: { bg: 'rgba(124,58,237,0.1)', color: '#7C3AED' },
  CIMER: { bg: 'rgba(22,163,74,0.1)', color: '#16A34A' },
}

const CITIES = ['Sarajevo', 'Mostar', 'Banja Luka', 'Tuzla', 'Zenica', 'Bijeljina', 'Trebinje']

export default function Housing() {
  const navigate = useNavigate()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedListing, setSelectedListing] = useState(null)
  const [activeType, setActiveType] = useState('')
  const [activeCity, setActiveCity] = useState('')
  const [furnished, setFurnished] = useState(false)
  const [roommateOnly, setRoommateOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const fetchListings = async () => {
    setLoading(true)
    try {
      const filters = {}
      if (activeType) filters.type = activeType
      if (activeCity) filters.city = activeCity
      if (furnished) filters.furnished = true
      if (roommateOnly) filters.lookingForRoommate = true
      if (search) filters.search = search
      if (maxPrice) filters.maxPrice = maxPrice
      const data = await getListings(filters)
      setListings(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchListings() }, [activeType, activeCity, furnished, roommateOnly])

  const handleDelete = async (id) => {
    if (!confirm('Obrisati oglas?')) return
    try {
      await deleteListing(id)
      setListings(prev => prev.filter(l => l.id !== id))
      if (selectedListing?.id === id) setSelectedListing(null)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#EFEDE8' }}>

      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1C1C1E 0%, #1C1C2E 60%, #1C1C1E 100%)',
        padding: '40px 32px 32px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(124,58,237,0.15), transparent 60%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 30%, rgba(255,107,53,0.1), transparent 50%)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <AnimatedBlur delay={0}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '6px 14px', borderRadius: '100px', marginBottom: '14px',
                  background: 'rgba(255,107,53,0.15)', color: '#FF6B35',
                  border: '1px solid rgba(255,107,53,0.3)', fontSize: '12px', fontWeight: '600',
                }}>
                  🏠 Studentski smještaj
                </div>
                <h1 style={{
                  fontSize: '32px', fontWeight: '900', color: 'white',
                  letterSpacing: '-0.02em', marginBottom: '8px',
                }}>
                  Pronađi stan ili{' '}
                  <span style={{
                    background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>
                    cimera
                  </span>
                </h1>
                <p style={{ color: '#8E8E93', fontSize: '15px' }}>
                  Apartmani, sobe i garsonjere za studente · Cimerstvo
                </p>
              </div>
              <button
                onClick={() => navigate('/housing/new')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 20px', borderRadius: '14px', border: 'none',
                  background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                  color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
                  flexShrink: 0, boxShadow: '0 4px 16px rgba(255,107,53,0.3)',
                }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Objavi oglas
              </button>
            </div>
          </AnimatedBlur>

          {/* Search + filteri */}
          <AnimatedSection delay={0.1} direction="up">
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#636366' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchListings()}
                  placeholder="Pretraži po gradu, lokaciji..."
                  style={{
                    width: '100%', padding: '11px 16px 11px 42px', borderRadius: '12px',
                    background: '#2C2C2E', color: '#E5E5EA', border: '1px solid #3A3A3C',
                    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              <input
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                placeholder="Max cijena (KM)"
                type="number"
                style={{
                  width: '160px', padding: '11px 16px', borderRadius: '12px',
                  background: '#2C2C2E', color: '#E5E5EA', border: '1px solid #3A3A3C',
                  fontSize: '14px', outline: 'none',
                }}
              />
              <button onClick={fetchListings} style={{
                padding: '11px 20px', borderRadius: '12px', border: 'none',
                background: '#FF6B35', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
              }}>
                Traži
              </button>
            </div>

            {/* Filter chips */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {/* Tip */}
              {Object.entries(TYPE_LABELS).map(([key, val]) => (
                <button key={key} onClick={() => setActiveType(activeType === key ? '' : key)} style={{
                  padding: '7px 14px', borderRadius: '100px', border: 'none', cursor: 'pointer',
                  background: activeType === key ? '#FF6B35' : 'rgba(255,255,255,0.08)',
                  color: activeType === key ? 'white' : '#8E8E93',
                  fontSize: '13px', fontWeight: '600', transition: 'all 0.2s',
                }}>
                  {val.emoji} {val.label}
                </button>
              ))}

              <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

              {/* Namješteno */}
              <button onClick={() => setFurnished(!furnished)} style={{
                padding: '7px 14px', borderRadius: '100px', border: 'none', cursor: 'pointer',
                background: furnished ? '#FFB800' : 'rgba(255,255,255,0.08)',
                color: furnished ? '#1C1C1E' : '#8E8E93',
                fontSize: '13px', fontWeight: '600', transition: 'all 0.2s',
              }}>
                🛋️ Namješteno
              </button>

              {/* Tražim cimera */}
              <button onClick={() => setRoommateOnly(!roommateOnly)} style={{
                padding: '7px 14px', borderRadius: '100px', border: 'none', cursor: 'pointer',
                background: roommateOnly ? '#16A34A' : 'rgba(255,255,255,0.08)',
                color: roommateOnly ? 'white' : '#8E8E93',
                fontSize: '13px', fontWeight: '600', transition: 'all 0.2s',
              }}>
                👥 Tražim cimera
              </button>

              <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

              {/* Gradovi */}
              {CITIES.map(city => (
                <button key={city} onClick={() => setActiveCity(activeCity === city ? '' : city)} style={{
                  padding: '7px 14px', borderRadius: '100px', border: 'none', cursor: 'pointer',
                  background: activeCity === city ? '#2563EB' : 'rgba(255,255,255,0.06)',
                  color: activeCity === city ? 'white' : '#636366',
                  fontSize: '13px', fontWeight: '600', transition: 'all 0.2s',
                }}>
                  📍 {city}
                </button>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '28px 32px' }}>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #FF6B35', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : listings.length === 0 ? (
          <AnimatedScale>
            <div style={{ background: '#FDFCF9', borderRadius: '24px', padding: '64px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</p>
              <p style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '20px', marginBottom: '8px' }}>Nema oglasa</p>
              <p style={{ color: '#8E8E93', marginBottom: '24px' }}>Budi prvi koji objavljuje smještaj!</p>
              <button onClick={() => navigate('/housing/new')} style={{
                padding: '12px 28px', borderRadius: '14px', border: 'none',
                background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                color: 'white', fontWeight: '700', cursor: 'pointer',
              }}>
                Objavi oglas
              </button>
            </div>
          </AnimatedScale>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: selectedListing ? '1fr 1.4fr' : '1fr', gap: '20px' }}>

            {/* Lista oglasa */}
            <div>
              <AnimatedSection delay={0}>
                <p style={{ fontSize: '13px', color: '#AEAEB2', fontWeight: '600', marginBottom: '16px' }}>
                  {listings.length} oglasa
                </p>
              </AnimatedSection>

              <div style={{
                display: 'grid',
                gridTemplateColumns: selectedListing ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '14px',
              }}>
                {listings.map((listing, i) => (
                  <AnimatedSection key={listing.id} delay={i * 0.05} direction="up">
                    <div
                      onClick={() => setSelectedListing(selectedListing?.id === listing.id ? null : listing)}
                      style={{
                        background: '#FDFCF9',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        boxShadow: selectedListing?.id === listing.id
                          ? '0 0 0 2px #FF6B35, 0 8px 24px rgba(0,0,0,0.1)'
                          : '0 2px 8px rgba(0,0,0,0.06)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => {
                        if (selectedListing?.id !== listing.id)
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'
                      }}
                      onMouseLeave={e => {
                        if (selectedListing?.id !== listing.id)
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
                      }}
                    >
                      {/* Slika */}
                      <div style={{
                        height: selectedListing ? '160px' : '180px',
                        background: listing.images?.[0]
                          ? `url(${listing.images[0]}) center/cover`
                          : 'linear-gradient(135deg, #2C2C2E, #3A3A3C)',
                        position: 'relative',
                        overflow: 'hidden',
                      }}>
                        {!listing.images?.[0] && (
                          <div style={{
                            position: 'absolute', inset: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '48px',
                          }}>
                            {TYPE_LABELS[listing.type]?.emoji}
                          </div>
                        )}

                        {/* Badges */}
                        <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px' }}>
                          <span style={{
                            fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '100px',
                            background: TYPE_COLORS[listing.type]?.bg,
                            backdropFilter: 'blur(8px)',
                            color: TYPE_COLORS[listing.type]?.color,
                            border: `1px solid ${TYPE_COLORS[listing.type]?.color}40`,
                          }}>
                            {TYPE_LABELS[listing.type]?.emoji} {TYPE_LABELS[listing.type]?.label}
                          </span>
                          {listing.lookingForRoommate && (
                            <span style={{
                              fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '100px',
                              background: 'rgba(22,163,74,0.8)', color: 'white',
                            }}>
                              👥 Cimer
                            </span>
                          )}
                        </div>

                        {/* Cijena */}
                        <div style={{
                          position: 'absolute', bottom: '12px', right: '12px',
                          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                          padding: '6px 12px', borderRadius: '100px',
                        }}>
                          <span style={{ color: '#FFB800', fontWeight: '900', fontSize: '16px' }}>
                            {listing.price} KM
                          </span>
                          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>/mj.</span>
                        </div>

                        {/* Slike count */}
                        {listing.images?.length > 1 && (
                          <div style={{
                            position: 'absolute', bottom: '12px', left: '12px',
                            background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '8px',
                          }}>
                            <span style={{ color: 'white', fontSize: '11px' }}>
                              📷 {listing.images.length}
                            </span>
                          </div>
                        )}
                      </div>

                      <div style={{ padding: '14px 16px' }}>
                        <h3 style={{
                          fontWeight: '800', color: '#1C1C1E', fontSize: '15px', marginBottom: '6px',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {listing.title}
                        </h3>

                        {/* Lokacija */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                          <span style={{ fontSize: '13px', color: '#8E8E93' }}>
                            📍 {listing.city}{listing.municipality ? `, ${listing.municipality}` : ''}
                          </span>
                        </div>

                        {/* Features */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                          {listing.roomCount && (
                            <span style={{ fontSize: '12px', color: '#636366', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              🛏️ {listing.roomCount} soba
                            </span>
                          )}
                          {listing.squareMeters && (
                            <span style={{ fontSize: '12px', color: '#636366' }}>
                              📐 {listing.squareMeters}m²
                            </span>
                          )}
                          {listing.furnished && (
                            <span style={{ fontSize: '12px', color: '#636366' }}>🛋️ Namješteno</span>
                          )}
                          {listing.utilitiesIncluded && (
                            <span style={{ fontSize: '12px', color: '#636366' }}>💡 Računi uključeni</span>
                          )}
                        </div>

                        {/* Owner */}
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          paddingTop: '10px', borderTop: '1px solid #F0EDE8',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden' }}>
                              {listing.owner?.profileImage ? (
                                <img src={listing.owner.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{
                                  width: '100%', height: '100%',
                                  background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: 'white', fontSize: '10px', fontWeight: '700',
                                }}>
                                  {listing.owner?.firstName?.[0]}
                                </div>
                              )}
                            </div>
                            <span style={{ fontSize: '12px', color: '#8E8E93' }}>
                              {listing.owner?.firstName} {listing.owner?.lastName}
                            </span>
                          </div>
                          <span style={{ fontSize: '11px', color: '#AEAEB2' }}>
                            {new Date(listing.createdAt).toLocaleDateString('bs-BA')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </div>

            {/* Detail panel */}
            {selectedListing && (
              <AnimatedSection direction="left" delay={0}>
                <div style={{
                  background: '#FDFCF9', borderRadius: '24px', overflow: 'hidden',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
                  position: 'sticky', top: '20px',
                  maxHeight: 'calc(100vh - 100px)', overflowY: 'auto',
                }}>

                  {/* Galerija slika */}
                  {selectedListing.images?.length > 0 ? (
                    <div style={{ position: 'relative' }}>
                      <ImageGallery images={selectedListing.images} />
                    </div>
                  ) : (
                    <div style={{
                      height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'linear-gradient(135deg, #2C2C2E, #3A3A3C)',
                      fontSize: '64px',
                    }}>
                      {TYPE_LABELS[selectedListing.type]?.emoji}
                    </div>
                  )}

                  <div style={{ padding: '24px' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '12px', fontWeight: '700', padding: '4px 12px', borderRadius: '100px',
                            background: TYPE_COLORS[selectedListing.type]?.bg,
                            color: TYPE_COLORS[selectedListing.type]?.color,
                          }}>
                            {TYPE_LABELS[selectedListing.type]?.emoji} {TYPE_LABELS[selectedListing.type]?.label}
                          </span>
                          {selectedListing.lookingForRoommate && (
                            <span style={{ fontSize: '12px', fontWeight: '700', padding: '4px 12px', borderRadius: '100px', background: 'rgba(22,163,74,0.1)', color: '#16A34A' }}>
                              👥 Traži cimera {selectedListing.roommateSpots ? `(${selectedListing.roommateSpots} mjesta)` : ''}
                            </span>
                          )}
                        </div>
                        <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#1C1C1E', letterSpacing: '-0.02em', marginBottom: '6px' }}>
                          {selectedListing.title}
                        </h2>
                        <p style={{ color: '#8E8E93', fontSize: '14px' }}>
                          📍 {selectedListing.city}{selectedListing.municipality ? `, ${selectedListing.municipality}` : ''}
                          {selectedListing.address ? ` · ${selectedListing.address}` : ''}
                        </p>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: '28px', fontWeight: '900', color: '#FF6B35', lineHeight: 1 }}>
                          {selectedListing.price} KM
                        </p>
                        <p style={{ fontSize: '12px', color: '#8E8E93', marginTop: '2px' }}>mjesečno</p>
                      </div>
                    </div>

                    <AnimatedLine />

                    {/* Features grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', margin: '16px 0' }}>
                      {[
                        { icon: '🛏️', label: 'Sobe', value: selectedListing.roomCount ? `${selectedListing.roomCount}` : '—' },
                        { icon: '🚿', label: 'Kupatila', value: selectedListing.bathroomCount ? `${selectedListing.bathroomCount}` : '—' },
                        { icon: '📐', label: 'Površina', value: selectedListing.squareMeters ? `${selectedListing.squareMeters}m²` : '—' },
                        { icon: '🛋️', label: 'Namještaj', value: selectedListing.furnished ? 'Da' : 'Ne' },
                        { icon: '💡', label: 'Računi', value: selectedListing.utilitiesIncluded ? 'Uključeni' : 'Nisu' },
                        { icon: '📅', label: 'Objavljeno', value: new Date(selectedListing.createdAt).toLocaleDateString('bs-BA') },
                      ].map((feat, i) => (
                        <div key={i} style={{
                          background: '#F7F5F0', borderRadius: '12px', padding: '12px',
                          textAlign: 'center',
                        }}>
                          <p style={{ fontSize: '20px', marginBottom: '4px' }}>{feat.icon}</p>
                          <p style={{ fontSize: '13px', fontWeight: '800', color: '#1C1C1E' }}>{feat.value}</p>
                          <p style={{ fontSize: '11px', color: '#AEAEB2', marginTop: '2px' }}>{feat.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Opis */}
                    <div style={{ marginBottom: '20px' }}>
                      <h3 style={{ fontWeight: '800', color: '#1C1C1E', marginBottom: '10px', fontSize: '15px' }}>
                        Opis oglasa
                      </h3>
                      <p style={{ color: '#3A3A3C', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                        {selectedListing.description}
                      </p>
                    </div>

                    <AnimatedLine />

                    {/* Kontakt */}
                    <div style={{ marginTop: '20px', background: '#FFF7ED', borderRadius: '16px', padding: '18px' }}>
                      <h3 style={{ fontWeight: '800', color: '#1C1C1E', marginBottom: '14px', fontSize: '15px' }}>
                        Kontaktiraj oglašivača
                      </h3>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '14px', overflow: 'hidden', flexShrink: 0 }}>
                          {selectedListing.owner?.profileImage ? (
                            <img src={selectedListing.owner.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{
                              width: '100%', height: '100%',
                              background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'white', fontWeight: '800',
                            }}>
                              {selectedListing.owner?.firstName?.[0]}{selectedListing.owner?.lastName?.[0]}
                            </div>
                          )}
                        </div>
                        <div>
                          <p style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '14px' }}>
                            {selectedListing.owner?.firstName} {selectedListing.owner?.lastName}
                          </p>
                          <p style={{ color: '#8E8E93', fontSize: '12px' }}>
                            {selectedListing.owner?.faculty || 'Student'}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {selectedListing.contactPhone && (
                          <a href={`tel:${selectedListing.contactPhone}`} style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '10px 16px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                            color: 'white', fontSize: '13px', fontWeight: '700',
                            textDecoration: 'none',
                          }}>
                            📞 {selectedListing.contactPhone}
                          </a>
                        )}
                        {selectedListing.contactEmail && (
                          <a href={`mailto:${selectedListing.contactEmail}`} style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '10px 16px', borderRadius: '12px',
                            background: 'white', color: '#FF6B35', fontSize: '13px', fontWeight: '700',
                            textDecoration: 'none',
                          }}>
                            ✉️ Email
                          </a>
                        )}
                        {user.id !== selectedListing.ownerId && (
                          <button
                            onClick={() => navigate(`/chat/${selectedListing.ownerId}`)}
                            style={{
                              padding: '10px 16px', borderRadius: '12px', border: 'none',
                              background: 'white', color: '#1C1C1E', fontSize: '13px',
                              fontWeight: '700', cursor: 'pointer',
                            }}>
                            💬 Pošalji poruku
                          </button>
                        )}
                        {user.id === selectedListing.ownerId && (
                          <button
                            onClick={() => handleDelete(selectedListing.id)}
                            style={{
                              padding: '10px 16px', borderRadius: '12px', border: 'none',
                              background: 'rgba(255,59,48,0.1)', color: '#FF3B30',
                              fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                            }}>
                            🗑️ Obriši oglas
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Image Gallery ────────────────────────────────────────────────
function ImageGallery({ images }) {
  const [active, setActive] = useState(0)

  return (
    <div>
      {/* Glavna slika */}
      <div style={{ height: '240px', position: 'relative', overflow: 'hidden' }}>
        <img
          src={images[active]}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.3s' }}
        />
        {images.length > 1 && (
          <>
            <button
              onClick={() => setActive(prev => (prev - 1 + images.length) % images.length)}
              style={{
                position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                width: '32px', height: '32px', borderRadius: '50%', border: 'none',
                background: 'rgba(0,0,0,0.5)', color: 'white', cursor: 'pointer',
                fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              ‹
            </button>
            <button
              onClick={() => setActive(prev => (prev + 1) % images.length)}
              style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                width: '32px', height: '32px', borderRadius: '50%', border: 'none',
                background: 'rgba(0,0,0,0.5)', color: 'white', cursor: 'pointer',
                fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              ›
            </button>
          </>
        )}
        <div style={{
          position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: '6px',
        }}>
          {images.map((_, i) => (
            <div key={i}
              onClick={() => setActive(i)}
              style={{
                width: i === active ? '20px' : '6px', height: '6px', borderRadius: '100px',
                background: i === active ? '#FF6B35' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer', transition: 'all 0.3s',
              }}
            />
          ))}
        </div>
      </div>

      {/* Thumbnail grid */}
      {images.length > 1 && (
        <div style={{ display: 'flex', gap: '6px', padding: '8px', overflowX: 'auto' }}>
          {images.map((img, i) => (
            <div
              key={i}
              onClick={() => setActive(i)}
              style={{
                width: '60px', height: '48px', borderRadius: '8px', overflow: 'hidden',
                flexShrink: 0, cursor: 'pointer',
                outline: i === active ? '2px solid #FF6B35' : 'none',
                outlineOffset: '1px', opacity: i === active ? 1 : 0.6,
                transition: 'all 0.2s',
              }}>
              <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}