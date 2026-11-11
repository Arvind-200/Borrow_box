import { User } from '../models/User.js'
import { Product } from '../models/Product.js'
import { BorrowRequest } from '../models/BorrowRequest.js'
import { Review } from '../models/Review.js'
import { Report } from '../models/Report.js'
import { Category } from '../models/Category.js'
import { listReportsForAdmin } from './reportService.js'
import { listAdminActivity } from './adminActivityService.js'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

const PUBLIC_PRODUCT_FILTER = {
  moderationStatus: 'active',
  isPublished: { $ne: false },
}

function startOfUtcDay(date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  )
}

function buildLastSevenDays() {
  const today = startOfUtcDay(new Date())

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today.getTime() - (6 - index) * DAY_MS)
    return day.toISOString().slice(0, 10)
  })
}

export async function getAdminDashboard() {
  const weekAgo = new Date(Date.now() - WEEK_MS)

  const [
    totalUsers,
    activeUsers,
    blockedUsers,
    newUsersThisWeek,
    totalListings,
    activeListings,
    hiddenListings,
    removedListings,
    totalRequests,
    pendingRequests,
    acceptedRequests,
    completedRequests,
    rejectedRequests,
    cancelledRequests,
    requestsThisWeek,
    totalReports,
    openReports,
    resolvedReports,
    dismissedReports,
    totalReviews,
    visibleReviews,
    hiddenReviews,
    removedReviews,
    totalCategories,
    activeCategories,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ status: 'active' }),
    User.countDocuments({ status: 'blocked' }),
    User.countDocuments({ createdAt: { $gte: weekAgo } }),
    Product.countDocuments({}),
    Product.countDocuments(PUBLIC_PRODUCT_FILTER),
    Product.countDocuments({ moderationStatus: 'hidden' }),
    Product.countDocuments({ moderationStatus: 'removed' }),
    BorrowRequest.countDocuments({}),
    BorrowRequest.countDocuments({ status: 'Pending' }),
    BorrowRequest.countDocuments({ status: 'Accepted' }),
    BorrowRequest.countDocuments({ status: 'Completed' }),
    BorrowRequest.countDocuments({ status: 'Rejected' }),
    BorrowRequest.countDocuments({ status: 'Cancelled' }),
    BorrowRequest.countDocuments({ createdAt: { $gte: weekAgo } }),
    Report.countDocuments({}),
    Report.countDocuments({ status: 'Open' }),
    Report.countDocuments({ status: 'Resolved' }),
    Report.countDocuments({ status: 'Dismissed' }),
    Review.countDocuments({}),
    Review.countDocuments({ status: 'visible' }),
    Review.countDocuments({ status: 'hidden' }),
    Review.countDocuments({ status: 'removed' }),
    Category.countDocuments({}),
    Category.countDocuments({ isActive: true }),
  ])

  const days = buildLastSevenDays()
  const chartStart = new Date(`${days[0]}T00:00:00.000Z`)

  const [listingMixRows, requestTrendRows, reportQueue, activityResult] =
    await Promise.all([
      Product.aggregate([
        { $match: PUBLIC_PRODUCT_FILTER },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            name: { $ifNull: ['$category.name', 'Uncategorized'] },
            count: 1,
          },
        },
        { $sort: { count: -1, name: 1 } },
        { $limit: 5 },
      ]),
      BorrowRequest.aggregate([
        { $match: { createdAt: { $gte: chartStart } } },
        {
          $group: {
            _id: {
              date: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
              },
              status: '$status',
            },
            count: { $sum: 1 },
          },
        },
      ]),
      listReportsForAdmin({ page: 1, limit: 5, status: 'Open' }),
      listAdminActivity({ page: 1, limit: 6 }),
    ])

  const trendByDay = new Map()
  requestTrendRows.forEach((row) => {
    const date = row._id.date
    const current = trendByDay.get(date) || {
      pending: 0,
      accepted: 0,
      total: 0,
    }
    if (row._id.status === 'Pending') current.pending += row.count
    if (row._id.status === 'Accepted') current.accepted += row.count
    current.total += row.count
    trendByDay.set(date, current)
  })

  const requestsLast7Days = days.map((date) => ({
    date,
    ...(trendByDay.get(date) || { pending: 0, accepted: 0, total: 0 }),
  }))

  const unpublishedListings = Math.max(
    totalListings - activeListings - hiddenListings - removedListings,
    0
  )

  return {
    metrics: {
      users: {
        total: totalUsers,
        active: activeUsers,
        blocked: blockedUsers,
        newThisWeek: newUsersThisWeek,
      },
      listings: {
        total: totalListings,
        active: activeListings,
        hidden: hiddenListings,
        removed: removedListings,
      },
      requests: {
        total: totalRequests,
        pending: pendingRequests,
        accepted: acceptedRequests,
        completed: completedRequests,
        rejected: rejectedRequests,
        cancelled: cancelledRequests,
        thisWeek: requestsThisWeek,
      },
      reports: {
        total: totalReports,
        open: openReports,
        resolved: resolvedReports,
        dismissed: dismissedReports,
      },
      reviews: {
        total: totalReviews,
        visible: visibleReviews,
        hidden: hiddenReviews,
        removed: removedReviews,
      },
      categories: {
        total: totalCategories,
        active: activeCategories,
      },
    },
    listingStatus: {
      active: activeListings,
      unpublished: unpublishedListings,
      hidden: hiddenListings,
      removed: removedListings,
    },
    listingMix: listingMixRows.map((row) => ({
      name: row.name,
      count: row.count,
    })),
    requestsLast7Days,
    moderationQueue: reportQueue.reports,
    recentActivity: activityResult.activities,
  }
}
