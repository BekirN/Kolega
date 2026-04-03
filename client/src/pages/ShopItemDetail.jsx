import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getShopItemById, deleteShopItem } from '../api/shop'

const CONDITIONS = { NEW: 'Novo', LIKE_NEW: 'Kao novo', GOOD: 'Dobro', FAIR: 'Prihvatljivo' }
const CATEGORY_LABELS = { KNJIGE: 'Knjige', SKRIPTA: 'Skripta', ELEKTRONIKA: 'Elektronika', OPREMA: 'Oprema', OSTALO: 'Ostalo' }

export default function ShopItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const data = await getShopItemById(id)
        setItem(data)
      } catch (err) {
        console.error(err)
        navigate('/shop')
      } finally {
        setLoading(false)
      }
    }
    fetchItem()
  }, [id, navigate])

  const handleDelete = async () => {
    if (!confirm('Jesi li siguran da zelis obrisati oglas?')) return
    try {
      await deleteShopItem(id)
      navigate('/shop')
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Ucitavanje...</p>
    </div>
  )

  if (!item) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/shop')} className="text-gray-400 hover:text-gray-600">
          Nazad na Shop
        </button>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full">
              {CATEGORY_LABELS[item.category]}
            </span>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
              {CONDITIONS[item.condition]}
            </span>
            {!item.isAvailable && (
              <span className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded-full">
                Prodano
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-2">{item.title}</h1>
          <p className="text-3xl font-bold text-indigo-600 mb-4">{item.price} KM</p>

          {item.description && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Opis</h3>
              <p className="text-gray-700 text-sm leading-relaxed">{item.description}</p>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Prodavac</h3>
            <p className="font-semibold text-gray-800">
              {item.seller?.firstName} {item.seller?.lastName}
            </p>
            {item.seller?.faculty && (
              <p className="text-sm text-gray-500">{item.seller.faculty}</p>
            )}

            {user.id !== item.sellerId && (
              <a
                href={`mailto:${item.seller?.email}`}
                className="inline-block mt-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg transition"
              >
                Kontaktiraj prodavaca
              </a>
            )}
          </div>

          <p className="text-xs text-gray-400 mb-4">
            Objavljeno: {new Date(item.createdAt).toLocaleDateString('bs-BA')}
          </p>

          {user.id === item.sellerId && (
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={handleDelete}
                className="flex-1 border border-red-200 text-red-500 py-2.5 rounded-lg text-sm hover:bg-red-50 transition"
              >
                Obrisi oglas
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
