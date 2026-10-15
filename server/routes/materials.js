const express = require('express')
const router = express.Router()
const {
  upload,
  getFolders, createFolder, deleteFolder,
  getMyMaterials, getSavedMaterials, getPublicMaterials,
  uploadMaterial, saveMaterial, unsaveMaterial,
  downloadMaterial, saveChatMessageToLibrary,
  deleteMaterial, togglePublic, moveMaterial,
} = require('../controllers/materialController')
const { protect } = require('../middleware/auth')

// Folderi
router.get('/folders', protect, getFolders)
router.post('/folders', protect, createFolder)
router.delete('/folders/:id', protect, deleteFolder)

// Moji materijali
router.get('/my', protect, getMyMaterials)
router.get('/saved', protect, getSavedMaterials)
router.get('/public', protect, getPublicMaterials)

// CRUD
router.post('/upload', protect, upload.single('file'), uploadMaterial)
router.post('/save-chat/:messageId', protect, saveChatMessageToLibrary)
router.post('/save/:materialId', protect, saveMaterial)
router.delete('/unsave/:materialId', protect, unsaveMaterial)
router.get('/:id/download', protect, downloadMaterial)
router.delete('/:id', protect, deleteMaterial)
router.put('/:id/toggle-public', protect, togglePublic)
router.put('/:id/move', protect, moveMaterial)

module.exports = router
