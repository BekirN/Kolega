import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getShopItems, deleteShopItem } from '../api/shop'

const CATEGORIES = ['Sve', 'KNJIGE', 'SKRIPTA', 'ELEKTRONIKA', 'OPREMA', 'OSTALO']
const CONDITIONS = { NEW: 'Novo', LIKE_NEW: 'Kao novo', GOOD: 'Dobro', FAIR: 'Prihvatljivo' }
const CATEGORY_LABELS = { KNJIGE: 'Knjige', SKRIPTA: 'Skripta', ELEKTRONIKA: 'Elektronika', OPREMA: 'Oprema', OSTALO: 'Ostalo' }

export default function Shop() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Sve')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const fetchItems = async () => {
    setLoading(true)
    try {
      const filters = {}
      if (search) filters.search = search
      if (category !== 'Sve') filters.category = category
      const data = await getShopItems(filters)
      setItems(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [category])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchItems()
  }

  const handleDelete = async (id) => {
    if (!confirm('Jesi li siguran da želiš obrisati oglas?')) return
    try {
      await deleteShopItem(id)
      setItems(items.filter(i => i.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate('/dashboard')} className="text-xl font-bold text-indigo-600">
          KOLEGA
        </button>
        <span className="text-gray-600 font-medium">🛍️ Student Shop</span>
        <button
          onClick={() => navigate('/shop/new')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg transition"
        >
          + Novi oglas
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Search i filteri */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
          <form onSubmit={handleSearch} className="flex gap-3 mb-4">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pretraži oglase..."
              className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm transition"
            >
              Pretraži
            </button>
          </form>

          {/* Kategorije */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm transition ${
                  category === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat === 'Sve' ? 'Sve' : CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Rezultati */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Učitavanje...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Nema oglasa</p>
            <button
              onClick={() => navigate('/shop/new')}
              className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-indigo-700 transition"
            >
              Dodaj prvi oglas
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(item => (
              <div
                key={item.id}
                className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-all"
              >
                {/* Kategorija i stanje */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full">
                    {CATEGORY_LABELS[item.category]}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                    {CONDITIONS[item.condition]}
                  </span>
                </div>

                {/* Naziv i opis */}
                <h3 className="font-semibold text-gray-800 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{item.description}</p>

                {/* Cijena */}
                <p className="text-xl font-bold text-indigo-600 mb-3">{item.price} KM</p>

                {/* Prodavač */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {item.seller?.firstName} {item.seller?.lastName}
                    {item.seller?.faculty && ` · ${item.seller.faculty}`}
                  </span>
                </div>

                {/* Akcije */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => navigate(`/shop/${item.id}`)}
                    className="flex-1 border border-indigo-200 text-indigo-600 text-sm py-1.5 rounded-lg hover:bg-indigo-50 transition"
                  >
                    Pogledaj
                  </button>
                  {user.id === item.sellerId && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="border border-red-200 text-red-500 text-sm px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
                    >
                      Obriši
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}