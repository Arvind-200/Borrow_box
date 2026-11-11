import { parseAdminActivityQuery } from '../validators/adminActivityQuery.js'
import { listAdminActivity } from '../services/adminActivityService.js'

export async function listActivityHandler(req, res, next) {
  try {
    const query = parseAdminActivityQuery(req.query)
    const result = await listAdminActivity(query)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}
