import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyBookings, getTutorBookings, updateBookingStatus } from '../api/tutoring'

const STATUS_LABELS = {
  PENDING: { label: 'Na čekanju', color: 'bg-yellow-50 text-yellow-600' },
  CONFIRMED: { label: 'Potvrđen', color: 'bg-green-50 text-green-600' },
  CANCELLED: { label: 'Otkazan', color: 'bg-red-50 text-red-500' },
  COMPLETED: { label: 'Završen', color: 'bg-gray-100 text-gray-500' },
}

export default function MyBookings() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('student')
  const [studentBookings, setStudentBookings] = useState([])
  const [tutorBookings, setTutorBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true)
      try {
        const [sBookings, tBookings] = await Promise.allSettled([
          getMyBookings(),
          getTutorBookings(),
        ])
        if (sBookings.status === 'fulfilled') setStudentBookings(sBookings.value)
        if (tBookings.status === 'fulfilled') setTutorBookings(tBookings.value)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [])

  const handleStatusUpdate = async (bookingId, status) => {
    try {
      await updateBookingStatus(bookingId, status)
      const updated = await getTutorBookings()
      setTutorBookings(updated)
    } catch (err) {
      console.error(err)
    }
  }

  const bookings = tab === 'student' ? studentBookings : tutorBookings

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/tutoring')} className="text-gray-400 hover:text-gray-600">
          ← Nazad
        </button>
        <h1 className="font-semibold text-gray-800">Moji termini</h1>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('student')}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              tab === 'student'
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600'
            }`}
          >
            Moje rezervacije ({studentBookings.length})
          </button>
          <button
            onClick={() => setTab('tutor')}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              tab === 'tutor'
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600'
            }`}
          >
            Zahtjevi za moje instrukcije ({tutorBookings.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Učitavanje...</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Nema termina</div>
        ) : (
          <div className="space-y-3">
            {bookings.map(booking => (
              <div key={booking.id} className="bg-white border border-gray-100 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-800">{booking.subject}</h3>
                    <p className="text-sm text-gray-500">
                      {tab === 'student'
                        ? `Tutor: ${booking.tutor?.user?.firstName} ${booking.tutor?.user?.lastName}`
                        : `Student: ${booking.student?.firstName} ${booking.student?.lastName}`
                      }
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_LABELS[booking.status]?.color}`}>
                    {STATUS_LABELS[booking.status]?.label}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <span>📅 {new Date(booking.date).toLocaleString('bs-BA')}</span>
                  <span>·</span>
                  <span>⏱ {booking.duration} min</span>
                  <span>·</span>
                  <span className="font-medium text-indigo-600">{booking.price} KM</span>
                </div>

                {booking.message && (
                  <p className="text-sm text-gray-400 italic mb-3">"{booking.message}"</p>
                )}

                {tab === 'tutor' && booking.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusUpdate(booking.id, 'CONFIRMED')}
                      className="flex-1 bg-green-50 text-green-600 border border-green-200 py-1.5 rounded-lg text-sm hover:bg-green-100 transition"
                    >
                      Potvrdi
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(booking.id, 'CANCELLED')}
                      className="flex-1 bg-red-50 text-red-500 border border-red-200 py-1.5 rounded-lg text-sm hover:bg-red-100 transition"
                    >
                      Odbij
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}