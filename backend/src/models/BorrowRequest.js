import mongoose from 'mongoose'
import { isValidDateOnly } from '../utils/dateOnly.js'

export const BORROW_REQUEST_STATUSES = [
  'Pending',
  'Accepted',
  'Rejected',
  'Cancelled',
]

export const BORROW_REQUEST_DECISION_SOURCES = ['owner', 'system']

const MAX_MESSAGE_LENGTH = 500
const MAX_DECISION_NOTE_LENGTH = 200

const borrowRequestSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
    },
    borrower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Borrower is required'],
    },
    startDate: {
      type: String,
      required: [true, 'Start date is required'],
      trim: true,
      validate: {
        validator: isValidDateOnly,
        message: 'Start date must be a valid date in YYYY-MM-DD format',
      },
    },
    endDate: {
      type: String,
      required: [true, 'End date is required'],
      trim: true,
      validate: {
        validator: isValidDateOnly,
        message: 'End date must be a valid date in YYYY-MM-DD format',
      },
    },
    message: {
      type: String,
      trim: true,
      maxlength: [MAX_MESSAGE_LENGTH, 'Message cannot exceed 500 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: BORROW_REQUEST_STATUSES,
        message: 'Status must be one of: Pending, Accepted, Rejected, Cancelled',
      },
      default: 'Pending',
    },
    decidedAt: {
      type: Date,
      default: null,
    },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    decisionSource: {
      type: String,
      default: null,
      validate: {
        validator: (value) =>
          value === null || BORROW_REQUEST_DECISION_SOURCES.includes(value),
        message: 'Decision source must be owner, system, or null',
      },
    },
    decisionNote: {
      type: String,
      trim: true,
      maxlength: [
        MAX_DECISION_NOTE_LENGTH,
        'Decision note cannot exceed 200 characters',
      ],
      default: '',
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
)

borrowRequestSchema.pre('validate', function validateLifecycle(next) {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    this.invalidate('endDate', 'End date cannot be earlier than start date')
  }

  if (
    this.borrower &&
    this.owner &&
    String(this.borrower) === String(this.owner)
  ) {
    this.invalidate('borrower', 'A user cannot borrow their own product')
  }

  next()
})

// A product can have at most one Accepted request at any time.
borrowRequestSchema.index(
  { product: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'Accepted' },
    name: 'one_accepted_request_per_product',
  }
)

// A borrower can have at most one Pending request per product. Rejected and
// Cancelled requests do not match this partial index, so they never block a
// future request.
borrowRequestSchema.index(
  { product: 1, borrower: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'Pending' },
    name: 'one_pending_request_per_product_borrower',
  }
)

borrowRequestSchema.index({ borrower: 1, createdAt: -1, _id: -1 })
borrowRequestSchema.index({ owner: 1, createdAt: -1, _id: -1 })
borrowRequestSchema.index({ product: 1, status: 1 })

export const BorrowRequest = mongoose.model('BorrowRequest', borrowRequestSchema)
