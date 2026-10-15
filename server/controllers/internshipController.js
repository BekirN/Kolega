const prisma = require('../prisma/client')
const cloudinary = require('../config/cloudinary')
const multer = require('multer')
const { randomUUID } = require('crypto')
const { sendVerificationEmail } = require('../config/mailgun')
const { createActivity } = require('../utils/activityHelper')
const {
  parseCloudinaryRawAssetUrl,
  createPrivateRawDownloadUrl,
} = require('../utils/privateCloudinaryRawAsset')

const hideCvUrl = (application) => {
  const { cvUrl, ...safeApplication } = application
  return { ...safeApplication, hasCv: Boolean(cvUrl) }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
})

// ─── COMPANY MEMBERSHIP ───────────────────────────────────────────

const getMyCompanies = async (req, res) => {
  try {
    const memberships = await prisma.companyMember.findMany({
      where: { userId: req.user.userId },
      include: {
        company: {
          include: {
            internships: {
              include: { _count: { select: { applications: true } } },
              where: { isActive: true, deletedAt: null  },
            },
            _count: { select: { members: true } }
          }
        }
      }
    })
    res.json(memberships)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: process.env.NODE_ENV === 'production' ? undefined : error.message })
  }
}

// ─── INTERNSHIP CRUD ──────────────────────────────────────────────

const createInternship = async (req, res) => {
  try {
    const {
      companyId, title, description, requirements,
      duration, type, isPaid, salary, deadline,
      location, skills,
    } = req.body

    // Provjeri da li je user member firme
    const membership = await prisma.companyMember.findUnique({
      where: { userId_companyId: { userId: req.user.userId, companyId } }
    })
    if (!membership) {
      return res.status(403).json({ message: 'Niste član ove firme' })
    }

    const internship = await prisma.internship.create({
      data: {
        title, description,
        requirements: requirements || null,
        duration: duration || null,
        type: type || 'FULL_TIME',
        isPaid: isPaid === 'true' || isPaid === true,
        salary: salary ? parseFloat(salary) : null,
        deadline: deadline ? new Date(deadline) : null,
        location: location || null,
        skills: skills ? (Array.isArray(skills) ? skills : JSON.parse(skills)) : [],
        companyId,
      },
      include: {
        company: { select: { id: true, name: true, logoUrl: true } }
      }
    })

    // Email notifikacija svim verified korisnicima
    try {
      const { sendNewInternshipEmail } = require('../config/mailgun')
      const users = await prisma.user.findMany({
        where: { emailVerified: true, id: { not: req.user.userId }, deletedAt: null  },
        select: { email: true, firstName: true }
      })
      const batchSize = 10
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize)
        await Promise.allSettled(
          batch.map(u => sendNewInternshipEmail(u.email, u.firstName, internship.company.name, title))
        )
      }
    } catch (emailErr) {
      console.error('Internship email failed:', emailErr.name || 'Unknown')
    }

    res.status(201).json({ message: 'Praksa objavljena!', internship })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: process.env.NODE_ENV === 'production' ? undefined : error.message })
  }
}

const updateInternship = async (req, res) => {
  try {
    const internship = await prisma.internship.findUnique({
      where: { id: req.params.id },
      include: { company: { include: { members: true } } }
    })
    if (!internship) return res.status(404).json({ message: 'Praksa nije pronađena' })

    const isMember = internship.company.members.some(m => m.userId === req.user.userId)
    if (!isMember && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Nemate pristup' })
    }

    const updated = await prisma.internship.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        isPaid: req.body.isPaid !== undefined
          ? req.body.isPaid === 'true' || req.body.isPaid === true
          : internship.isPaid,
        salary: req.body.salary ? parseFloat(req.body.salary) : internship.salary,
        deadline: req.body.deadline ? new Date(req.body.deadline) : internship.deadline,
        skills: req.body.skills
          ? (Array.isArray(req.body.skills) ? req.body.skills : JSON.parse(req.body.skills))
          : internship.skills,
      }
    })

    res.json({ message: 'Praksa ažurirana!', internship: updated })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: process.env.NODE_ENV === 'production' ? undefined : error.message })
  }
}

const deleteInternship = async (req, res) => {
  try {
    const internship = await prisma.internship.findUnique({
      where: { id: req.params.id },
      include: { company: { include: { members: true } } }
    })
    if (!internship) return res.status(404).json({ message: 'Praksa nije pronađena' })

    const isMember = internship.company.members.some(m => m.userId === req.user.userId)
    if (!isMember && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Nemate pristup' })
    }

    await prisma.internship.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } })

    res.json({ message: 'Praksa obrisana!' })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: process.env.NODE_ENV === 'production' ? undefined : error.message })
  }
}

const getCompanyInternships = async (req, res) => {
  try {
    const internships = await prisma.internship.findMany({
      where: { companyId: req.params.companyId,  deletedAt: null  },
      include: {
        _count: { select: { applications: true } },
        company: { select: { id: true, name: true, logoUrl: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(internships)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: process.env.NODE_ENV === 'production' ? undefined : error.message })
  }
}

// ─── APPLICATIONS ─────────────────────────────────────────────────

const applyToInternship = async (req, res) => {
  try {
    const { coverLetter } = req.body
    const internshipId = req.params.id

    const internship = await prisma.internship.findUnique({
      where: { id: internshipId, deletedAt: null  },
      include: { company: true }
    })
    if (!internship) return res.status(404).json({ message: 'Praksa nije pronađena' })
    if (!internship.isActive) return res.status(400).json({ message: 'Rok za prijave je istekao' })

    // Provjeri duplikate
    const existing = await prisma.internshipApplication.findUnique({
      where: { internshipId_applicantId: { internshipId, applicantId: req.user.userId } }
    })
    if (existing) return res.status(400).json({ message: 'Već ste se prijavili na ovu praksu' })

    // CV upload
    let cvUrl = null
    if (req.file) {
      const pdfHeader = Buffer.from('%PDF-', 'ascii')
      const headerWindow = req.file.buffer.subarray(0, 1024)
      if (req.file.mimetype !== 'application/pdf' || headerWindow.indexOf(pdfHeader) === -1) {
        return res.status(400).json({ message: 'CV mora biti validan PDF dokument.' })
      }

      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'kolega/cvs',
            public_id: `${randomUUID()}.pdf`,
            resource_type: 'raw',
            type: 'authenticated',
          },
          (error, result) => error ? reject(error) : resolve(result)
        )
        stream.end(req.file.buffer)
      })
      cvUrl = result.secure_url
    }

    const application = await prisma.internshipApplication.create({
      data: {
        internshipId,
        applicantId: req.user.userId,
        coverLetter: coverLetter || null,
        cvUrl,
      },
      include: {
        applicant: { select: { id: true, firstName: true, lastName: true, faculty: true, profileImage: true } },
        internship: { include: { company: true } }
      }
    })

    // Notifikacija HR-u firme
    const companyMembers = await prisma.companyMember.findMany({
      where: { companyId: internship.companyId },
      select: { userId: true }
    })

    const applicant = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { firstName: true, lastName: true }
    })

    await Promise.allSettled(
      companyMembers.map(member =>
        createActivity({
          type: 'GENERAL',
          message: `${applicant.firstName} ${applicant.lastName} se prijavio/la na "${internship.title}" 📋`,
          userId: member.userId,
          actorId: req.user.userId,
          referenceId: application.id,
          link: `/companies/${internship.companyId}/applications`,
        })
      )
    )

    // Socket notifikacija HR-u
    try {
      const { io } = require('../index')
      companyMembers.forEach(member => {
        io.to(`user_${member.userId}`).emit('new_activity', {
          type: 'GENERAL',
          message: `Nova prijava za "${internship.title}"! 📋`,
          link: `/companies/${internship.companyId}/applications`,
        })
      })
    } catch (socketErr) {
      console.error('Internship socket notification failed:', socketErr.name || 'Unknown')
    }

    res.status(201).json({ message: 'Prijava uspješno poslana!', application: hideCvUrl(application) })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: process.env.NODE_ENV === 'production' ? undefined : error.message })
  }
}

const getMyApplications = async (req, res) => {
  try {
    const applications = await prisma.internshipApplication.findMany({
      where: { applicantId: req.user.userId },
      include: {
        internship: {
          include: {
            company: { select: { id: true, name: true, logoUrl: true, industry: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(applications.map(hideCvUrl))
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: process.env.NODE_ENV === 'production' ? undefined : error.message })
  }
}

const getCompanyApplications = async (req, res) => {
  try {
    const { companyId } = req.params

    // Provjeri membership
    const membership = await prisma.companyMember.findUnique({
      where: { userId_companyId: { userId: req.user.userId, companyId } }
    })
    if (!membership && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Nemate pristup' })
    }

    const applications = await prisma.internshipApplication.findMany({
      where: { internship: { companyId } },
      include: {
        applicant: {
          select: {
            id: true, firstName: true, lastName: true, email: true,
            faculty: true, university: true, profileImage: true,
            verificationStatus: true,
          }
        },
        internship: { select: { id: true, title: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(applications.map(hideCvUrl))
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: process.env.NODE_ENV === 'production' ? undefined : error.message })
  }
}

const downloadApplicationCv = async (req, res) => {
  try {
    const application = await prisma.internshipApplication.findUnique({
      where: { id: req.params.applicationId },
      select: {
        applicantId: true,
        cvUrl: true,
        internship: { select: { companyId: true } },
      },
    })

    if (!application) return res.status(404).json({ message: 'Prijava nije pronađena' })

    const isApplicant = application.applicantId === req.user.userId
    const isAdmin = req.user.role === 'ADMIN'
    if (!isApplicant && !isAdmin) {
      const membership = await prisma.companyMember.findUnique({
        where: {
          userId_companyId: {
            userId: req.user.userId,
            companyId: application.internship.companyId,
          }
        }
      })
      if (!membership) return res.status(403).json({ message: 'Nemate pristup' })
    }

    if (!application.cvUrl) return res.status(404).json({ message: 'Prijava nema CV' })

    let asset
    try {
      asset = parseCloudinaryRawAssetUrl(application.cvUrl)
    } catch (error) {
      return res.status(409).json({
        code: 'CV_MIGRATION_REQUIRED',
        message: 'CV fajl još nije migriran u privatno skladište.',
      })
    }

    if (asset.deliveryType !== 'authenticated') {
      return res.status(409).json({
        code: 'CV_MIGRATION_REQUIRED',
        message: 'CV fajl još nije migriran u privatno skladište.',
      })
    }
    if (asset.format !== 'pdf') {
      return res.status(409).json({
        code: 'CV_MIGRATION_REQUIRED',
        message: 'CV fajl nema podržan PDF format.',
      })
    }

    const expiresAt = Math.floor(Date.now() / 1000) + 120
    const url = createPrivateRawDownloadUrl(asset, expiresAt)
    res.set('Cache-Control', 'private, no-store')
    res.json({ url, expiresAt })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru' })
  }
}

const updateApplicationStatus = async (req, res) => {
  try {
    const { status, notes } = req.body
    const { applicationId } = req.params

    const validStatuses = ['PENDING', 'REVIEWING', 'INTERVIEW', 'ACCEPTED', 'REJECTED']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Neispravni status' })
    }

    const application = await prisma.internshipApplication.findUnique({
      where: { id: applicationId },
      include: {
        internship: {
          include: {
            company: { include: { members: true } }
          }
        },
        applicant: { select: { id: true, firstName: true, lastName: true } }
      }
    })

    if (!application) return res.status(404).json({ message: 'Prijava nije pronađena' })

    const isMember = application.internship.company.members.some(m => m.userId === req.user.userId)
    if (!isMember && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Nemate pristup' })
    }

    const updated = await prisma.internshipApplication.update({
      where: { id: applicationId },
      data: { status, notes: notes || null }
    })

    // Status poruke za kandidata
    const STATUS_MESSAGES = {
      REVIEWING: `Tvoja prijava za "${application.internship.title}" je u procesu razmatranja 👀`,
      INTERVIEW: `Čestitamo! Pozvan/a si na intervju za "${application.internship.title}" 🎉`,
      ACCEPTED: `Čestitamo! Tvoja prijava za "${application.internship.title}" je prihvaćena! 🏆`,
      REJECTED: `Tvoja prijava za "${application.internship.title}" nije prihvaćena ovog puta.`,
    }

    if (STATUS_MESSAGES[status]) {
      await createActivity({
        type: 'GENERAL',
        message: STATUS_MESSAGES[status],
        userId: application.applicantId,
        actorId: req.user.userId,
        referenceId: applicationId,
        link: '/companies/my-applications',
      })

      try {
        const { io } = require('../index')
        io.to(`user_${application.applicantId}`).emit('new_activity', {
          type: 'GENERAL',
          message: STATUS_MESSAGES[status],
          link: '/companies/my-applications',
        })
      } catch (socketErr) {
        console.error('Internship socket notification failed:', socketErr.name || 'Unknown')
      }
    }

    res.json({ message: 'Status ažuriran!', application: updated })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: process.env.NODE_ENV === 'production' ? undefined : error.message })
  }
}

const withdrawApplication = async (req, res) => {
  try {
    const application = await prisma.internshipApplication.findUnique({
      where: { id: req.params.applicationId }
    })
    if (!application) return res.status(404).json({ message: 'Prijava nije pronađena' })
    if (application.applicantId !== req.user.userId) {
      return res.status(403).json({ message: 'Nemate pristup' })
    }

    await prisma.internshipApplication.delete({ where: { id: req.params.applicationId } })
    res.json({ message: 'Prijava povučena!' })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: process.env.NODE_ENV === 'production' ? undefined : error.message })
  }
}

module.exports = {
  upload,
  getMyCompanies,
  createInternship,
  updateInternship,
  deleteInternship,
  getCompanyInternships,
  applyToInternship,
  getMyApplications,
  getCompanyApplications,
  downloadApplicationCv,
  updateApplicationStatus,
  withdrawApplication,
}
