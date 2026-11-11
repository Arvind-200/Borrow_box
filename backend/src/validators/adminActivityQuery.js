import {
  ADMIN_ACTIVITY_ACTIONS,
  ADMIN_ACTIVITY_TARGET_TYPES,
} from '../models/AdminActivityLog.js'
import { parseEnum, parsePositiveInteger } from './queryHelpers.js'

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 50

export function parseAdminActivityQuery(query = {}) {
  return {
    page: parsePositiveInteger(query.page, 'page', 1),
    limit: parsePositiveInteger(
      query.limit,
      'limit',
      DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    ),
    action: parseEnum(query.action, 'action', ADMIN_ACTIVITY_ACTIONS),
    targetType: parseEnum(
      query.targetType,
      'targetType',
      ADMIN_ACTIVITY_TARGET_TYPES
    ),
  }
}
