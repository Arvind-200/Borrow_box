import { parseReportInput } from '../validators/reportInput.js'
import { createReport as createReportService } from '../services/reportService.js'

export async function createReport(req, res, next) {
  try {
    const input = parseReportInput(req.body)
    const result = await createReportService(req.user._id, input)
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}
