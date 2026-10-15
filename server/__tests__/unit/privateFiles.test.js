jest.mock('../../prisma/client')
jest.mock('../../utils/privateCloudinaryRawAsset', () => ({
  parseCloudinaryAssetUrl: jest.fn(),
  createPrivateAssetDownloadUrl: jest.fn(),
}))

const prisma = require('../../prisma/client')
const privateAssets = require('../../utils/privateCloudinaryRawAsset')
const { getMessageFileDownloadUrl } = require('../../controllers/chatController')
const { downloadMaterial, saveChatMessageToLibrary } = require('../../controllers/materialController')

const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
})

beforeEach(() => {
  jest.clearAllMocks()
})

describe('Private chat file access', () => {
  test('does not reveal message existence to a non-participant', async () => {
    prisma.conversationParticipant.findUnique.mockResolvedValue(null)
    const req = { params: { conversationId: 'conversation-1', messageId: 'message-1' }, user: { userId: 'outsider' } }
    const res = createResponse()

    await getMessageFileDownloadUrl(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(prisma.message.findFirst).not.toHaveBeenCalled()
    expect(privateAssets.createPrivateAssetDownloadUrl).not.toHaveBeenCalled()
  })

  test('returns a short-lived signed URL to a conversation participant', async () => {
    prisma.conversationParticipant.findUnique.mockResolvedValue({ id: 'participant-1' })
    prisma.message.findFirst.mockResolvedValue({
      fileUrl: 'https://res.cloudinary.com/example/image/authenticated/v1/kolega/chat/user/file.png',
      fileType: 'image',
    })
    privateAssets.parseCloudinaryAssetUrl.mockReturnValue({
      publicId: 'kolega/chat/user/file',
      format: 'png',
      deliveryType: 'authenticated',
      resourceType: 'image',
    })
    privateAssets.createPrivateAssetDownloadUrl.mockReturnValue('https://signed.example/file')
    const req = { params: { conversationId: 'conversation-1', messageId: 'message-1' }, user: { userId: 'member' } }
    const res = createResponse()

    await getMessageFileDownloadUrl(req, res)

    expect(res.set).toHaveBeenCalledWith('Cache-Control', 'private, no-store')
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://signed.example/file' }))
  })
})

describe('Private material access', () => {
  test('denies access to a private material owned by someone else', async () => {
    prisma.material.findFirst.mockResolvedValue({
      uploaderId: 'owner',
      isPublic: false,
      fileUrl: 'https://res.cloudinary.com/example/raw/authenticated/v1/kolega/materials/private.pdf',
    })
    const req = { params: { id: 'material-1' }, user: { userId: 'other-user' } }
    const res = createResponse()

    await downloadMaterial(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(privateAssets.createPrivateAssetDownloadUrl).not.toHaveBeenCalled()
  })

  test('does not import a chat file unless the current user is a conversation member', async () => {
    prisma.message.findFirst.mockResolvedValue(null)
    const req = { params: { messageId: 'message-1' }, user: { userId: 'outsider' }, body: {} }
    const res = createResponse()

    await saveChatMessageToLibrary(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(prisma.material.create).not.toHaveBeenCalled()
  })
})
