import { parseReportQuery } from '../validators/reportQuery.js'
import {
  parseReportDismissInput,
  parseReportResolutionInput,
} from '../validators/moderationActionInput.js'
import {
  dismissReport as dismissReportService,
  getReportForAdmin,
  listReportsForAdmin,
  resolveReport as resolveReportService,
} from '../services/reportService.js'

export async function listReports(req, res, next) {
  try {
    const query = parseReportQuery(req.query)
    const result = await listReportsForAdmin(query)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export async function getReport(req, res, next) {
  try {
    const result = await getReportForAdmin(req.params.id)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export async function resolveReport(req, res, next) {
  try {
    const input = parseReportResolutionInput(req.body)
    const result = await resolveReportService(req.params.id, req.user._id, input)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export async function dismissReport(req, res, next) {
  try {
    const input = parseReportDismissInput(req.body)
    const result = await dismissReportService(
      req.params.id,
      req.user._id,
      input
    )
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}
