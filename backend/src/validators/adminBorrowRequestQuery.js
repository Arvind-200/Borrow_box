import { BORROW_REQUEST_STATUSES } from '../models/BorrowRequest.js'
import { parseEnum, parsePositiveInteger } from './queryHelpers.js'

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 50

export function parseAdminBorrowRequestQuery(query = {}) {
  return {
    page: parsePositiveInteger(query.page, 'page', 1),
    limit: parsePositiveInteger(
      query.limit,
      'limit',
      DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    ),
    status: parseEnum(query.status, 'status', BORROW_REQUEST_STATUSES, {
      lowerCase: true,
    }),
  }
}
