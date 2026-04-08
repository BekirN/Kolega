const prisma = require('../prisma/client')
const { createActivity } = require('../utils/activityHelper')
const { sendNewInternshipEmail } = require('../config/mailgun')
const getCompanies = async (req, res) => {
  try {
    const { search, industry, city } = req.query
    const filters = {}

    if (search) {
      filters.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (industry) filters.industry = { contains: industry, mode: 'insensitive' }
    if (city) filters.city = { contains: city, mode: 'insensitive' }

    const companies = await prisma.company.findMany({
      where: filters,
      include: {
        internships: {
          where: { isActive: true },
          select: { id: true, title: true, isPaid: true }
        },
        _count: { select: { reviews: true } }
      },
      orderBy: { averageRating: 'desc' }
    })

    res.json(companies)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const getCompanyById = async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.params.id },
      include: {
        internships: { where: { isActive: true } },
        reviews: {
          include: {
            reviewer: {
              select: { firstName: true, lastName: true, faculty: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: { select: { reviews: true } }
      }
    })

    if (!company) return res.status(404).json({ message: 'Firma nije pronađena' })
    res.json(company)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const createCompany = async (req, res) => {
  try {
    const { name, description, industry, website, email, phone, address, city, size } = req.body

    if (!name || !industry) {
      return res.status(400).json({ message: 'Naziv i industrija su obavezni' })
    }

    const company = await prisma.company.create({
      data: { name, description, industry, website, email, phone, address, city, size }
    })

    res.status(201).json({ message: 'Firma kreirana!', company })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const createInternship = async (req, res) => {
  try {
    const { title, description, requirements, duration, isPaid, salary, deadline } = req.body
    const { id } = req.params

    const company = await prisma.company.findUnique({ where: { id } })
    if (!company) return res.status(404).json({ message: 'Firma nije pronađena' })

    const internship = await prisma.internship.create({
      data: {
        title, description, requirements, duration,
        isPaid: isPaid || false,
        salary: salary ? parseFloat(salary) : null,
        deadline: deadline ? new Date(deadline) : null,
        companyId: id,
      }
    })
    // Pošalji email svim korisnicima
    try {
      const users = await prisma.user.findMany({
        where: { emailVerified: true },
        select: { email: true, firstName: true }
      })

      // Pošalji u batch (max 10 istovremeno)
      const batchSize = 10
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize)
        await Promise.allSettled(
          batch.map(u => sendNewInternshipEmail(
            u.email, u.firstName, company.name, internship.title
          ))
        )
      }
    } catch (emailErr) {
      console.error('Email notifikacija greška:', emailErr)
    }

    res.status(201).json({ message: 'Praksa kreirana!', internship })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const createReview = async (req, res) => {
  try {
    const {
      rating, title, comment, position, year,
      mentorshipRating, workEnvironmentRating,
      learningRating, paymentRating
    } = req.body
    const { id } = req.params

    if (!rating || !title || !comment) {
      return res.status(400).json({ message: 'Ocjena, naslov i komentar su obavezni' })
    }

    const existing = await prisma.internshipReview.findFirst({
      where: { companyId: id, reviewerId: req.user.userId }
    })
    if (existing) {
      return res.status(400).json({ message: 'Već ste ostavili recenziju za ovu firmu' })
    }

    const company = await prisma.company.findUnique({ where: { id } })

    const review = await prisma.internshipReview.create({
      data: {
        rating: parseInt(rating),
        title, comment, position,
        year: year ? parseInt(year) : null,
        mentorshipRating: mentorshipRating ? parseInt(mentorshipRating) : null,
        workEnvironmentRating: workEnvironmentRating ? parseInt(workEnvironmentRating) : null,
        learningRating: learningRating ? parseInt(learningRating) : null,
        paymentRating: paymentRating ? parseInt(paymentRating) : null,
        companyId: id,
        reviewerId: req.user.userId,
      }
    })

    // Ažuriraj prosječnu ocjenu
    const allReviews = await prisma.internshipReview.findMany({
      where: { companyId: id },
      select: { rating: true }
    })
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length

    await prisma.company.update({
      where: { id },
      data: {
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: allReviews.length
      }
    })

    // Aktivnost za samog korisnika
    await createActivity({
      type: 'INTERNSHIP_REVIEW',
      message: `Uspješno si ostavio/la recenziju za firmu "${company.name}" 🏢`,
      userId: req.user.userId,
      actorId: req.user.userId,
      referenceId: id,
      link: `/companies/${id}`,
    })

    res.status(201).json({ message: 'Recenzija dodana!', review })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

module.exports = {
  getCompanies,
  getCompanyById,
  createCompany,
  createInternship,
  createReview
}