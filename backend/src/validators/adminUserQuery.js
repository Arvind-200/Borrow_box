import { USER_ROLES, USER_STATUSES } from '../models/User.js'
import {
  parseEnum,
  parsePositiveInteger,
  parseSearch,
} from './queryHelpers.js'

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 50

export function parseAdminUserQuery(query = {}) {
  return {
    page: parsePositiveInteger(query.page, 'page', 1),
    limit: parsePositiveInteger(
      query.limit,
      'limit',
      DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    ),
    q: parseSearch(query.q),
    role: parseEnum(query.role, 'role', USER_ROLES),
    status: parseEnum(query.status, 'status', USER_STATUSES),
  }
}
