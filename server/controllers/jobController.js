const prisma = require('../prisma/client')
const { createActivity } = require('../utils/activityHelper')
const { sendNewJobEmail } = require('../config/mailgun')
const getJobs = async (req, res) => {
  try {
    const { type, category, search, isRemote } = req.query
    const filters = { isActive: true }

    if (type) filters.type = type
    if (category) filters.category = category
    if (isRemote === 'true') filters.isRemote = true
    if (search) {
      filters.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ]
    }

    const jobs = await prisma.studentJob.findMany({
      where: filters,
      include: {
        author: {
          select: {
            id: true, firstName: true, lastName: true,
            faculty: true, profileImage: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(jobs)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const getJobById = async (req, res) => {
  try {
    const job = await prisma.studentJob.findUnique({
      where: { id: req.params.id },
      include: {
        author: {
          select: {
            id: true, firstName: true, lastName: true,
            faculty: true, university: true, profileImage: true, email: true
          }
        }
      }
    })

    if (!job) return res.status(404).json({ message: 'Oglas nije pronađen' })
    res.json(job)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const createJob = async (req, res) => {
  try {
    const {
      title, description, type, category,
      location, isRemote, salary, salaryPeriod,
      hours, contactEmail, contactPhone
    } = req.body

    if (!title || !description || !type || !category) {
      return res.status(400).json({ message: 'Naslov, opis, tip i kategorija su obavezni' })
    }

    const job = await prisma.studentJob.create({
      data: {
        title, description, type, category,
        location,
        isRemote: isRemote === 'true' || isRemote === true,
        salary: salary ? parseFloat(salary) : null,
        salaryPeriod: salaryPeriod || null,
        hours,
        contactEmail,
        contactPhone,
        authorId: req.user.userId,
      },
      include: {
        author: {
          select: {
            id: true, firstName: true, lastName: true, faculty: true, profileImage: true
          }
        }
      }
    })

    if (job.type === 'NUDIM') {
      try {
        const users = await prisma.user.findMany({
          where: {
            emailVerified: true,
            id: { not: req.user.userId } // Ne šalji autoru
          },
          select: { email: true, firstName: true }
        })

        const batchSize = 10
        for (let i = 0; i < users.length; i += batchSize) {
          const batch = users.slice(i, i + batchSize)
          await Promise.allSettled(
            batch.map(u => sendNewJobEmail(u.email, u.firstName, job.title, job.type))
          )
        }
      } catch (emailErr) {
        console.error('Email greška:', emailErr)
      }
    }

    res.status(201).json({ message: 'Oglas objavljen!', job })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const updateJob = async (req, res) => {
  try {
    const job = await prisma.studentJob.findUnique({ where: { id: req.params.id } })
    if (!job) return res.status(404).json({ message: 'Oglas nije pronađen' })
    if (job.authorId !== req.user.userId) {
      return res.status(403).json({ message: 'Nemate pristup' })
    }

    const updated = await prisma.studentJob.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        salary: req.body.salary ? parseFloat(req.body.salary) : null,
        isRemote: req.body.isRemote === 'true' || req.body.isRemote === true,
        isActive: req.body.isActive !== undefined ? req.body.isActive === 'true' || req.body.isActive === true : job.isActive,
      }
    })

    res.json({ message: 'Oglas ažuriran!', job: updated })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const deleteJob = async (req, res) => {
  try {
    const job = await prisma.studentJob.findUnique({ where: { id: req.params.id } })
    if (!job) return res.status(404).json({ message: 'Oglas nije pronađen' })
    if (job.authorId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Nemate pristup' })
    }

    await prisma.studentJob.delete({ where: { id: req.params.id } })
    res.json({ message: 'Oglas obrisan!' })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const getMyJobs = async (req, res) => {
  try {
    const jobs = await prisma.studentJob.findMany({
      where: { authorId: req.user.userId },
      orderBy: { createdAt: 'desc' }
    })
    res.json(jobs)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

module.exports = { getJobs, getJobById, createJob, updateJob, deleteJob, getMyJobs }