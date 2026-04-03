import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getTutorById, createBooking, createTutorReview } from '../api/tutoring'

const STATUS_LABELS = {
  PENDING: { label: 'Na čekanju', color: 'bg-yellow-50 text-yellow-600' },
  CONFIRMED: { label: 'Potvrđen', color: 'bg-green-50 text-green-600' },
  CANCELLED: { label: 'Otkazan', color: 'bg-red-50 text-red-500' },
  COMPLETED: { label: 'Završen', color: 'bg-gray-100 text-gray-500' },
}

export default function TutorDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tutor, setTutor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [bookingData, setBookingData] = useState({
    subject: '',
    date: '',
    duration: '60',
    message: '',
  })
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' })
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    const fetchTutor = async () => {
      try {
        const data = await getTutorById(id)
        setTutor(data)
      } catch (err) {
        navigate('/tutoring')
      } finally {
        setLoading(false)
      }
    }
    fetchTutor()
  }, [id])

  const handleBooking = async (e) => {
    e.preventDefault()
    setBookingLoading(true)
    setBookingError('')
    try {
      await createBooking(id, bookingData)
      setShowBookingForm(false)
      alert('Termin uspješno rezervisan! Tutor će potvrditi termin.')
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Greška pri rezervaciji')
    } finally {
      setBookingLoading(false)
    }
  }

  const handleReview = async (e) => {
    e.preventDefault()
    try {
      await createTutorReview(id, reviewData)
      const updated = await getTutorById(id)
      setTutor(updated)
      setShowReviewForm(false)
    } catch (err) {
      console.error(err)
    }
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}>★</span>
    ))
  }

  const calculatePrice = () => {
    if (!tutor || !bookingData.duration) return 0
    return Math.round((tutor.hourlyRate / 60) * parseInt(bookingData.duration) * 100) / 100
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Učitavanje...</p>
    </div>
  )

  if (!tutor) return null

  const isOwnProfile = tutor.user?.id === user.id

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/tutoring')} className="text-gray-400 hover:text-gray-600">
          Nazad na instrukcije
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Profil tutora */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-2xl">
                {tutor.user?.firstName?.[0]}{tutor.user?.lastName?.[0]}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {tutor.user?.firstName} {tutor.user?.lastName}
                </h1>
                {tutor.user?.faculty && (
                  <p className="text-gray-500">{tutor.user.faculty}</p>
                )}
                {tutor.averageRating > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <div className="flex">{renderStars(tutor.averageRating)}</div>
                    <span className="text-sm text-gray-400">
                      {tutor.averageRating} ({tutor.reviewCount} recenzija)
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-indigo-600">{tutor.hourlyRate} KM/h</p>
            </div>
          </div>

          {tutor.bio && (
            <p className="text-gray-600 mb-4">{tutor.bio}</p>
          )}

          {/* Predmeti */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-600 mb-2">Predmeti:</p>
            <div className="flex flex-wrap gap-2">
              {tutor.subjects?.map((subject, i) => (
                <span key={i} className="bg-indigo-50 text-indigo-600 text-sm px-3 py-1 rounded-full">
                  {subject}
                </span>
              ))}
            </div>
          </div>

          {/* Akcije */}
          {!isOwnProfile && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowBookingForm(!showBookingForm)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg transition"
              >
                {showBookingForm ? 'Odustani' : 'Rezerviši termin'}
              </button>
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="border border-indigo-200 text-indigo-600 px-4 py-2.5 rounded-lg hover:bg-indigo-50 transition"
              >
                Ostavi recenziju
              </button>
            </div>
          )}
        </div>

        {/* Booking forma */}
        {showBookingForm && (
          <div className="bg-white rounded-2xl border border-indigo-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Rezerviši termin</h2>

            {bookingError && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
                {bookingError}
              </div>
            )}

            <form onSubmit={handleBooking} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Predmet *</label>
                <input
                  value={bookingData.subject}
                  onChange={e => setBookingData({ ...bookingData, subject: e.target.value })}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="npr. Matematička analiza"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Datum i vrijeme *</label>
                  <input
                    type="datetime-local"
                    value={bookingData.date}
                    onChange={e => setBookingData({ ...bookingData, date: e.target.value })}
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Trajanje</label>
                  <select
                    value={bookingData.duration}
                    onChange={e => setBookingData({ ...bookingData, duration: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    <option value="30">30 minuta</option>
                    <option value="60">1 sat</option>
                    <option value="90">1.5 sat</option>
                    <option value="120">2 sata</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">Poruka tutoru</label>
                <textarea
                  value={bookingData.message}
                  onChange={e => setBookingData({ ...bookingData, message: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                  placeholder="Opiši šta ti treba pomoć..."
                />
              </div>

              {/* Cijena kalkulacija */}
              <div className="bg-indigo-50 rounded-lg p-3 flex items-center justify-between">
                <span className="text-sm text-indigo-600">Ukupna cijena:</span>
                <span className="font-bold text-indigo-600">{calculatePrice()} KM</span>
              </div>

              <button
                type="submit"
                disabled={bookingLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg transition disabled:opacity-50"
              >
                {bookingLoading ? 'Rezervisanje...' : 'Potvrdi rezervaciju'}
              </button>
            </form>
          </div>
        )}

        {/* Review forma */}
        {showReviewForm && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Ostavi recenziju</h2>
            <form onSubmit={handleReview} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Ocjena</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewData({ ...reviewData, rating: star })}
                      className={`text-3xl ${star <= reviewData.rating ? 'text-yellow-400' : 'text-gray-200'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Komentar</label>
                <textarea
                  value={reviewData.comment}
                  onChange={e => setReviewData({ ...reviewData, comment: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                  placeholder="Kako bi opisao instruktora?"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg transition"
              >
                Objavi recenziju
              </button>
            </form>
          </div>
        )}

        {/* Recenzije */}
        {tutor.reviews?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Recenzije ({tutor.reviews.length})
            </h2>
            <div className="space-y-3">
              {tutor.reviews.map(review => (
                <div key={review.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex">{renderStars(review.rating)}</div>
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString('bs-BA')}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}