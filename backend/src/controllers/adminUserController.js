import { parseAdminUserQuery } from '../validators/adminUserQuery.js'
import { parseModerationReason } from '../validators/moderationActionInput.js'
import {
  blockUser,
  getUserForAdmin,
  listUsersForAdmin,
  unblockUser,
  warnUser,
} from '../services/adminUserService.js'

export async function listUsersHandler(req, res, next) {
  try {
    const query = parseAdminUserQuery(req.query)
    const result = await listUsersForAdmin(query)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export async function getUserHandler(req, res, next) {
  try {
    const result = await getUserForAdmin(req.params.id)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export async function warnUserHandler(req, res, next) {
  try {
    const { reason } = parseModerationReason(req.body, { required: true })
    const result = await warnUser(req.params.id, req.user._id, { reason })
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export async function blockUserHandler(req, res, next) {
  try {
    const { reason } = parseModerationReason(req.body, { required: true })
    const result = await blockUser(req.params.id, req.user._id, { reason })
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export async function unblockUserHandler(req, res, next) {
  try {
    const { reason } = parseModerationReason(req.body, { required: false })
    const result = await unblockUser(req.params.id, req.user._id, { reason })
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}
