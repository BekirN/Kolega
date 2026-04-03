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
  const isAdmin = conversation?.adminId === currentUser?.id
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
    <div className="w-80 bg-white border-l border-gray-100 flex flex-col h-full overflow-hidden flex-shrink-0">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <h3 className="font-semibold text-gray-800">Detalji</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profil info */}
        <div className="p-6 text-center border-b border-gray-100">
          {isGroup ? (
            <>
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">
                👥
              </div>
              <h2 className="font-bold text-gray-800 text-lg">{conversation.name}</h2>
              <p className="text-sm text-gray-400 mt-1">
                {conversation.participants?.length} članova
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-3">
                {otherParticipant?.profileImage ? (
                  <img src={otherParticipant.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl">
                    {otherParticipant?.firstName?.[0]}{otherParticipant?.lastName?.[0]}
                  </div>
                )}
              </div>
              <h2 className="font-bold text-gray-800 text-lg">
                {otherParticipant?.firstName} {otherParticipant?.lastName}
              </h2>
              {otherParticipant?.faculty && (
                <p className="text-sm text-gray-400 mt-1">{otherParticipant.faculty}</p>
              )}
              <button
                onClick={() => navigate(`/profile/${otherParticipant?.id}`)}
                className="mt-3 text-sm text-indigo-500 hover:text-indigo-700 transition"
              >
                Pogledaj profil →
              </button>
            </>
          )}
        </div>

        {/* Članovi grupe */}
        {isGroup && (
          <div className="px-4 py-4 border-b border-gray-100">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Članovi
            </h4>
            <div className="space-y-2">
              {conversation.participants?.map(p => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-1.5 transition"
                  onClick={() => navigate(`/profile/${p.user?.id}`)}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    {p.user?.profileImage ? (
                      <img src={p.user.profileImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                        {p.user?.firstName?.[0]}{p.user?.lastName?.[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {p.user?.firstName} {p.user?.lastName}
                    </p>
                    {p.user?.faculty && (
                      <p className="text-xs text-gray-400 truncate">{p.user.faculty}</p>
                    )}
                  </div>
                  {conversation.adminId === p.user?.id && (
                    <span className="text-xs bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded flex-shrink-0">
                      Admin
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Media tabovi */}
        <div className="px-4 py-4">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Dijeljeni sadržaj
          </h4>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMediaTab('slike')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${
                mediaTab === 'slike'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              Slike ({media.length})
            </button>
            <button
              onClick={() => setMediaTab('fajlovi')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${
                mediaTab === 'fajlovi'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              Fajlovi ({files.length})
            </button>
          </div>

          {loading ? (
            <div className="text-center py-6 text-gray-400 text-sm">Učitavanje...</div>
          ) : mediaTab === 'slike' ? (
            media.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-3xl mb-2">🖼️</p>
                <p className="text-gray-400 text-sm">Nema dijeljenih slika</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {media.map(msg => (
                  
                  <a  key={msg.id}
                  href={msg.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square overflow-hidden rounded-lg hover:opacity-80 transition"
                  >
                    <img
                      src={msg.fileUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            )
          ) : (
            files.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-3xl mb-2">📎</p>
                <p className="text-gray-400 text-sm">Nema dijeljenih fajlova</p>
              </div>
            ) : (
              <div className="space-y-2">
                {files.map(msg => (
                  
                  <a  key={msg.id}
                    href={msg.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">📄</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 font-medium truncate">{msg.content}</p>
                      <p className="text-xs text-gray-400">
                        {msg.sender?.firstName} · {new Date(msg.createdAt).toLocaleDateString('bs-BA')}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Footer akcije */}
      <div className="px-4 py-4 border-t border-gray-100 flex-shrink-0 space-y-2">
        {isGroup && (
          <button
            onClick={handleLeaveGroup}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition border border-red-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Napusti grupu
          </button>
        )}
      </div>
    </div>
  )
}