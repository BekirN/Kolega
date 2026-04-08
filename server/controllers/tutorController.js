const prisma = require('../prisma/client')
const { createActivity } = require('../utils/activityHelper')
const { sendBookingConfirmationEmail } = require('../config/mailgun')

const getTutors = async (req, res) => {
  try {
    const { search } = req.query

    const filters = { isActive: true }

    if (search) {
      filters.OR = [
        { bio: { contains: search, mode: 'insensitive' } },
        { subjects: { has: search } },
        {
          user: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
            ]
          }
        }
      ]
    }

    const tutors = await prisma.tutorProfile.findMany({
      where: filters,
      include: {
        user: {
          select: {
            id: true, firstName: true, lastName: true,
            faculty: true, university: true, profileImage: true,
          }
        },
        reviews: { select: { rating: true } },
        _count: { select: { bookings: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    const tutorsWithRating = tutors.map(tutor => {
      const avgRating = tutor.reviews.length > 0
        ? tutor.reviews.reduce((sum, r) => sum + r.rating, 0) / tutor.reviews.length
        : 0
      return {
        ...tutor,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: tutor.reviews.length,
      }
    })

    res.json(tutorsWithRating)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const getTutorById = async (req, res) => {
  try {
    const tutor = await prisma.tutorProfile.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true, firstName: true, lastName: true,
            faculty: true, university: true, email: true,
          }
        },
        reviews: { orderBy: { createdAt: 'desc' } },
        bookings: {
          where: {
            status: { in: ['PENDING', 'CONFIRMED'] },
            date: { gte: new Date() }
          },
          select: { date: true, duration: true, status: true }
        }
      }
    })

    if (!tutor) return res.status(404).json({ message: 'Tutor nije pronađen' })

    const avgRating = tutor.reviews.length > 0
      ? tutor.reviews.reduce((sum, r) => sum + r.rating, 0) / tutor.reviews.length
      : 0

    res.json({
      ...tutor,
      averageRating: Math.round(avgRating * 10) / 10,
      reviewCount: tutor.reviews.length,
    })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const createTutorProfile = async (req, res) => {
  try {
    const { bio, hourlyRate, subjects } = req.body

    if (!hourlyRate || !subjects || subjects.length === 0) {
      return res.status(400).json({ message: 'Satnica i predmeti su obavezni' })
    }

    const existing = await prisma.tutorProfile.findUnique({
      where: { userId: req.user.userId }
    })
    if (existing) {
      return res.status(400).json({ message: 'Već imate tutor profil' })
    }

    const tutor = await prisma.tutorProfile.create({
      data: {
        bio,
        hourlyRate: parseFloat(hourlyRate),
        subjects: Array.isArray(subjects) ? subjects : subjects.split(',').map(s => s.trim()),
        userId: req.user.userId,
      },
      include: {
        user: { select: { firstName: true, lastName: true, faculty: true } }
      }
    })

    res.status(201).json({ message: 'Tutor profil kreiran!', tutor })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const updateTutorProfile = async (req, res) => {
  try {
    const tutor = await prisma.tutorProfile.findUnique({
      where: { userId: req.user.userId }
    })
    if (!tutor) return res.status(404).json({ message: 'Tutor profil nije pronađen' })

    const { bio, hourlyRate, subjects, isActive } = req.body

    const updated = await prisma.tutorProfile.update({
      where: { userId: req.user.userId },
      data: {
        ...(bio !== undefined && { bio }),
        ...(hourlyRate && { hourlyRate: parseFloat(hourlyRate) }),
        ...(subjects && {
          subjects: Array.isArray(subjects) ? subjects : subjects.split(',').map(s => s.trim())
        }),
        ...(isActive !== undefined && { isActive }),
      }
    })

    res.json({ message: 'Profil ažuriran!', tutor: updated })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const createBooking = async (req, res) => {
  try {
    const { subject, date, duration, message } = req.body
    const { id } = req.params

    if (!subject || !date || !duration) {
      return res.status(400).json({ message: 'Predmet, datum i trajanje su obavezni' })
    }

    const tutor = await prisma.tutorProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } }
      }
    })
    if (!tutor) return res.status(404).json({ message: 'Tutor nije pronađen' })

    if (tutor.userId === req.user.userId) {
      return res.status(400).json({ message: 'Ne možete rezervisati vlastite instrukcije' })
    }

    const price = (tutor.hourlyRate / 60) * parseInt(duration)

    const booking = await prisma.tutorBooking.create({
      data: {
        subject,
        date: new Date(date),
        duration: parseInt(duration),
        message,
        price: Math.round(price * 100) / 100,
        tutorId: id,
        studentId: req.user.userId,
      },
      include: {
        tutor: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } }
          }
        },
        student: {
          select: { firstName: true, lastName: true }
        }
      }
    })

    // Aktivnost za tutora
    await createActivity({
      type: 'BOOKING_REQUEST',
      message: `${booking.student.firstName} ${booking.student.lastName} je zakazao/la instrukcije iz predmeta "${subject}"`,
      userId: tutor.userId,
      actorId: req.user.userId,
      referenceId: booking.id,
      link: `/tutoring/my-bookings`,
    })

    res.status(201).json({ message: 'Termin rezervisan!', booking })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const getMyBookings = async (req, res) => {
  try {
    const bookings = await prisma.tutorBooking.findMany({
      where: { studentId: req.user.userId },
      include: {
        tutor: {
          include: {
            user: { select: { firstName: true, lastName: true, faculty: true } }
          }
        }
      },
      orderBy: { date: 'asc' }
    })
    res.json(bookings)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const getTutorBookings = async (req, res) => {
  try {
    const tutor = await prisma.tutorProfile.findUnique({
      where: { userId: req.user.userId }
    })
    if (!tutor) return res.status(404).json({ message: 'Nemate tutor profil' })

    const bookings = await prisma.tutorBooking.findMany({
      where: { tutorId: tutor.id },
      include: {
        student: { select: { firstName: true, lastName: true, faculty: true, email: true } }
      },
      orderBy: { date: 'asc' }
    })
    res.json(bookings)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body
    const { bookingId } = req.params

    const booking = await prisma.tutorBooking.findUnique({
      where: { id: bookingId },
      include: {
        tutor: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        },
        student: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    })

    if (!booking) return res.status(404).json({ message: 'Booking nije pronađen' })
    if (booking.tutor.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Nemate pristup ovom bookingu' })
    }

    const updated = await prisma.tutorBooking.update({
      where: { id: bookingId },
      data: { status }
    })

    if (status === 'CONFIRMED') {
      // Aktivnost
      await createActivity({
        type: 'BOOKING_CONFIRMED',
        message: `Tvoj termin za instrukcije iz "${booking.subject}" je potvrđen! ✅`,
        userId: booking.studentId,
        actorId: booking.tutor.userId,
        referenceId: booking.id,
        link: `/tutoring/my-bookings`,
      })

      // Email studentu
      if (booking.student?.email) {
        try {
          const { sendBookingConfirmationEmail } = require('../config/mailgun')
          await sendBookingConfirmationEmail(
            booking.student.email,
            booking.student.firstName,
            booking.subject,
            booking.date,
            `${booking.tutor.user.firstName} ${booking.tutor.user.lastName}`
          )
        } catch (emailErr) {
          console.error('Email greška (booking confirmed):', emailErr.message)
        }
      }

    } else if (status === 'CANCELLED') {
      // Aktivnost
      await createActivity({
        type: 'BOOKING_CANCELLED',
        message: `Tvoj termin za instrukcije iz "${booking.subject}" je otkazan.`,
        userId: booking.studentId,
        actorId: booking.tutor.userId,
        referenceId: booking.id,
        link: `/tutoring/my-bookings`,
      })

      // Email studentu o otkazivanju
      if (booking.student?.email) {
        try {
          const { sendBookingCancelledEmail } = require('../config/mailgun')
          await sendBookingCancelledEmail(
            booking.student.email,
            booking.student.firstName,
            booking.subject,
            booking.date,
            `${booking.tutor.user.firstName} ${booking.tutor.user.lastName}`
          )
        } catch (emailErr) {
          console.error('Email greška (booking cancelled):', emailErr.message)
        }
      }
    }

    res.json({ message: 'Status ažuriran!', booking: updated })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const createTutorReview = async (req, res) => {
  try {
    const { rating, comment } = req.body
    const { id } = req.params

    if (!rating) return res.status(400).json({ message: 'Ocjena je obavezna' })

    const review = await prisma.tutorReview.create({
      data: {
        rating: parseInt(rating),
        comment,
        tutorId: id,
      }
    })

    res.status(201).json({ message: 'Recenzija dodana!', review })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

module.exports = {
  getTutors,
  getTutorById,
  createTutorProfile,
  updateTutorProfile,
  createBooking,
  getMyBookings,
  getTutorBookings,
  updateBookingStatus,
  createTutorReview,
}