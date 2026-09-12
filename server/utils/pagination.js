// Pretvara ?page & ?limit iz query stringa u Prisma { skip, take }, sa sigurnim granicama.
function getPagination(query = {}, { defaultLimit = 12, maxLimit = 50 } = {}) {
  const limit = Math.min(parseInt(query.limit) || defaultLimit, maxLimit)
  const page = Math.max(parseInt(query.page) || 1, 1)
  const skip = (page - 1) * limit
  return { skip, take: limit, page, limit }
}

module.exports = { getPagination }
