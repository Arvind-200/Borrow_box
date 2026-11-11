import mongoose from 'mongoose'

export const ADMIN_ACTIVITY_ACTIONS = [
  'warn_user',
  'block_user',
  'unblock_user',
  'hide_product',
  'remove_product',
  'restore_product',
  'hide_review',
  'remove_review',
  'restore_review',
  'resolve_report',
  'dismiss_report',
  'create_category',
  'update_category',
  'activate_category',
  'deactivate_category',
  'update_settings',
]
export const ADMIN_ACTIVITY_TARGET_TYPES = [
  'user',
  'product',
  'review',
  'report',
  'category',
  'setting',
]

export const MAX_ADMIN_ACTIVITY_REASON_LENGTH = 500

const adminActivityLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin is required'],
    },
    action: {
      type: String,
      enum: {
        values: ADMIN_ACTIVITY_ACTIONS,
        message: 'Unsupported admin activity action',
      },
      required: [true, 'Action is required'],
    },
    targetType: {
      type: String,
      enum: {
        values: ADMIN_ACTIVITY_TARGET_TYPES,
        message: 'Target type must be one of: user, product, review, report',
      },
      required: [true, 'Target type is required'],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Target id is required'],
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [
        MAX_ADMIN_ACTIVITY_REASON_LENGTH,
        'Reason cannot exceed 500 characters',
      ],
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
)

adminActivityLogSchema.index({ admin: 1, createdAt: -1 })
adminActivityLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 })

export const AdminActivityLog = mongoose.model(
  'AdminActivityLog',
  adminActivityLogSchema
)
