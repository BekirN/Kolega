import { useEffect, useState, useRef } from 'react'
import { AnimatedSection, AnimatedScale, AnimatedBlur } from '../components/Animated'
import {
  getFolders, createFolder, deleteFolder,
  getMyMaterials, getSavedMaterials, getPublicMaterials,
  uploadMaterial, saveMaterial, unsaveMaterial,
  deleteMaterial, togglePublic, moveMaterial,
} from '../api/materials'

const FILE_ICONS = {
  'application/pdf': { icon: '📄', color: '#FF3B30', label: 'PDF' },
  'application/msword': { icon: '📝', color: '#2563EB', label: 'DOC' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: '📝', color: '#2563EB', label: 'DOCX' },
  'application/vnd.ms-powerpoint': { icon: '📊', color: '#FF6B35', label: 'PPT' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { icon: '📊', color: '#FF6B35', label: 'PPTX' },
  'application/vnd.ms-excel': { icon: '📈', color: '#16A34A', label: 'XLS' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: '📈', color: '#16A34A', label: 'XLSX' },
  'text/plain': { icon: '📃', color: '#8E8E93', label: 'TXT' },
  'image/jpeg': { icon: '🖼️', color: '#FFB800', label: 'JPG' },
  'image/png': { icon: '🖼️', color: '#FFB800', label: 'PNG' },
  'application/zip': { icon: '🗜️', color: '#7C3AED', label: 'ZIP' },
}

const formatSize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const timeAgo = (date) => {
  const s = Math.floor((new Date() - new Date(date)) / 1000)
  if (s < 3600) return `${Math.floor(s / 60)}min`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  if (s < 604800) return `${Math.floor(s / 86400)}d`
  return new Date(date).toLocaleDateString('bs-BA')
}

const FOLDER_COLORS = ['#FF6B35', '#FFB800', '#16A34A', '#2563EB', '#7C3AED', '#EC4899', '#0891B2']
const FOLDER_ICONS = ['📁', '📚', '📝', '📊', '🔬', '⚙️', '🎯', '💡', '🏆', '📐']

export default function Materials() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // Tab state
  const [activeTab, setActiveTab] = useState('library') // library | public

  // Library state
  const [folders, setFolders] = useState([])
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [materials, setMaterials] = useState([])
  const [savedMaterials, setSavedMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('my') // my | saved

  // Public state
  const [publicMaterials, setPublicMaterials] = useState([])
  const [publicLoading, setPublicLoading] = useState(false)
  const [publicSearch, setPublicSearch] = useState('')
  const [publicSort, setPublicSort] = useState('new')

  // UI state
  const [showUpload, setShowUpload] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(null) // materialId
  const [selectedMaterial, setSelectedMaterial] = useState(null)

  // Upload form
  const [uploadData, setUploadData] = useState({
    title: '', description: '', subject: '', professor: '',
    year: '', isPublic: false, folderId: '',
  })
  const [uploadFile, setUploadFileState] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  // New folder form
  const [newFolderData, setNewFolderData] = useState({ name: '', color: '#FF6B35', icon: '📁' })

  // Search
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadLibrary()
  }, [])

  useEffect(() => {
    if (activeTab === 'public') loadPublic()
  }, [activeTab, publicSort])

  const loadLibrary = async () => {
    setLoading(true)
    try {
      const [f, m, s] = await Promise.all([
        getFolders(),
        getMyMaterials(),
        getSavedMaterials(),
      ])
      setFolders(f)
      setMaterials(m)
      setSavedMaterials(s)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadPublic = async () => {
    setPublicLoading(true)
    try {
      const data = await getPublicMaterials({ sort: publicSort, search: publicSearch })
      setPublicMaterials(data)
    } catch (err) {
      console.error(err)
    } finally {
      setPublicLoading(false)
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!uploadFile) return
    setUploading(true)
    try {
      const data = await uploadMaterial({
        ...uploadData,
        file: uploadFile,
        folderId: uploadData.folderId || selectedFolder?.id || '',
      })
      setMaterials(prev => [data.material, ...prev])
      setShowUpload(false)
      setUploadData({ title: '', description: '', subject: '', professor: '', year: '', isPublic: false, folderId: '' })
      setUploadFileState(null)
      await loadLibrary()
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleCreateFolder = async (e) => {
    e.preventDefault()
    try {
      const data = await createFolder(newFolderData)
      setFolders(prev => [...prev, data.folder])
      setShowNewFolder(false)
      setNewFolderData({ name: '', color: '#FF6B35', icon: '📁' })
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteFolder = async (id) => {
    if (!confirm('Obrisati folder? Materijali neće biti obrisani.')) return
    try {
      await deleteFolder(id)
      setFolders(prev => prev.filter(f => f.id !== id))
      if (selectedFolder?.id === id) setSelectedFolder(null)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteMaterial = async (id) => {
    if (!confirm('Obrisati materijal?')) return
    try {
      await deleteMaterial(id)
      setMaterials(prev => prev.filter(m => m.id !== id))
      if (selectedMaterial?.id === id) setSelectedMaterial(null)
    } catch (err) {
      console.error(err)
    }
  }

  const handleTogglePublic = async (id) => {
    try {
      const data = await togglePublic(id)
      setMaterials(prev => prev.map(m => m.id === id ? { ...m, isPublic: data.material.isPublic } : m))
    } catch (err) {
      console.error(err)
    }
  }

  const handleSave = async (materialId) => {
    try {
      await saveMaterial(materialId, { source: 'LIBRARY' })
      setPublicMaterials(prev => prev.map(m => m.id === materialId ? { ...m, isSaved: true } : m))
      await loadLibrary()
    } catch (err) {
      console.error(err)
    }
  }

  const handleUnsave = async (materialId) => {
    try {
      await unsaveMaterial(materialId)
      setSavedMaterials(prev => prev.filter(s => s.materialId !== materialId))
      setPublicMaterials(prev => prev.map(m => m.id === materialId ? { ...m, isSaved: false } : m))
    } catch (err) {
      console.error(err)
    }
  }

  const handleMove = async (materialId, folderId) => {
    try {
      await moveMaterial(materialId, folderId)
      setShowMoveModal(null)
      await loadLibrary()
    } catch (err) {
      console.error(err)
    }
  }

  // Filtriraj materijale
  const filteredMaterials = (viewMode === 'my' ? materials : savedMaterials.map(s => ({ ...s.material, saveId: s.id, source: s.source })))
    .filter(m => {
      if (!selectedFolder) return true
      if (viewMode === 'my') return m.folderId === selectedFolder.id
      return true
    })
    .filter(m => {
      if (!search) return true
      const q = search.toLowerCase()
      return m.title?.toLowerCase().includes(q) ||
        m.subject?.toLowerCase().includes(q) ||
        m.professor?.toLowerCase().includes(q)
    })

  const getFileInfo = (fileType) => FILE_ICONS[fileType] || { icon: '📎', color: '#8E8E93', label: 'FILE' }

  return (
    <div style={{ minHeight: '100vh', background: '#EFEDE8' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1C1C1E 0%, #2C2C2E 100%)',
        padding: '40px 32px 0', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 40%, rgba(255,184,0,0.12), transparent 60%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 80%, rgba(255,107,53,0.08), transparent 50%)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <AnimatedBlur delay={0}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
              <div>
                <h1 style={{ fontSize: '32px', fontWeight: '900', color: 'white', letterSpacing: '-0.02em', marginBottom: '6px' }}>
                  Materijali 📚
                </h1>
                <p style={{ color: '#8E8E93', fontSize: '15px' }}>
                  Tvoja lična biblioteka i dijeljenje sa zajednicom
                </p>
              </div>
              <button
                onClick={() => setShowUpload(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 20px', borderRadius: '14px', border: 'none',
                  background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                  color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(255,107,53,0.35)',
                }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload
              </button>
            </div>
          </AnimatedBlur>

          {/* Tab navigacija */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { key: 'library', label: '📁 Moja biblioteka' },
              { key: 'public', label: '🌍 Zajednica' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '12px 24px', border: 'none', cursor: 'pointer',
                  fontSize: '14px', fontWeight: '700', borderRadius: '12px 12px 0 0',
                  background: activeTab === tab.key ? '#EFEDE8' : 'transparent',
                  color: activeTab === tab.key ? '#1C1C1E' : '#8E8E93',
                  transition: 'all 0.2s',
                }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sadržaj */}
      {activeTab === 'library' ? (
        <div style={{ display: 'flex', height: 'calc(100vh - 180px)' }}>

          {/* Sidebar – Folderi */}
          <div style={{
            width: '260px', flexShrink: 0, padding: '20px 16px',
            borderRight: '1px solid rgba(0,0,0,0.06)',
            overflowY: 'auto', background: '#F7F5F0',
          }}>
            {/* View mode toggle */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
              {[
                { key: 'my', label: 'Moji' },
                { key: 'saved', label: 'Sačuvano' },
              ].map(v => (
                <button key={v.key} onClick={() => { setViewMode(v.key); setSelectedFolder(null) }} style={{
                  flex: 1, padding: '7px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  fontSize: '13px', fontWeight: '700',
                  background: viewMode === v.key ? '#FF6B35' : 'transparent',
                  color: viewMode === v.key ? 'white' : '#8E8E93',
                }}>
                  {v.label}
                </button>
              ))}
            </div>

            {/* Svi materijali */}
            <button
              onClick={() => setSelectedFolder(null)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: !selectedFolder ? '#FFF7ED' : 'transparent',
                color: !selectedFolder ? '#FF6B35' : '#3A3A3C',
                marginBottom: '4px', textAlign: 'left',
                outline: !selectedFolder ? '1.5px solid rgba(255,107,53,0.3)' : 'none',
              }}>
              <span style={{ fontSize: '18px' }}>📚</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13px', fontWeight: '700' }}>Svi materijali</p>
                <p style={{ fontSize: '11px', color: '#AEAEB2', marginTop: '1px' }}>
                  {viewMode === 'my' ? materials.length : savedMaterials.length} fajlova
                </p>
              </div>
            </button>

            {/* Label */}
            <p style={{
              fontSize: '10px', fontWeight: '700', color: '#AEAEB2',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              margin: '16px 0 8px 4px',
            }}>
              Folderi
            </p>

            {/* Lista foldera */}
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #FF6B35', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {folders.map(folder => (
                  <div key={folder.id}>
                    <div
                      onClick={() => setSelectedFolder(selectedFolder?.id === folder.id ? null : folder)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                        background: selectedFolder?.id === folder.id ? '#FFF7ED' : 'transparent',
                        color: selectedFolder?.id === folder.id ? '#FF6B35' : '#3A3A3C',
                        textAlign: 'left',
                        outline: selectedFolder?.id === folder.id ? `1.5px solid rgba(255,107,53,0.3)` : 'none',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { if (selectedFolder?.id !== folder.id) e.currentTarget.style.background = '#F0EDE8' }}
                      onMouseLeave={e => { if (selectedFolder?.id !== folder.id) e.currentTarget.style.background = 'transparent' }}
                    >
                      <span style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: `${folder.color}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '16px', flexShrink: 0,
                      }}>
                        {folder.icon}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {folder.name}
                        </p>
                        <p style={{ fontSize: '11px', color: '#AEAEB2', marginTop: '1px' }}>
                          {folder._count?.materials || 0} fajlova
                        </p>
                      </div>
                      {!folder.isDefault && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id) }}
                          style={{
                            padding: '4px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                            background: 'transparent', color: '#AEAEB2', fontSize: '12px',
                            opacity: 0, transition: 'opacity 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Podfolderi */}
                    {folder.children?.length > 0 && (
                      <div style={{ marginLeft: '16px', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {folder.children.map(child => (
                          <button
                            key={child.id}
                            onClick={() => setSelectedFolder(selectedFolder?.id === child.id ? null : child)}
                            style={{
                              width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                              padding: '8px 10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                              background: selectedFolder?.id === child.id ? '#FFF7ED' : 'transparent',
                              color: selectedFolder?.id === child.id ? '#FF6B35' : '#636366',
                              textAlign: 'left', fontSize: '13px', fontWeight: '600',
                            }}>
                            <span style={{ fontSize: '14px' }}>{child.icon}</span>
                            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {child.name}
                            </span>
                            <span style={{ fontSize: '11px', color: '#AEAEB2', flexShrink: 0 }}>
                              {child._count?.materials || 0}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Novi folder */}
            <button
              onClick={() => setShowNewFolder(true)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 12px', borderRadius: '12px', border: '1.5px dashed #E8E4DF',
                background: 'transparent', color: '#AEAEB2', cursor: 'pointer',
                fontSize: '13px', fontWeight: '600', marginTop: '12px',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF6B35'; e.currentTarget.style.color = '#FF6B35' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E4DF'; e.currentTarget.style.color = '#AEAEB2' }}
            >
              <span>+</span>
              Novi folder
            </button>
          </div>

          {/* Main area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>

            {/* Search bar */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#AEAEB2' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Pretraži materijale..."
                  style={{
                    width: '100%', padding: '10px 14px 10px 36px', borderRadius: '12px',
                    border: '1.5px solid #E8E4DF', background: '#FDFCF9',
                    color: '#1C1C1E', fontSize: '14px', outline: 'none',
                    boxSizing: 'border-box', transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#FF6B35'}
                  onBlur={e => e.target.style.borderColor = '#E8E4DF'}
                />
              </div>
            </div>

            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', color: '#AEAEB2', fontWeight: '600' }}>
                {viewMode === 'my' ? 'Moji materijali' : 'Sačuvano'}
              </span>
              {selectedFolder && (
                <>
                  <span style={{ color: '#AEAEB2' }}>›</span>
                  <span style={{ fontSize: '13px', color: '#FF6B35', fontWeight: '700' }}>
                    {selectedFolder.icon} {selectedFolder.name}
                  </span>
                </>
              )}
              <span style={{ color: '#AEAEB2', fontSize: '13px', marginLeft: 'auto' }}>
                {filteredMaterials.length} fajlova
              </span>
            </div>

            {/* Grid materijala */}
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #FF6B35', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : filteredMaterials.length === 0 ? (
              <AnimatedScale>
                <div style={{
                  background: '#FDFCF9', borderRadius: '20px', padding: '48px',
                  textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}>
                  <p style={{ fontSize: '40px', marginBottom: '12px' }}>
                    {viewMode === 'saved' ? '⬇️' : '📂'}
                  </p>
                  <p style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '18px', marginBottom: '8px' }}>
                    {viewMode === 'saved' ? 'Nema sačuvanih materijala' : 'Folder je prazan'}
                  </p>
                  <p style={{ color: '#8E8E93', fontSize: '14px', marginBottom: '20px' }}>
                    {viewMode === 'saved'
                      ? 'Preuzmi materijale iz Zajednice i pojavit će se ovdje'
                      : 'Uploaduj prvi materijal ili ga premjesti ovdje'}
                  </p>
                  {viewMode === 'my' && (
                    <button onClick={() => setShowUpload(true)} style={{
                      padding: '10px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                      color: 'white', fontWeight: '700', fontSize: '14px',
                    }}>
                      Upload materijal
                    </button>
                  )}
                </div>
              </AnimatedScale>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {filteredMaterials.map((material, i) => {
                  const fileInfo = getFileInfo(material.fileType)
                  return (
                    <AnimatedScale key={material.id} delay={i * 0.04}>
                      <div
                        onClick={() => setSelectedMaterial(selectedMaterial?.id === material.id ? null : material)}
                        style={{
                          background: selectedMaterial?.id === material.id ? '#FFF7ED' : '#FDFCF9',
                          borderRadius: '16px', padding: '16px', cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                          outline: selectedMaterial?.id === material.id ? '2px solid #FF6B35' : 'none',
                          transition: 'all 0.2s',
                          position: 'relative',
                        }}
                        onMouseEnter={e => { if (selectedMaterial?.id !== material.id) e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)' }}
                        onMouseLeave={e => { if (selectedMaterial?.id !== material.id) e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)' }}
                      >
                        {/* File type icon */}
                        <div style={{
                          width: '48px', height: '56px', borderRadius: '10px',
                          background: `${fileInfo.color}15`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '26px', marginBottom: '12px',
                          position: 'relative',
                        }}>
                          {fileInfo.icon}
                          <span style={{
                            position: 'absolute', bottom: '-4px', right: '-4px',
                            fontSize: '9px', fontWeight: '800', padding: '2px 4px',
                            borderRadius: '4px', background: fileInfo.color, color: 'white',
                          }}>
                            {fileInfo.label}
                          </span>
                        </div>

                        {/* Badges */}
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
                          {material.isPublic && (
                            <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '100px', background: 'rgba(22,163,74,0.1)', color: '#16A34A' }}>
                              🌍 Javno
                            </span>
                          )}
                          {material.source === 'CHAT' && (
                            <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '100px', background: 'rgba(37,99,235,0.1)', color: '#2563EB' }}>
                              💬 Chat
                            </span>
                          )}
                        </div>

                        <p style={{
                          fontWeight: '700', color: '#1C1C1E', fontSize: '13px',
                          marginBottom: '4px', lineHeight: '1.3',
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {material.title}
                        </p>

                        {material.subject && (
                          <p style={{ fontSize: '11px', color: '#FF6B35', fontWeight: '600', marginBottom: '6px' }}>
                            {material.subject}
                          </p>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '11px', color: '#AEAEB2' }}>
                            {formatSize(material.fileSize)}
                          </span>
                          <span style={{ fontSize: '11px', color: '#AEAEB2' }}>
                            {timeAgo(material.createdAt)}
                          </span>
                        </div>
                      </div>
                    </AnimatedScale>
                  )
                })}
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selectedMaterial && (
            <div style={{
              width: '280px', flexShrink: 0, padding: '24px 20px',
              borderLeft: '1px solid rgba(0,0,0,0.06)',
              overflowY: 'auto', background: '#FDFCF9',
              animation: 'fadeSlideLeft 0.25s ease both',
            }}>
              <style>{`@keyframes fadeSlideLeft { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:translateX(0) } }`}</style>

              {/* File preview */}
              <div style={{
                width: '100%', height: '120px', borderRadius: '16px', marginBottom: '16px',
                background: `${getFileInfo(selectedMaterial.fileType).color}15`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '8px',
              }}>
                <span style={{ fontSize: '40px' }}>{getFileInfo(selectedMaterial.fileType).icon}</span>
                <span style={{
                  fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '100px',
                  background: getFileInfo(selectedMaterial.fileType).color,
                  color: 'white',
                }}>
                  {getFileInfo(selectedMaterial.fileType).label}
                </span>
              </div>

              <h3 style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '16px', marginBottom: '6px', lineHeight: '1.3' }}>
                {selectedMaterial.title}
              </h3>

              {selectedMaterial.description && (
                <p style={{ color: '#8E8E93', fontSize: '13px', marginBottom: '16px', lineHeight: '1.5' }}>
                  {selectedMaterial.description}
                </p>
              )}

              {/* Meta */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {[
                  { label: 'Predmet', value: selectedMaterial.subject, icon: '📖' },
                  { label: 'Profesor', value: selectedMaterial.professor, icon: '👨‍🏫' },
                  { label: 'Godina', value: selectedMaterial.year, icon: '📅' },
                  { label: 'Veličina', value: formatSize(selectedMaterial.fileSize), icon: '💾' },
                  { label: 'Preuzimanja', value: selectedMaterial.downloadCount, icon: '⬇️' },
                ].filter(m => m.value).map((meta, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', width: '20px' }}>{meta.icon}</span>
                    <span style={{ fontSize: '12px', color: '#8E8E93' }}>{meta.label}:</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#1C1C1E' }}>{meta.value}</span>
                  </div>
                ))}
              </div>

              {/* Akcije */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                
                 <a href={selectedMaterial.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '11px', borderRadius: '12px', textDecoration: 'none',
                    background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                    color: 'white', fontWeight: '700', fontSize: '14px',
                  }}>
                  ⬇️ Preuzmi fajl
                </a>

                {selectedMaterial.uploaderId === user.id && (
                  <>
                    <button
                      onClick={() => handleTogglePublic(selectedMaterial.id)}
                      style={{
                        padding: '11px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                        background: selectedMaterial.isPublic ? 'rgba(255,59,48,0.1)' : 'rgba(22,163,74,0.1)',
                        color: selectedMaterial.isPublic ? '#FF3B30' : '#16A34A',
                        fontWeight: '700', fontSize: '13px',
                      }}>
                      {selectedMaterial.isPublic ? '🔒 Učini privatnim' : '🌍 Podijeli sa zajednicom'}
                    </button>

                    <button
                      onClick={() => setShowMoveModal(selectedMaterial.id)}
                      style={{
                        padding: '11px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                        background: '#F0EDE8', color: '#3A3A3C', fontWeight: '700', fontSize: '13px',
                      }}>
                      📁 Premjesti u folder
                    </button>

                    <button
                      onClick={() => handleDeleteMaterial(selectedMaterial.id)}
                      style={{
                        padding: '11px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                        background: 'rgba(255,59,48,0.08)', color: '#FF3B30', fontWeight: '700', fontSize: '13px',
                      }}>
                      🗑️ Obriši
                    </button>
                  </>
                )}

                {selectedMaterial.uploaderId !== user.id && viewMode === 'saved' && (
                  <button
                    onClick={() => handleUnsave(selectedMaterial.id)}
                    style={{
                      padding: '11px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                      background: 'rgba(255,59,48,0.08)', color: '#FF3B30', fontWeight: '700', fontSize: '13px',
                    }}>
                    ✕ Ukloni iz biblioteke
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        // ─── PUBLIC TAB ───────────────────────────────────────────────
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '28px 32px' }}>

          {/* Filteri */}
          <AnimatedSection delay={0} direction="up">
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#AEAEB2' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  value={publicSearch}
                  onChange={e => setPublicSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadPublic()}
                  placeholder="Pretraži po predmetu, profesoru..."
                  style={{
                    width: '100%', padding: '10px 14px 10px 36px', borderRadius: '12px',
                    border: '1.5px solid #E8E4DF', background: '#FDFCF9',
                    color: '#1C1C1E', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = '#FF6B35'}
                  onBlur={e => e.target.style.borderColor = '#E8E4DF'}
                />
              </div>
              <button onClick={loadPublic} style={{
                padding: '10px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: '#FF6B35', color: 'white', fontSize: '14px', fontWeight: '600',
              }}>
                Traži
              </button>
              {[
                { key: 'new', label: '🆕 Novo' },
                { key: 'popular', label: '🔥 Popularno' },
              ].map(s => (
                <button key={s.key} onClick={() => setPublicSort(s.key)} style={{
                  padding: '10px 16px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  background: publicSort === s.key ? '#1C1C1E' : '#FDFCF9',
                  color: publicSort === s.key ? 'white' : '#6B7280',
                  fontSize: '13px', fontWeight: '700',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}>
                  {s.label}
                </button>
              ))}
            </div>
          </AnimatedSection>

          {publicLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #FF6B35', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : publicMaterials.length === 0 ? (
            <AnimatedScale>
              <div style={{ background: '#FDFCF9', borderRadius: '20px', padding: '48px', textAlign: 'center' }}>
                <p style={{ fontSize: '40px', marginBottom: '12px' }}>🌍</p>
                <p style={{ fontWeight: '800', color: '#1C1C1E', fontSize: '18px', marginBottom: '8px' }}>Nema javnih materijala</p>
                <p style={{ color: '#8E8E93' }}>Budi prvi koji dijeli materijale sa zajednicom!</p>
              </div>
            </AnimatedScale>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {publicMaterials.map((material, i) => {
                const fileInfo = getFileInfo(material.fileType)
                return (
                  <AnimatedSection key={material.id} delay={i * 0.05} direction="up">
                    <div style={{
                      background: '#FDFCF9', borderRadius: '20px', padding: '18px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.1)' }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                        {/* File icon */}
                        <div style={{
                          width: '44px', height: '52px', borderRadius: '10px', flexShrink: 0,
                          background: `${fileInfo.color}15`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '22px', position: 'relative',
                        }}>
                          {fileInfo.icon}
                          <span style={{
                            position: 'absolute', bottom: '-3px', right: '-3px',
                            fontSize: '8px', fontWeight: '800', padding: '1px 3px',
                            borderRadius: '4px', background: fileInfo.color, color: 'white',
                          }}>
                            {fileInfo.label}
                          </span>
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontWeight: '800', color: '#1C1C1E', fontSize: '14px', marginBottom: '4px',
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}>
                            {material.title}
                          </p>
                          {material.subject && (
                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#FF6B35' }}>
                              {material.subject}
                            </span>
                          )}
                          {material.professor && (
                            <p style={{ fontSize: '11px', color: '#8E8E93' }}>Prof. {material.professor}</p>
                          )}
                        </div>
                      </div>

                      {/* Uploader */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingTop: '10px', borderTop: '1px solid #F0EDE8' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                          {material.uploader?.profileImage ? (
                            <img src={material.uploader.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #FF6B35, #FFB800)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', fontWeight: '700' }}>
                              {material.uploader?.firstName?.[0]}
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize: '12px', color: '#8E8E93', flex: 1 }}>
                          {material.uploader?.firstName} {material.uploader?.lastName}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', color: '#AEAEB2' }}>⬇️ {material.downloadCount}</span>
                          <span style={{ fontSize: '11px', color: '#AEAEB2' }}>❤️ {material._count?.saves}</span>
                        </div>
                      </div>

                      {/* Akcije */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        
                         <a href={material.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            padding: '8px', borderRadius: '10px', textDecoration: 'none',
                            background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                            color: 'white', fontWeight: '700', fontSize: '13px',
                          }}>
                          ⬇️ Preuzmi
                        </a>
                        {!material.isOwn && (
                          <button
                            onClick={() => material.isSaved ? handleUnsave(material.id) : handleSave(material.id)}
                            style={{
                              padding: '8px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                              background: material.isSaved ? 'rgba(255,59,48,0.1)' : '#F0EDE8',
                              color: material.isSaved ? '#FF3B30' : '#3A3A3C',
                              fontWeight: '700', fontSize: '13px', transition: 'all 0.15s',
                            }}>
                            {material.isSaved ? '✕' : '+ Sačuvaj'}
                          </button>
                        )}
                      </div>
                    </div>
                  </AnimatedSection>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── UPLOAD MODAL ─────────────────────────────────────────────── */}
      {showUpload && (
        <Modal onClose={() => setShowUpload(false)} title="Upload materijal 📤">
          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* File drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${uploadFile ? '#FF6B35' : '#E8E4DF'}`,
                borderRadius: '16px', padding: '28px', textAlign: 'center', cursor: 'pointer',
                background: uploadFile ? '#FFF7ED' : '#F7F5F0',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!uploadFile) e.currentTarget.style.borderColor = '#FF6B35' }}
              onMouseLeave={e => { if (!uploadFile) e.currentTarget.style.borderColor = '#E8E4DF' }}
            >
              {uploadFile ? (
                <>
                  <p style={{ fontSize: '28px', marginBottom: '8px' }}>
                    {getFileInfo(uploadFile.type).icon}
                  </p>
                  <p style={{ fontWeight: '700', color: '#1C1C1E', fontSize: '14px' }}>{uploadFile.name}</p>
                  <p style={{ color: '#8E8E93', fontSize: '12px', marginTop: '4px' }}>{formatSize(uploadFile.size)}</p>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setUploadFileState(null) }}
                    style={{ marginTop: '8px', padding: '4px 10px', borderRadius: '8px', border: 'none', background: 'rgba(255,59,48,0.1)', color: '#FF3B30', fontSize: '12px', cursor: 'pointer' }}>
                    Ukloni
                  </button>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '32px', marginBottom: '8px' }}>📤</p>
                  <p style={{ fontWeight: '700', color: '#1C1C1E', fontSize: '15px', marginBottom: '4px' }}>
                    Klikni ili prevuci fajl ovdje
                  </p>
                  <p style={{ color: '#8E8E93', fontSize: '12px' }}>
                    PDF, DOCX, PPTX, XLSX, TXT, ZIP · Max 50MB
                  </p>
                </>
              )}
              <input ref={fileInputRef} type="file" style={{ display: 'none' }}
                onChange={e => { if (e.target.files[0]) setUploadFileState(e.target.files[0]) }}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.jpg,.jpeg,.png"
              />
            </div>

            <ModalInput
              label="Naziv *"
              value={uploadData.title}
              onChange={e => setUploadData({ ...uploadData, title: e.target.value })}
              placeholder="npr. Skripta Matematička analiza 1"
              required
            />

            <ModalInput
              label="Opis"
              value={uploadData.description}
              onChange={e => setUploadData({ ...uploadData, description: e.target.value })}
              placeholder="Kratki opis materijala..."
              textarea
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <ModalInput
                label="Predmet"
                value={uploadData.subject}
                onChange={e => setUploadData({ ...uploadData, subject: e.target.value })}
                placeholder="npr. Matematika 1"
              />
              <ModalInput
                label="Profesor"
                value={uploadData.professor}
                onChange={e => setUploadData({ ...uploadData, professor: e.target.value })}
                placeholder="Prof. Prezime"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#3A3A3C', marginBottom: '6px', display: 'block' }}>
                  Folder
                </label>
                <select
                  value={uploadData.folderId}
                  onChange={e => setUploadData({ ...uploadData, folderId: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #E8E4DF', background: '#F0EDE8', color: '#1C1C1E', fontSize: '13px', outline: 'none' }}>
                  <option value="">Default (Moji materijali)</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.icon} {f.name}</option>
                  ))}
                </select>
              </div>
              <ModalInput
                label="Godina"
                value={uploadData.year}
                onChange={e => setUploadData({ ...uploadData, year: e.target.value })}
                placeholder="npr. 2024"
                type="number"
              />
            </div>

            {/* Public toggle */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '14px', background: '#F0EDE8', borderRadius: '12px',
            }}>
              <button type="button" onClick={() => setUploadData({ ...uploadData, isPublic: !uploadData.isPublic })} style={{
                width: '44px', height: '24px', borderRadius: '100px', border: 'none', cursor: 'pointer',
                background: uploadData.isPublic ? '#FF6B35' : '#C7C7CC',
                position: 'relative', transition: 'background 0.2s', flexShrink: 0,
              }}>
                <div style={{
                  position: 'absolute', top: '2px', width: '20px', height: '20px',
                  background: 'white', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  left: uploadData.isPublic ? '22px' : '2px', transition: 'left 0.2s',
                }} />
              </button>
              <div>
                <p style={{ fontWeight: '700', color: '#1C1C1E', fontSize: '14px' }}>🌍 Podijeli sa zajednicom</p>
                <p style={{ color: '#8E8E93', fontSize: '12px', marginTop: '2px' }}>
                  Ostali studenti će moći preuzeti ovaj materijal
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
              <button type="button" onClick={() => setShowUpload(false)} style={{
                flex: 1, padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: '#F0EDE8', color: '#6B7280', fontWeight: '700',
              }}>
                Odustani
              </button>
              <button type="submit" disabled={!uploadFile || !uploadData.title || uploading} style={{
                flex: 2, padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: uploadFile && uploadData.title ? 'linear-gradient(135deg, #FF6B35, #FFB800)' : '#E5E5EA',
                color: uploadFile && uploadData.title ? 'white' : '#AEAEB2',
                fontWeight: '800', fontSize: '14px',
              }}>
                {uploading ? 'Uploadujem...' : '📤 Upload'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── NEW FOLDER MODAL ─────────────────────────────────────────── */}
      {showNewFolder && (
        <Modal onClose={() => setShowNewFolder(false)} title="Novi folder 📁">
          <form onSubmit={handleCreateFolder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <ModalInput
              label="Naziv *"
              value={newFolderData.name}
              onChange={e => setNewFolderData({ ...newFolderData, name: e.target.value })}
              placeholder="npr. Matematika 2. godina"
              required
            />

            <div>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#3A3A3C', marginBottom: '8px', display: 'block' }}>
                Ikona
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {FOLDER_ICONS.map(icon => (
                  <button key={icon} type="button" onClick={() => setNewFolderData({ ...newFolderData, icon })} style={{
                    width: '36px', height: '36px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                    fontSize: '18px', background: newFolderData.icon === icon ? '#FFF7ED' : '#F0EDE8',
                    outline: newFolderData.icon === icon ? '2px solid #FF6B35' : 'none',
                    transition: 'all 0.15s',
                  }}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#3A3A3C', marginBottom: '8px', display: 'block' }}>
                Boja
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {FOLDER_COLORS.map(color => (
                  <button key={color} type="button" onClick={() => setNewFolderData({ ...newFolderData, color })} style={{
                    width: '28px', height: '28px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: color,
                    outline: newFolderData.color === color ? `3px solid ${color}` : 'none',
                    outlineOffset: '2px', transition: 'all 0.15s',
                  }} />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '14px', background: '#F0EDE8', borderRadius: '12px',
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: `${newFolderData.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
              }}>
                {newFolderData.icon}
              </div>
              <p style={{ fontWeight: '700', color: '#1C1C1E' }}>
                {newFolderData.name || 'Naziv foldera'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={() => setShowNewFolder(false)} style={{
                flex: 1, padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: '#F0EDE8', color: '#6B7280', fontWeight: '700',
              }}>
                Odustani
              </button>
              <button type="submit" disabled={!newFolderData.name} style={{
                flex: 2, padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: newFolderData.name ? 'linear-gradient(135deg, #FF6B35, #FFB800)' : '#E5E5EA',
                color: newFolderData.name ? 'white' : '#AEAEB2',
                fontWeight: '800', fontSize: '14px',
              }}>
                Kreiraj folder
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── MOVE MODAL ───────────────────────────────────────────────── */}
      {showMoveModal && (
        <Modal onClose={() => setShowMoveModal(null)} title="Premjesti u folder 📁">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={() => handleMove(showMoveModal, null)} style={{
              padding: '12px 16px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              background: '#F0EDE8', color: '#3A3A3C', fontWeight: '600', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px',
            }}>
              <span>📚</span> Bez foldera (root)
            </button>
            {folders.map(folder => (
              <button key={folder.id} onClick={() => handleMove(showMoveModal, folder.id)} style={{
                padding: '12px 16px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: '#F0EDE8', color: '#3A3A3C', fontWeight: '600', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px',
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#FFF7ED'; e.currentTarget.style.color = '#FF6B35' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#F0EDE8'; e.currentTarget.style.color = '#3A3A3C' }}>
                <span style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: `${folder.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
                }}>
                  {folder.icon}
                </span>
                {folder.name}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── HELPER KOMPONENTE ─────────────────────────────────────────────

function Modal({ children, onClose, title }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }} onClick={onClose}>
      <div style={{
        background: '#FDFCF9', borderRadius: '24px', padding: '28px',
        width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
        animation: 'scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#1C1C1E' }}>{title}</h2>
          <button onClick={onClose} style={{
            width: '32px', height: '32px', borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: '#F0EDE8', color: '#8E8E93', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ModalInput({ label, value, onChange, placeholder, required, textarea, type }) {
  const style = {
    width: '100%', padding: '10px 12px', borderRadius: '10px',
    border: '1.5px solid #E8E4DF', background: '#F0EDE8', color: '#1C1C1E',
    fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
    transition: 'border-color 0.15s',
    ...(textarea ? { height: '80px', resize: 'none' } : {}),
  }

  return (
    <div>
      <label style={{ fontSize: '13px', fontWeight: '700', color: '#3A3A3C', marginBottom: '6px', display: 'block' }}>
        {label}
      </label>
      {textarea ? (
        <textarea style={style} value={value} onChange={onChange} placeholder={placeholder}
          onFocus={e => e.target.style.borderColor = '#FF6B35'}
          onBlur={e => e.target.style.borderColor = '#E8E4DF'}
        />
      ) : (
        <input style={style} type={type || 'text'} value={value} onChange={onChange}
          placeholder={placeholder} required={required}
          onFocus={e => e.target.style.borderColor = '#FF6B35'}
          onBlur={e => e.target.style.borderColor = '#E8E4DF'}
        />
      )}
    </div>
  )
}