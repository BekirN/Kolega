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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 text-lg">Nova grupa</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Naziv grupe */}
          <div>
            <label className="text-sm text-gray-600 mb-1.5 block font-medium">Naziv grupe *</label>
            <input
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="npr. Informatika 3. godina"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {/* Odabrani korisnici */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map(u => (
                <span
                  key={u.id}
                  className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 text-xs px-3 py-1.5 rounded-full"
                >
                  {u.firstName} {u.lastName}
                  <button
                    onClick={() => toggleUser(u)}
                    className="text-indigo-400 hover:text-indigo-700"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Pretraga */}
          <div>
            <label className="text-sm text-gray-600 mb-1.5 block font-medium">
              Dodaj članove * <span className="text-gray-400 font-normal">(min. 2)</span>
            </label>
            <div className="relative">
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Pretraži studente..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              {searching && (
                <div className="absolute right-3 top-3">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Rezultati */}
            {searchResults.length > 0 && (
              <div className="mt-2 border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                {searchResults.map(u => (
                  <button
                    key={u.id}
                    onClick={() => toggleUser(u)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left border-b border-gray-50 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                      {u.profileImage ? (
                        <img src={u.profileImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                          {u.firstName?.[0]}{u.lastName?.[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 font-medium">
                        {u.firstName} {u.lastName}
                      </p>
                      {u.faculty && (
                        <p className="text-xs text-gray-400">{u.faculty}</p>
                      )}
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedUsers.find(s => s.id === u.id)
                        ? 'bg-indigo-600 border-indigo-600'
                        : 'border-gray-300'
                    }`}>
                      {selectedUsers.find(s => s.id === u.id) && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition"
          >
            Odustani
          </button>
          <button
            onClick={handleCreate}
            disabled={!groupName.trim() || selectedUsers.length < 2 || loading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm transition disabled:opacity-40"
          >
            {loading ? 'Kreiranje...' : `Kreiraj grupu (${selectedUsers.length})`}
          </button>
        </div>
      </div>
    </div>
  )
}