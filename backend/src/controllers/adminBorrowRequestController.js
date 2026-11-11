import { parseAdminBorrowRequestQuery } from '../validators/adminBorrowRequestQuery.js'
import { listAllBorrowRequests } from '../services/borrowRequestService.js'

export async function listBorrowRequestsHandler(req, res, next) {
  try {
    const query = parseAdminBorrowRequestQuery(req.query)
    const result = await listAllBorrowRequests(query)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}
