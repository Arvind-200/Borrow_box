import mongoose from 'mongoose'

export const PRODUCT_CONDITIONS = ['new', 'like-new', 'good', 'fair']
export const PRODUCT_AVAILABILITY = ['available', 'unavailable']
export const PRODUCT_MODERATION_STATUSES = ['active', 'hidden', 'removed']

const productSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Product owner is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      minlength: [3, 'Product title must be at least 3 characters'],
      maxlength: [120, 'Product title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      minlength: [10, 'Product description must be at least 10 characters'],
      maxlength: [2000, 'Product description cannot exceed 2000 characters'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required'],
      index: true,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (images) =>
          Array.isArray(images) &&
          images.length <= 8 &&
          images.every(
            (image) =>
              typeof image === 'string' &&
              image.trim().length > 0 &&
              image.length <= 500
          ),
        message: 'A product may have up to 8 image entries of 500 characters or fewer',
      },
    },
    rentPerDay: {
      type: Number,
      required: [true, 'Rent per day is required'],
      min: [0, 'Rent per day cannot be negative'],
      max: [1000000, 'Rent per day cannot exceed 1000000'],
    },
    location: {
      type: String,
      required: [true, 'Product location is required'],
      trim: true,
      maxlength: [100, 'Product location cannot exceed 100 characters'],
    },
    availability: {
      type: String,
      enum: PRODUCT_AVAILABILITY,
      default: 'available',
    },
    condition: {
      type: String,
      enum: PRODUCT_CONDITIONS,
      default: 'good',
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (tags) =>
          Array.isArray(tags) &&
          tags.length <= 10 &&
          tags.every(
            (tag) =>
              typeof tag === 'string' &&
              tag.trim().length > 0 &&
              tag.length <= 30
          ),
        message: 'A product may have up to 10 tags of 30 characters or fewer',
      },
    },
    ratingAverage: {
      type: Number,
      default: 0,
      min: [0, 'Rating average cannot be negative'],
      max: [5, 'Rating average cannot exceed 5'],
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: [0, 'Review count cannot be negative'],
    },
    moderationStatus: {
      type: String,
      enum: PRODUCT_MODERATION_STATUSES,
      default: 'active',
    },
    // Stable key used only by the idempotent demo seed. Hidden from API output.
    seedKey: {
      type: String,
      trim: true,
      select: false,
    },
  },
  { timestamps: true }
)

productSchema.index({ moderationStatus: 1, category: 1, rentPerDay: 1 })
productSchema.index({ moderationStatus: 1, rentPerDay: 1 })
productSchema.index({ moderationStatus: 1, ratingAverage: -1, reviewCount: -1 })
productSchema.index({ seedKey: 1 }, { unique: true, sparse: true })

export const Product = mongoose.model('Product', productSchema)
