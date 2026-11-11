import { getAdminDashboard } from '../services/adminDashboardService.js'

export async function getDashboardHandler(req, res, next) {
  try {
    const result = await getAdminDashboard()
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}
