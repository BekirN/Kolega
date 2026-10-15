const prisma = require('../prisma/client')
const cloudinary = require('../config/cloudinary')
const multer = require('multer')
const { randomUUID } = require('crypto')
const {
  parseCloudinaryAssetUrl,
  createPrivateAssetDownloadUrl,
} = require('../utils/privateCloudinaryRawAsset')
const {
  FILE_EXTENSIONS,
  validateUploadedFile,
  sanitizeFileName,
} = require('../utils/fileValidation')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    cb(null, Boolean(FILE_EXTENSIONS[file.mimetype]))
  }
})

const MATERIAL_FOLDER_PREFIX = 'kolega/materials/'
const CHAT_FOLDER_PREFIX = 'kolega/chat/'
const PRIVATE_URL_TTL_SECONDS = 120

const hideMaterialFileUrl = (material) => {
  if (!material) return material
  const { fileUrl, ...safeMaterial } = material
  return { ...safeMaterial, hasFile: Boolean(fileUrl) }
}

const hideSavedMaterialFileUrl = (save) => ({
  ...save,
  material: hideMaterialFileUrl(save.material),
})

const parsePrivateMaterialAsset = (fileUrl) => {
  let resourceType
  try {
    const url = new URL(fileUrl)
    resourceType = url.pathname.split('/').filter(Boolean)[1]
  } catch {
    return null
  }
  if (!['raw', 'image'].includes(resourceType)) return null

  try {
    const asset = parseCloudinaryAssetUrl(fileUrl, resourceType)
    const allowedFolder = asset.publicId.startsWith(MATERIAL_FOLDER_PREFIX) || asset.publicId.startsWith(CHAT_FOLDER_PREFIX)
    return asset.deliveryType === 'authenticated' && asset.format && allowedFolder ? asset : null
  } catch {
    return null
  }
}

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
    res.status(500).json({ message: 'Greška na serveru', error: process.env.NODE_ENV === 'production' ? undefined : error.message })
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
    res.status(500).json({ message: 'Greška na serveru', error: process.env.NODE_ENV === 'production' ? undefined : error.message })
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
    res.status(500).json({ message: 'Greška na serveru', error: process.env.NODE_ENV === 'production' ? undefined : error.message })
  }
}

// ─── MATERIJALI ───────────────────────────────────────────────────

const getMyMaterials = async (req, res) => {
  try {
    await createDefaultFolders(req.user.userId)

    const { folderId, search } = req.query
    const filters = { uploaderId: req.user.userId, deletedAt: null }

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

    res.json(materials.map(hideMaterialFileUrl))
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: process.env.NODE_ENV === 'production' ? undefined : error.message })
  }
}

const getSavedMaterials = async (req, res) => {
  try {
    const { folderId } = req.query

    const saves = await prisma.materialSave.findMany({
      where: {
        userId: req.user.userId,
        ...(folderId && { folderId }),
        material: { is: { isPublic: true, deletedAt: null } },
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

    res.json(saves.map(hideSavedMaterialFileUrl))
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: process.env.NODE_ENV === 'production' ? undefined : error.message })
  }
}

const getPublicMaterials = async (req, res) => {
  try {
    const { search, subject, faculty, sort } = req.query
    const filters = { isPublic: true, deletedAt: null }

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

    res.json(materialsWithSaved.map(hideMaterialFileUrl))
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: process.env.NODE_ENV === 'production' ? undefined : error.message })
  }
}

const uploadMaterial = async (req, res) => {
  try {
    const { title, description, subject, professor, year, isPublic, folderId } = req.body

    if (!req.file) return res.status(400).json({ message: 'Fajl je obavezan' })
    const validationError = validateUploadedFile(req.file)
    if (validationError) return res.status(400).json({ message: validationError })
    if (typeof title !== 'string' || !title.trim() || title.trim().length > 200) {
      return res.status(400).json({ message: 'Naziv mora imati između 1 i 200 znakova' })
    }

    let targetFolderId = folderId || null
    if (targetFolderId) {
      const folder = await prisma.materialFolder.findFirst({
        where: { id: targetFolderId, userId: req.user.userId },
        select: { id: true },
      })
      if (!folder) return res.status(403).json({ message: 'Nemate pristup folderu' })
    }

    // Upload na Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'kolega/materials',
          resource_type: 'raw',
          type: 'authenticated',
          public_id: `${randomUUID()}${FILE_EXTENSIONS[req.file.mimetype]}`,
        },
        (error, result) => error ? reject(error) : resolve(result)
      )
      stream.end(req.file.buffer)
    })
    const fileUrl = result.secure_url

    // Pronađi default folder ako nije odabran
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
        title: title.trim(),
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

    res.status(201).json({ message: 'Materijal uploadovan!', material: hideMaterialFileUrl(material) })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: process.env.NODE_ENV === 'production' ? undefined : error.message })
  }
}

const downloadMaterial = async (req, res) => {
  try {
    const material = await prisma.material.findFirst({
      where: { id: req.params.id, deletedAt: null },
      select: { uploaderId: true, isPublic: true, fileUrl: true },
    })
    if (!material) return res.status(404).json({ message: 'Materijal nije pronađen' })
    if (material.uploaderId !== req.user.userId && !material.isPublic) {
      return res.status(403).json({ message: 'Nemate pristup' })
    }

    const asset = parsePrivateMaterialAsset(material.fileUrl)
    if (!asset) {
      return res.status(409).json({
        code: 'MATERIAL_MIGRATION_REQUIRED',
        message: 'Fajl još nije prebačen u privatno skladište',
      })
    }

    const expiresAt = Math.floor(Date.now() / 1000) + PRIVATE_URL_TTL_SECONDS
    const url = createPrivateAssetDownloadUrl(asset, expiresAt)
    await prisma.material.update({
      where: { id: req.params.id },
      data: { downloadCount: { increment: 1 } },
    })
    res.set('Cache-Control', 'private, no-store')
    res.json({ url, expiresAt })
  } catch {
    res.status(500).json({ message: 'Greška na serveru' })
  }
}

const saveChatMessageToLibrary = async (req, res) => {
  try {
    const message = await prisma.message.findFirst({
      where: {
        id: req.params.messageId,
        fileUrl: { not: null },
        senderId: { not: req.user.userId },
        conversation: { is: { participants: { some: { userId: req.user.userId } } } },
      },
      select: { id: true, senderId: true, content: true, fileUrl: true, fileType: true, fileMimeType: true },
    })
    if (!message) return res.status(404).json({ message: 'Prilog iz razgovora nije pronađen' })

    const asset = parsePrivateMaterialAsset(message.fileUrl)
    if (!asset || !asset.publicId.startsWith(CHAT_FOLDER_PREFIX)) {
      return res.status(409).json({
        code: 'CHAT_FILE_MIGRATION_REQUIRED',
        message: 'Prilog još nije dostupan u privatnom skladištu',
      })
    }

    const existing = await prisma.material.findFirst({
      where: { uploaderId: req.user.userId, sourceMessageId: message.id },
    })
    if (existing) {
      return res.json({ message: 'Materijal je već sačuvan', material: hideMaterialFileUrl(existing), alreadySaved: true })
    }

    await createDefaultFolders(req.user.userId)
    let folderId = req.body.folderId || null
    if (folderId) {
      const folder = await prisma.materialFolder.findFirst({
        where: { id: folderId, userId: req.user.userId },
        select: { id: true },
      })
      if (!folder) return res.status(403).json({ message: 'Nemate pristup folderu' })
    } else {
      const defaultFolder = await prisma.materialFolder.findFirst({
        where: { userId: req.user.userId, name: 'Primljeno', isDefault: true },
        select: { id: true },
      })
      folderId = defaultFolder?.id || null
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { faculty: true },
    })

    const material = await prisma.material.create({
      data: {
        title: sanitizeFileName(message.content),
        fileUrl: message.fileUrl,
        fileType: message.fileMimeType || (message.fileType === 'image' ? 'image/jpeg' : 'application/octet-stream'),
        isPublic: false,
        faculty: user?.faculty || null,
        folderId,
        uploaderId: req.user.userId,
        sourceMessageId: message.id,
      },
    })

    res.status(201).json({ message: 'Materijal sačuvan u biblioteku', material: hideMaterialFileUrl(material) })
  } catch (error) {
    if (error.code === 'P2002') {
      const existing = await prisma.material.findFirst({
        where: { uploaderId: req.user.userId, sourceMessageId: req.params.messageId },
      })
      if (existing) return res.json({ message: 'Materijal je već sačuvan', material: hideMaterialFileUrl(existing), alreadySaved: true })
    }
    console.error('Saving chat file failed:', error.name)
    res.status(500).json({ message: 'Greška na serveru' })
  }
}

const saveMaterial = async (req, res) => {
  try {
    const { materialId } = req.params
    const { source, folderId } = req.body

    const material = await prisma.material.findUnique({ where: { id: materialId, deletedAt: null } })
    if (!material) return res.status(404).json({ message: 'Materijal nije pronađen' })
    if (!material.isPublic) return res.status(404).json({ message: 'Materijal nije pronađen' })
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
    } else {
      const folder = await prisma.materialFolder.findFirst({
        where: { id: targetFolderId, userId: req.user.userId },
        select: { id: true },
      })
      if (!folder) return res.status(403).json({ message: 'Nemate pristup folderu' })
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

    res.status(201).json({ message: 'Materijal sačuvan!', save: hideSavedMaterialFileUrl(save) })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: process.env.NODE_ENV === 'production' ? undefined : error.message })
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
    res.status(500).json({ message: 'Greška na serveru', error: process.env.NODE_ENV === 'production' ? undefined : error.message })
  }
}

const deleteMaterial = async (req, res) => {
  try {
    const material = await prisma.material.findUnique({ where: { id: req.params.id, deletedAt: null } })
    if (!material) return res.status(404).json({ message: 'Materijal nije pronađen' })
    if (material.uploaderId !== req.user.userId) return res.status(403).json({ message: 'Nemate pristup' })

    await prisma.material.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } })

    res.json({ message: 'Materijal obrisan!' })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: process.env.NODE_ENV === 'production' ? undefined : error.message })
  }
}

const togglePublic = async (req, res) => {
  try {
    const material = await prisma.material.findUnique({ where: { id: req.params.id, deletedAt: null } })
    if (!material) return res.status(404).json({ message: 'Materijal nije pronađen' })
    if (material.uploaderId !== req.user.userId) return res.status(403).json({ message: 'Nemate pristup' })

    const updated = await prisma.material.update({
      where: { id: req.params.id },
      data: { isPublic: !material.isPublic }
    })

    res.json({
      message: updated.isPublic ? 'Materijal je sada javan!' : 'Materijal je sada privatan',
      material: hideMaterialFileUrl(updated)
    })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: process.env.NODE_ENV === 'production' ? undefined : error.message })
  }
}

const moveMaterial = async (req, res) => {
  try {
    const { folderId } = req.body
    const material = await prisma.material.findUnique({ where: { id: req.params.id, deletedAt: null } })
    if (!material) return res.status(404).json({ message: 'Materijal nije pronađen' })
    if (material.uploaderId !== req.user.userId) return res.status(403).json({ message: 'Nemate pristup' })

    if (folderId) {
      const folder = await prisma.materialFolder.findFirst({
        where: { id: folderId, userId: req.user.userId },
        select: { id: true },
      })
      if (!folder) return res.status(403).json({ message: 'Nemate pristup folderu' })
    }

    const updated = await prisma.material.update({
      where: { id: req.params.id },
      data: { folderId: folderId || null }
    })

    res.json({ message: 'Premješteno!', material: hideMaterialFileUrl(updated) })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: process.env.NODE_ENV === 'production' ? undefined : error.message })
  }
}

module.exports = {
  upload,
  getFolders, createFolder, deleteFolder,
  getMyMaterials, getSavedMaterials, getPublicMaterials,
  uploadMaterial, saveMaterial, unsaveMaterial,
  downloadMaterial, saveChatMessageToLibrary,
  deleteMaterial, togglePublic, moveMaterial,
}
