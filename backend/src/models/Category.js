import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      minlength: [2, 'Category name must be at least 2 characters'],
      maxlength: [50, 'Category name cannot exceed 50 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      trim: true,
      lowercase: true,
      unique: true,
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Category slug may only contain lowercase letters, numbers, and hyphens',
      ],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Category description cannot exceed 300 characters'],
      default: '',
    },
    icon: {
      type: String,
      trim: true,
      maxlength: [50, 'Category icon name cannot exceed 50 characters'],
      default: 'box',
    },
    sortOrder: {
      type: Number,
      default: 0,
      min: [0, 'Sort order cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

categorySchema.index({ isActive: 1, sortOrder: 1, name: 1 })

export const Category = mongoose.model('Category', categorySchema)
