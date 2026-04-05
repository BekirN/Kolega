const prisma = require('../prisma/client')
const cloudinary = require('../config/cloudinary')
const multer = require('multer')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg', 'image/png', 'image/webp',
      'application/zip',
    ]
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Tip fajla nije podržan'), false)
  }
})

// Kreiraj default foldere za novog korisnika
const createDefaultFolders = async (userId) => {
  const defaults = [
    { name: 'Moji materijali', color: '#FF6B35', icon: '📚', isDefault: true },
    { name: 'Primljeno', color: '#FFB800', icon: '📥', isDefault: true },
    { name: 'Preuzeto', color: '#16A34A', icon: '⬇️', isDefault: true },
  ]

  for (const folder of defaults) {
    await prisma.materialFolder.upsert({
      where: {
        // Treba unique constraint – dodajemo ga ispod
        userId_name_isDefault: {
          userId,
          name: folder.name,
          isDefault: true,
        }
      },
      update: {}, // ne mijenjaj ako postoji
      create: { ...folder, userId },
    })
  }
}

// ─── FOLDERI ──────────────────────────────────────────────────────

const getFolders = async (req, res) => {
  try {
    await createDefaultFolders(req.user.userId)

    const folders = await prisma.materialFolder.findMany({
      where: { userId: req.user.userId, parentId: null },
      include: {
        children: {
          include: { _count: { select: { materials: true } } }
        },
        _count: { select: { materials: true } }
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }]
    })

    res.json(folders)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const createFolder = async (req, res) => {
  try {
    const { name, color, icon, parentId } = req.body

    if (!name) return res.status(400).json({ message: 'Naziv je obavezan' })

    const folder = await prisma.materialFolder.create({
      data: {
        name, color: color || '#FF6B35', icon: icon || '📁',
        parentId: parentId || null,
        userId: req.user.userId,
      }
    })

    res.status(201).json({ message: 'Folder kreiran!', folder })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const deleteFolder = async (req, res) => {
  try {
    const folder = await prisma.materialFolder.findUnique({
      where: { id: req.params.id }
    })

    if (!folder) return res.status(404).json({ message: 'Folder nije pronađen' })
    if (folder.userId !== req.user.userId) return res.status(403).json({ message: 'Nemate pristup' })
    if (folder.isDefault) return res.status(400).json({ message: 'Ne možete obrisati default folder' })

    await prisma.materialFolder.delete({ where: { id: req.params.id } })
    res.json({ message: 'Folder obrisan!' })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

// ─── MATERIJALI ───────────────────────────────────────────────────

const getMyMaterials = async (req, res) => {
  try {
    await createDefaultFolders(req.user.userId)

    const { folderId, search } = req.query
    const filters = { uploaderId: req.user.userId }

    if (folderId) filters.folderId = folderId
    if (search) {
      filters.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { professor: { contains: search, mode: 'insensitive' } },
      ]
    }

    const materials = await prisma.material.findMany({
      where: filters,
      include: {
        folder: true,
        _count: { select: { saves: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(materials)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const getSavedMaterials = async (req, res) => {
  try {
    const { folderId } = req.query

    const saves = await prisma.materialSave.findMany({
      where: {
        userId: req.user.userId,
        ...(folderId && { folderId }),
      },
      include: {
        material: {
          include: {
            uploader: {
              select: { id: true, firstName: true, lastName: true, faculty: true, profileImage: true }
            },
            _count: { select: { saves: true } }
          }
        }
      },
      orderBy: { savedAt: 'desc' }
    })

    res.json(saves)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const getPublicMaterials = async (req, res) => {
  try {
    const { search, subject, faculty, sort } = req.query
    const filters = { isPublic: true }

    if (subject) filters.subject = { contains: subject, mode: 'insensitive' }
    if (faculty) filters.faculty = { contains: faculty, mode: 'insensitive' }
    if (search) {
      filters.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { professor: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const orderBy = sort === 'popular'
      ? { downloadCount: 'desc' }
      : { createdAt: 'desc' }

    const materials = await prisma.material.findMany({
      where: filters,
      include: {
        uploader: {
          select: { id: true, firstName: true, lastName: true, faculty: true, profileImage: true }
        },
        _count: { select: { saves: true } }
      },
      orderBy,
      take: 50
    })

    // Provjeri koje je korisnik već sačuvao
    const savedIds = await prisma.materialSave.findMany({
      where: { userId: req.user.userId },
      select: { materialId: true }
    })
    const savedSet = new Set(savedIds.map(s => s.materialId))

    const materialsWithSaved = materials.map(m => ({
      ...m,
      isSaved: savedSet.has(m.id),
      isOwn: m.uploaderId === req.user.userId,
    }))

    res.json(materialsWithSaved)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const uploadMaterial = async (req, res) => {
  try {
    const { title, description, subject, professor, year, isPublic, folderId } = req.body

    if (!req.file) return res.status(400).json({ message: 'Fajl je obavezan' })
    if (!title) return res.status(400).json({ message: 'Naziv je obavezan' })

    // Upload na Cloudinary
    const fileUrl = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'kolega/materials',
          resource_type: 'raw',
          public_id: `${Date.now()}_${req.file.originalname.replace(/\s/g, '_')}`,
        },
        (error, result) => error ? reject(error) : resolve(result.secure_url)
      )
      stream.end(req.file.buffer)
    })

    // Pronađi default folder ako nije odabran
    let targetFolderId = folderId || null
    if (!targetFolderId) {
      const defaultFolder = await prisma.materialFolder.findFirst({
        where: { userId: req.user.userId, name: 'Moji materijali', isDefault: true }
      })
      if (defaultFolder) targetFolderId = defaultFolder.id
    }

    // Uzmi faculty od korisnika
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { faculty: true }
    })

    const material = await prisma.material.create({
      data: {
        title,
        description,
        fileUrl,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        subject,
        professor,
        year: year ? parseInt(year) : null,
        isPublic: isPublic === 'true' || isPublic === true,
        faculty: user?.faculty || null,
        folderId: targetFolderId,
        uploaderId: req.user.userId,
      },
      include: {
        folder: true,
        uploader: {
          select: { id: true, firstName: true, lastName: true, faculty: true }
        }
      }
    })

    res.status(201).json({ message: 'Materijal uploadovan!', material })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const saveMaterial = async (req, res) => {
  try {
    const { materialId } = req.params
    const { source, folderId } = req.body

    const material = await prisma.material.findUnique({ where: { id: materialId } })
    if (!material) return res.status(404).json({ message: 'Materijal nije pronađen' })
    if (material.uploaderId === req.user.userId) {
      return res.status(400).json({ message: 'Ne možete sačuvati vlastiti materijal' })
    }

    // Pronađi "Primljeno" ili "Preuzeto" folder
    let targetFolderId = folderId || null
    if (!targetFolderId) {
      const folderName = source === 'CHAT' ? 'Primljeno' : 'Preuzeto'
      const folder = await prisma.materialFolder.findFirst({
        where: { userId: req.user.userId, name: folderName, isDefault: true }
      })
      if (folder) targetFolderId = folder.id
    }

    // Provjeri da li je već sačuvano
    const existing = await prisma.materialSave.findUnique({
      where: { materialId_userId: { materialId, userId: req.user.userId } }
    })

    if (existing) {
      return res.status(400).json({ message: 'Već ste sačuvali ovaj materijal' })
    }

    const save = await prisma.materialSave.create({
      data: {
        materialId,
        userId: req.user.userId,
        source: source || 'LIBRARY',
        folderId: targetFolderId,
      },
      include: {
        material: {
          include: {
            uploader: {
              select: { id: true, firstName: true, lastName: true }
            }
          }
        }
      }
    })

    // Povećaj download count
    await prisma.material.update({
      where: { id: materialId },
      data: { downloadCount: { increment: 1 } }
    })

    res.status(201).json({ message: 'Materijal sačuvan!', save })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const unsaveMaterial = async (req, res) => {
  try {
    const { materialId } = req.params

    await prisma.materialSave.delete({
      where: { materialId_userId: { materialId, userId: req.user.userId } }
    })

    res.json({ message: 'Uklonjeno iz biblioteke' })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const deleteMaterial = async (req, res) => {
  try {
    const material = await prisma.material.findUnique({ where: { id: req.params.id } })
    if (!material) return res.status(404).json({ message: 'Materijal nije pronađen' })
    if (material.uploaderId !== req.user.userId) return res.status(403).json({ message: 'Nemate pristup' })

    await prisma.material.delete({ where: { id: req.params.id } })
    res.json({ message: 'Materijal obrisan!' })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const togglePublic = async (req, res) => {
  try {
    const material = await prisma.material.findUnique({ where: { id: req.params.id } })
    if (!material) return res.status(404).json({ message: 'Materijal nije pronađen' })
    if (material.uploaderId !== req.user.userId) return res.status(403).json({ message: 'Nemate pristup' })

    const updated = await prisma.material.update({
      where: { id: req.params.id },
      data: { isPublic: !material.isPublic }
    })

    res.json({
      message: updated.isPublic ? 'Materijal je sada javan!' : 'Materijal je sada privatan',
      material: updated
    })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const moveMaterial = async (req, res) => {
  try {
    const { folderId } = req.body
    const material = await prisma.material.findUnique({ where: { id: req.params.id } })
    if (!material) return res.status(404).json({ message: 'Materijal nije pronađen' })
    if (material.uploaderId !== req.user.userId) return res.status(403).json({ message: 'Nemate pristup' })

    const updated = await prisma.material.update({
      where: { id: req.params.id },
      data: { folderId: folderId || null }
    })

    res.json({ message: 'Premješteno!', material: updated })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

module.exports = {
  upload,
  getFolders, createFolder, deleteFolder,
  getMyMaterials, getSavedMaterials, getPublicMaterials,
  uploadMaterial, saveMaterial, unsaveMaterial,
  deleteMaterial, togglePublic, moveMaterial,
}