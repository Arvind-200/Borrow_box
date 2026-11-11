import {
  PRODUCT_AVAILABILITY,
  PRODUCT_MODERATION_STATUSES,
} from '../models/Product.js'
import {
  parseEnum,
  parseObjectId,
  parsePositiveInteger,
  parseSearch,
} from './queryHelpers.js'

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 50

export function parseAdminProductQuery(query = {}) {
  return {
    page: parsePositiveInteger(query.page, 'page', 1),
    limit: parsePositiveInteger(
      query.limit,
      'limit',
      DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    ),
    q: parseSearch(query.q),
    moderationStatus: parseEnum(
      query.moderationStatus,
      'moderationStatus',
      PRODUCT_MODERATION_STATUSES
    ),
    availability: parseEnum(
      query.availability,
      'availability',
      PRODUCT_AVAILABILITY
    ),
    category: parseObjectId(query.category, 'category'),
  }
}
