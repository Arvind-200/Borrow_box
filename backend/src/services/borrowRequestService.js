import { BorrowRequest } from '../models/BorrowRequest.js'
import { Product } from '../models/Product.js'
import { ApiError } from '../utils/apiError.js'
import {
  detectTransactionsSupported,
  withTransaction,
} from '../utils/transactions.js'

const OBJECT_ID_REGEX = /^[a-f0-9]{24}$/i

const POPULATE = [
  { path: 'product', select: 'title images rentPerDay location availability' },
  { path: 'borrower', select: 'name' },
  { path: 'owner', select: 'name' },
]

function toPublicProduct(product) {
  if (!product || typeof product !== 'object' || !product._id) return null

  return {
    id: String(product._id),
    title: product.title,
    images: Array.isArray(product.images) ? product.images : [],
    rentPerDay: product.rentPerDay,
    location: product.location,
    availability: product.availability,
  }
}

function toPublicUser(user) {
  if (!user || typeof user !== 'object' || !user._id) return null

  return {
    id: String(user._id),
    name: user.name,
  }
}

function toPublicBorrowRequest(request) {
  return {
    id: String(request._id),
    product: toPublicProduct(request.product),
    borrower: toPublicUser(request.borrower),
    owner: toPublicUser(request.owner),
    startDate: request.startDate,
    endDate: request.endDate,
    message: request.message || '',
    status: request.status,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    decidedAt: request.decidedAt || null,
    decisionSource: request.decisionSource || null,
    cancelledAt: request.cancelledAt || null,
    completedAt: request.completedAt || null,
  }
}

function assertRequestId(id) {
  if (typeof id !== 'string' || !OBJECT_ID_REGEX.test(id)) {
    throw new ApiError(400, 'Invalid borrow request id')
  }
}

async function getPopulatedRequest(requestId) {
  const request = await BorrowRequest.findById(requestId).populate(POPULATE)
  if (!request) {
    throw new ApiError(404, 'Borrow request not found')
  }

  return { request: toPublicBorrowRequest(request) }
}

function terminalStatusError(status) {
  return new ApiError(409, `This request is already ${status.toLowerCase()}`)
}

function buildListFilter(ownerId, status) {
  const filter = { owner: ownerId }
  if (status) filter.status = status
  return filter
}

function buildBorrowerFilter(borrowerId, status, product) {
  const filter = { borrower: borrowerId }
  if (status) filter.status = status
  if (product) filter.product = product
  return filter
}

async function listRequests(filter, { page, limit }) {
  const skip = (page - 1) * limit

  const [documents, total] = await Promise.all([
    BorrowRequest.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate(POPULATE)
      .lean(),
    BorrowRequest.countDocuments(filter),
  ])

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit)

  return {
    requests: documents.map(toPublicBorrowRequest),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1 && totalPages > 0,
    },
  }
}

export async function createBorrowRequest(borrowerId, input) {
  const product = await Product.findOne({
    _id: input.product,
    moderationStatus: 'active',
    isPublished: { $ne: false },
  })
    .select('_id owner availability')
    .lean()

  if (!product) {
    throw new ApiError(404, 'Product not found or not available')
  }

  if (String(product.owner) === String(borrowerId)) {
    throw new ApiError(400, 'You cannot borrow your own product')
  }

  if (product.availability !== 'available') {
    throw new ApiError(409, 'This product is currently unavailable')
  }

  const existingPending = await BorrowRequest.exists({
    product: product._id,
    borrower: borrowerId,
    status: 'Pending',
  })
  if (existingPending) {
    throw new ApiError(409, 'You already have a pending request for this product')
  }

  const existingAccepted = await BorrowRequest.exists({
    product: product._id,
    status: 'Accepted',
  })
  if (existingAccepted) {
    throw new ApiError(409, 'This product already has an accepted borrowing request')
  }

  let request
  try {
    request = await BorrowRequest.create({
      product: product._id,
      owner: product.owner,
      borrower: borrowerId,
      startDate: input.startDate,
      endDate: input.endDate,
      message: input.message,
    })
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, 'You already have a pending request for this product')
    }
    throw error
  }

  await request.populate(POPULATE)

  return { request: toPublicBorrowRequest(request) }
}

export async function listMyBorrowRequests(borrowerId, query) {
  return listRequests(
    buildBorrowerFilter(borrowerId, query.status, query.product),
    query
  )
}

export async function listIncomingBorrowRequests(ownerId, query) {
  return listRequests(buildListFilter(ownerId, query.status), query)
}

export async function listAllBorrowRequests(query) {
  const filter = {}
  if (query.status) filter.status = query.status
  return listRequests(filter, query)
}

export async function acceptBorrowRequest(requestId, ownerId) {
  assertRequestId(requestId)

  let acceptedId
  try {
    acceptedId = await withTransaction(async (session) => {
      const request = await BorrowRequest.findById(requestId).session(session)
      if (!request) {
        throw new ApiError(404, 'Borrow request not found')
      }
      if (String(request.owner) !== String(ownerId)) {
        throw new ApiError(403, 'Only the listing owner can accept this request')
      }
      if (request.status !== 'Pending') {
        throw terminalStatusError(request.status)
      }

      const product = await Product.findById(request.product).session(session)
      if (!product) {
        throw new ApiError(409, 'The product is no longer available')
      }
      if (
        product.moderationStatus !== 'active' ||
        product.isPublished === false
      ) {
        throw new ApiError(409, 'This product is not available for borrowing')
      }
      if (product.availability !== 'available') {
        throw new ApiError(409, 'This product is currently unavailable')
      }

      const alreadyAccepted = await BorrowRequest.exists({
        _id: { $ne: request._id },
        product: product._id,
        status: 'Accepted',
      }).session(session)
      if (alreadyAccepted) {
        throw new ApiError(
          409,
          'This product already has an accepted borrowing request'
        )
      }

      request.status = 'Accepted'
      request.decidedAt = new Date()
      request.decidedBy = ownerId
      request.decisionSource = 'owner'
      await request.save({ session })

      product.availability = 'unavailable'
      await product.save({ session })

      return request._id
    })
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(
        409,
        'This product already has an accepted borrowing request'
      )
    }
    throw error
  }

  return getPopulatedRequest(acceptedId)
}

export async function rejectBorrowRequest(requestId, ownerId) {
  assertRequestId(requestId)

  const request = await BorrowRequest.findById(requestId)
    .select('owner status')
    .lean()
  if (!request) {
    throw new ApiError(404, 'Borrow request not found')
  }
  if (String(request.owner) !== String(ownerId)) {
    throw new ApiError(403, 'Only the listing owner can reject this request')
  }
  if (request.status !== 'Pending') {
    throw terminalStatusError(request.status)
  }

  const updated = await BorrowRequest.findOneAndUpdate(
    { _id: requestId, owner: ownerId, status: 'Pending' },
    {
      $set: {
        status: 'Rejected',
        decidedAt: new Date(),
        decidedBy: ownerId,
        decisionSource: 'owner',
      },
    },
    { new: true, runValidators: true }
  ).populate(POPULATE)

  if (!updated) {
    throw new ApiError(409, 'This request has already been handled')
  }

  return { request: toPublicBorrowRequest(updated) }
}

export async function cancelBorrowRequest(requestId, borrowerId) {
  assertRequestId(requestId)

  const cancelledId = await withTransaction(async (session) => {
    const request = await BorrowRequest.findById(requestId).session(session)
    if (!request) {
      throw new ApiError(404, 'Borrow request not found')
    }
    if (String(request.borrower) !== String(borrowerId)) {
      throw new ApiError(403, 'Only the borrower can cancel this request')
    }
    if (request.status !== 'Pending' && request.status !== 'Accepted') {
      throw terminalStatusError(request.status)
    }

    const wasAccepted = request.status === 'Accepted'
    request.status = 'Cancelled'
    request.cancelledAt = new Date()
    request.cancelledBy = borrowerId
    await request.save({ session })

    if (wasAccepted) {
      const product = await Product.findById(request.product).session(session)
      if (product && product.availability !== 'available') {
        product.availability = 'available'
        await product.save({ session })
      }
    }

    return request._id
  })

  return getPopulatedRequest(cancelledId)
}

export async function completeBorrowRequest(requestId, ownerId) {
  assertRequestId(requestId)

  const completedId = await withTransaction(async (session) => {
    const request = await BorrowRequest.findById(requestId).session(session)
    if (!request) {
      throw new ApiError(404, 'Borrow request not found')
    }
    if (String(request.owner) !== String(ownerId)) {
      throw new ApiError(
        403,
        'Only the listing owner can mark this request as returned'
      )
    }
    if (request.status !== 'Accepted') {
      throw new ApiError(
        409,
        `Only accepted requests can be marked as returned (current status: ${request.status.toLowerCase()})`
      )
    }

    request.status = 'Completed'
    request.completedAt = new Date()
    request.completedBy = ownerId
    await request.save({ session })

    const product = await Product.findById(request.product).session(session)
    if (product && product.availability !== 'available') {
      product.availability = 'available'
      await product.save({ session })
    }

    return request._id
  })

  return getPopulatedRequest(completedId)
}

export async function reconcileBorrowAvailability() {
  const acceptedRequests = await BorrowRequest.find({ status: 'Accepted' })
    .select('product')
    .lean()

  const productIds = [
    ...new Set(acceptedRequests.map((request) => String(request.product))),
  ]

  if (productIds.length === 0) {
    return { acceptedRequests: 0, productsUpdated: 0 }
  }

  const result = await Product.updateMany(
    {
      _id: { $in: productIds },
      availability: { $ne: 'unavailable' },
    },
    { $set: { availability: 'unavailable' } }
  )

  return {
    acceptedRequests: acceptedRequests.length,
    productsUpdated: result.modifiedCount,
  }
}

export async function initializeBorrowRequestWorkflow() {
  await BorrowRequest.init()
  const transactionsSupported = await detectTransactionsSupported()
  const reconciliation = await reconcileBorrowAvailability()

  return {
    transactionsSupported,
    ...reconciliation,
  }
}
