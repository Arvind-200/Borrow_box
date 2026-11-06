import { parseBorrowRequestInput } from '../validators/borrowRequestInput.js'
import { parseBorrowRequestQuery } from '../validators/borrowRequestQuery.js'
import {
  createBorrowRequest as createBorrowRequestService,
  listMyBorrowRequests as listMyBorrowRequestsService,
  listIncomingBorrowRequests as listIncomingBorrowRequestsService,
  acceptBorrowRequest as acceptBorrowRequestService,
  rejectBorrowRequest as rejectBorrowRequestService,
  cancelBorrowRequest as cancelBorrowRequestService,
} from '../services/borrowRequestService.js'

export async function createBorrowRequest(req, res, next) {
  try {
    const input = parseBorrowRequestInput(req.body)
    const result = await createBorrowRequestService(req.user._id, input)
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

export async function listMyBorrowRequests(req, res, next) {
  try {
    const query = parseBorrowRequestQuery(req.query)
    const result = await listMyBorrowRequestsService(req.user._id, query)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export async function listIncomingBorrowRequests(req, res, next) {
  try {
    const query = parseBorrowRequestQuery(req.query)
    const result = await listIncomingBorrowRequestsService(req.user._id, query)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export async function acceptBorrowRequest(req, res, next) {
  try {
    const result = await acceptBorrowRequestService(
      req.params.id,
      req.user._id
    )
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export async function rejectBorrowRequest(req, res, next) {
  try {
    const result = await rejectBorrowRequestService(
      req.params.id,
      req.user._id
    )
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export async function cancelBorrowRequest(req, res, next) {
  try {
    const result = await cancelBorrowRequestService(
      req.params.id,
      req.user._id
    )
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}
