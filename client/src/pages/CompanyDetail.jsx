import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCompanyById, createReview } from '../api/companies'

const SIZE_LABELS = { SMALL: 'Mala (1-50)', MEDIUM: 'Srednja (51-200)', LARGE: 'Velika (200+)' }

export default function CompanyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewData, setReviewData] = useState({
    rating: 5,
    title: '',
    comment: '',
    position: '',
    year: '',
    mentorshipRating: 5,
    workEnvironmentRating: 5,
    learningRating: 5,
    paymentRating: 5,
  })
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState('')

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const data = await getCompanyById(id)
        setCompany(data)
      } catch (err) {
        console.error(err)
        navigate('/companies')
      } finally {
        setLoading(false)
      }
    }
    fetchCompany()
  }, [id])

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    setReviewLoading(true)
    setReviewError('')
    try {
      await createReview(id, reviewData)
      const updated = await getCompanyById(id)
      setCompany(updated)
      setShowReviewForm(false)
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Greška pri dodavanju recenzije')
    } finally {
      setReviewLoading(false)
    }
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}>
        ★
      </span>
    ))
  }

  const StarSelect = ({ name, value }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => setReviewData({ ...reviewData, [name]: star })}
          className={`text-2xl ${star <= value ? 'text-yellow-400' : 'text-gray-200'}`}
        >
          ★
        </button>
      ))}
    </div>
  )

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Učitavanje...</p>
    </div>
  )

  if (!company) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/companies')} className="text-gray-400 hover:text-gray-600">
          Nazad na firme
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Header firme */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{company.name}</h1>
              <p className="text-indigo-600 font-medium">{company.industry}</p>
            </div>
            {company.averageRating > 0 && (
              <div className="text-right">
                <div className="flex text-xl">{renderStars(company.averageRating)}</div>
                <p className="text-sm text-gray-400">{company.averageRating} / 5</p>
                <p className="text-xs text-gray-400">{company.reviewCount} recenzija</p>
              </div>
            )}
          </div>

          {company.description && (
            <p className="text-gray-600 mb-4">{company.description}</p>
          )}

          {/* Kontakt info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {company.city && (
              <div className="flex items-center gap-2 text-gray-500">
                <span>📍</span> {company.city}
              </div>
            )}
            {company.size && (
              <div className="flex items-center gap-2 text-gray-500">
                <span>👥</span> {SIZE_LABELS[company.size]}
              </div>
            )}
            {company.email && (
              <div className="flex items-center gap-2 text-gray-500">
                <span>✉️</span>
                <a href={"mailto:" + company.email} className="text-indigo-600 hover:underline">
                  {company.email}
                </a>
              </div>
            )}
            {company.phone && (
              <div className="flex items-center gap-2 text-gray-500">
                <span>📞</span> {company.phone}
              </div>
            )}
            {company.website && (
              <div className="flex items-center gap-2 text-gray-500">
                <span>🌐</span>
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                  {company.website}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Prakse */}
        {company.internships?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Otvorene prakse</h2>
            <div className="space-y-3">
              {company.internships.map(internship => (
                <div key={internship.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-800">{internship.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      internship.isPaid ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {internship.isPaid ? `Plaćena · ${internship.salary} KM/mj` : 'Neplaćena'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{internship.description}</p>
                  {internship.requirements && (
                    <p className="text-xs text-gray-400">
                      Zahtjevi: {internship.requirements}
                    </p>
                  )}
                  {internship.duration && (
                    <p className="text-xs text-gray-400">Trajanje: {internship.duration}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recenzije */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Recenzije ({company.reviews?.length || 0})
            </h2>
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg transition"
            >
              {showReviewForm ? 'Odustani' : '+ Dodaj recenziju'}
            </button>
          </div>

          {/* Forma za recenziju */}
          {showReviewForm && (
            <form onSubmit={handleReviewSubmit} className="border border-indigo-100 rounded-xl p-4 mb-6 bg-indigo-50">
              <h3 className="font-medium text-gray-800 mb-4">Nova recenzija</h3>

              {reviewError && (
                <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">
                  {reviewError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Ukupna ocjena</label>
                  <StarSelect name="rating" value={reviewData.rating} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Pozicija</label>
                    <input
                      value={reviewData.position}
                      onChange={e => setReviewData({ ...reviewData, position: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      placeholder="npr. Frontend Intern"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Godina prakse</label>
                    <input
                      type="number"
                      value={reviewData.year}
                      onChange={e => setReviewData({ ...reviewData, year: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      placeholder="2024"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Naslov recenzije *</label>
                  <input
                    value={reviewData.title}
                    onChange={e => setReviewData({ ...reviewData, title: e.target.value })}
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="Kratki opis iskustva"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Komentar *</label>
                  <textarea
                    value={reviewData.comment}
                    onChange={e => setReviewData({ ...reviewData, comment: e.target.value })}
                    required
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                    placeholder="Opiši svoje iskustvo prakse..."
                  />
                </div>

                {/* Detaljne ocjene */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Mentorstvo</label>
                    <StarSelect name="mentorshipRating" value={reviewData.mentorshipRating} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Radna atmosfera</label>
                    <StarSelect name="workEnvironmentRating" value={reviewData.workEnvironmentRating} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Učenje</label>
                    <StarSelect name="learningRating" value={reviewData.learningRating} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Naknada</label>
                    <StarSelect name="paymentRating" value={reviewData.paymentRating} />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm transition disabled:opacity-50"
                >
                  {reviewLoading ? 'Slanje...' : 'Objavi recenziju'}
                </button>
              </div>
            </form>
          )}

          {/* Lista recenzija */}
          {company.reviews?.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">
              Još nema recenzija. Budi prvi!
            </p>
          ) : (
            <div className="space-y-4">
              {company.reviews?.map(review => (
                <div key={review.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-800">{review.title}</p>
                      <p className="text-xs text-gray-400">
                        {review.reviewer?.firstName} {review.reviewer?.lastName}
                        {review.position && ` · ${review.position}`}
                        {review.year && ` · ${review.year}`}
                      </p>
                    </div>
                    <div className="flex text-sm">{renderStars(review.rating)}</div>
                  </div>
                  <p className="text-sm text-gray-600">{review.comment}</p>

                  {/* Detaljne ocjene */}
                  {(review.mentorshipRating || review.workEnvironmentRating) && (
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-50">
                      {review.mentorshipRating && (
                        <div className="text-xs text-gray-400">
                          Mentorstvo: <span className="text-yellow-500">{'★'.repeat(review.mentorshipRating)}</span>
                        </div>
                      )}
                      {review.workEnvironmentRating && (
                        <div className="text-xs text-gray-400">
                          Atmosfera: <span className="text-yellow-500">{'★'.repeat(review.workEnvironmentRating)}</span>
                        </div>
                      )}
                      {review.learningRating && (
                        <div className="text-xs text-gray-400">
                          Učenje: <span className="text-yellow-500">{'★'.repeat(review.learningRating)}</span>
                        </div>
                      )}
                      {review.paymentRating && (
                        <div className="text-xs text-gray-400">
                          Naknada: <span className="text-yellow-500">{'★'.repeat(review.paymentRating)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}