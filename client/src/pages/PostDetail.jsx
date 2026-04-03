import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getPostById, createComment, deleteComment, deletePost } from '../api/community'

const CATEGORY_LABELS = {
  OBAVJESTENJE: 'Obavještenje',
  PITANJE: 'Pitanje',
  DISKUSIJA: 'Diskusija',
  OGLAS: 'Oglas',
  OSTALO: 'Ostalo'
}

const CATEGORY_COLORS = {
  OBAVJESTENJE: 'bg-blue-50 text-blue-600',
  PITANJE: 'bg-purple-50 text-purple-600',
  DISKUSIJA: 'bg-green-50 text-green-600',
  OGLAS: 'bg-amber-50 text-amber-600',
  OSTALO: 'bg-gray-100 text-gray-500',
}

export default function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await getPostById(id)
        setPost(data)
      } catch (err) {
        navigate('/community')
      } finally {
        setLoading(false)
      }
    }
    fetchPost()
  }, [id])

  const handleComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    setCommentLoading(true)
    try {
      const data = await createComment(id, { content: comment })
      setPost({ ...post, comments: [...post.comments, data.comment] })
      setComment('')
    } catch (err) {
      console.error(err)
    } finally {
      setCommentLoading(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(id, commentId)
      setPost({ ...post, comments: post.comments.filter(c => c.id !== commentId) })
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeletePost = async () => {
    if (!confirm('Obrisati post?')) return
    try {
      await deletePost(id)
      navigate('/community')
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Učitavanje...</p>
    </div>
  )

  if (!post) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/community')} className="text-gray-400 hover:text-gray-600">
          Nazad na Community
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Post */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          {post.isPinned && (
            <span className="text-xs text-indigo-500 font-medium mb-3 block">📌 Pinned</span>
          )}

          <div className="flex items-start justify-between mb-4">
            <div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[post.category]}`}>
                {CATEGORY_LABELS[post.category]}
              </span>
              <h1 className="text-2xl font-bold text-gray-800 mt-2">{post.title}</h1>
            </div>
            {user.id === post.authorId && (
              <button
                onClick={handleDeletePost}
                className="text-gray-300 hover:text-red-400 transition"
              >
                ✕
              </button>
            )}
          </div>

          <p className="text-gray-600 leading-relaxed mb-6 whitespace-pre-wrap">{post.content}</p>

          <div className="text-sm text-gray-400 border-t border-gray-50 pt-4">
            Objavio: {post.author?.firstName} {post.author?.lastName}
            {post.author?.faculty && ` · ${post.author.faculty}`}
            <span className="mx-2">·</span>
            {new Date(post.createdAt).toLocaleDateString('bs-BA')}
          </div>
        </div>

        {/* Komentari */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">
            Komentari ({post.comments?.length || 0})
          </h2>

          {/* Forma za komentar */}
          <form onSubmit={handleComment} className="flex gap-3 mb-6">
            <input
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Napiši komentar..."
              className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <button
              type="submit"
              disabled={commentLoading || !comment.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm transition disabled:opacity-50"
            >
              Pošalji
            </button>
          </form>

          {/* Lista komentara */}
          {post.comments?.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">
              Nema komentara. Budi prvi!
            </p>
          ) : (
            <div className="space-y-3">
              {post.comments?.map(c => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs font-bold flex-shrink-0">
                    {c.author?.firstName?.[0]}{c.author?.lastName?.[0]}
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">
                        {c.author?.firstName} {c.author?.lastName}
                        {c.author?.faculty && ` · ${c.author.faculty}`}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {new Date(c.createdAt).toLocaleDateString('bs-BA')}
                        </span>
                        {user.id === c.authorId && (
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            className="text-gray-300 hover:text-red-400 transition text-xs"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}