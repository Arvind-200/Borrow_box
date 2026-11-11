import mongoose from 'mongoose'

export const REPORT_TARGET_TYPES = ['product', 'user', 'review']
export const REPORT_TARGET_MODELS = {
  product: 'Product',
  user: 'User',
  review: 'Review',
}
export const REPORT_REASONS = [
  'prohibited_item',
  'fake_listing',
  'scam_fraud',
  'wrong_information',
  'offensive_content',
  'duplicate_listing',
  'other',
]
export const REPORT_STATUSES = ['Open', 'Resolved', 'Dismissed']
export const REPORT_RESOLUTION_ACTIONS = [
  'none',
  'warn_user',
  'block_user',
  'hide_product',
  'remove_product',
  'hide_review',
  'remove_review',
]

export const MAX_REPORT_DESCRIPTION_LENGTH = 1000
export const MAX_REPORT_NOTE_LENGTH = 1000

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter is required'],
    },
    targetType: {
      type: String,
      enum: {
        values: REPORT_TARGET_TYPES,
        message: 'Target type must be one of: product, user, review',
      },
      required: [true, 'Target type is required'],
    },
    targetModel: {
      type: String,
      enum: {
        values: Object.values(REPORT_TARGET_MODELS),
        message: 'Target model must be Product, User, or Review',
      },
      required: [true, 'Target model is required'],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'targetModel',
      required: [true, 'Target id is required'],
    },
    reason: {
      type: String,
      enum: {
        values: REPORT_REASONS,
        message: 'A supported report reason is required',
      },
      required: [true, 'Report reason is required'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [
        MAX_REPORT_DESCRIPTION_LENGTH,
        'Description cannot exceed 1000 characters',
      ],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: REPORT_STATUSES,
        message: 'Status must be Open, Resolved, or Dismissed',
      },
      default: 'Open',
    },
    resolutionAction: {
      type: String,
      enum: {
        values: REPORT_RESOLUTION_ACTIONS,
        message: 'Unsupported resolution action',
      },
      default: 'none',
    },
    resolutionNote: {
      type: String,
      trim: true,
      maxlength: [
        MAX_REPORT_NOTE_LENGTH,
        'Resolution note cannot exceed 1000 characters',
      ],
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
)

// A reporter may have only one open report per target. Once it is resolved or
// dismissed, they can report the target again if needed.
reportSchema.index(
  { reporter: 1, targetType: 1, targetId: 1 },
  {
    unique: true,
    name: 'one_open_report_per_reporter_target',
    partialFilterExpression: { status: 'Open' },
  }
)

reportSchema.index({ status: 1, createdAt: -1 })
reportSchema.index({ targetType: 1, targetId: 1 })
reportSchema.index({ reporter: 1, createdAt: -1 })

export const Report = mongoose.model('Report', reportSchema)
