import mongoose from 'mongoose'

export const REVIEW_STATUSES = ['visible', 'hidden', 'removed']
export const REVIEW_REVIEWER_ROLES = ['borrower']

export const MAX_REVIEW_COMMENT_LENGTH = 1000
export const MAX_REVIEW_MODERATION_REASON_LENGTH = 500

const reviewSchema = new mongoose.Schema(
  {
    borrowRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BorrowRequest',
      required: [true, 'Borrow request is required'],
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer is required'],
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewee is required'],
    },
    // Borrower reviews the owner/product. The field is kept explicit so
    // owner-to-borrower reviews can be added later without a migration.
    reviewerRole: {
      type: String,
      enum: {
        values: REVIEW_REVIEWER_ROLES,
        message: 'Reviewer role must be: borrower',
      },
      default: 'borrower',
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating cannot be lower than 1'],
      max: [5, 'Rating cannot be higher than 5'],
      validate: {
        validator: (value) => Number.isInteger(value),
        message: 'Rating must be a whole number between 1 and 5',
      },
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [
        MAX_REVIEW_COMMENT_LENGTH,
        'Comment cannot exceed 1000 characters',
      ],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: REVIEW_STATUSES,
        message: 'Status must be one of: visible, hidden, removed',
      },
      default: 'visible',
    },
    // Reserved for Phase 8 admin moderation.
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    moderatedAt: {
      type: Date,
      default: null,
    },
    moderationReason: {
      type: String,
      trim: true,
      maxlength: [
        MAX_REVIEW_MODERATION_REASON_LENGTH,
        'Moderation reason cannot exceed 500 characters',
      ],
      default: '',
    },
  },
  { timestamps: true }
)

// A borrower can review a given borrow request only once.
reviewSchema.index(
  { borrowRequest: 1, reviewer: 1 },
  { unique: true, name: 'one_review_per_borrow_request_reviewer' }
)

reviewSchema.index({ product: 1, status: 1, createdAt: -1 })
reviewSchema.index({ reviewee: 1, status: 1, createdAt: -1 })
reviewSchema.index({ reviewer: 1, createdAt: -1 })

export const Review = mongoose.model('Review', reviewSchema)
