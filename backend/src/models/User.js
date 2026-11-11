import mongoose from 'mongoose'

export const USER_ROLES = ['user', 'admin']
export const USER_STATUSES = ['active', 'blocked']

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'user',
    },
    status: {
      type: String,
      enum: USER_STATUSES,
      default: 'active',
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
    warningCount: {
      type: Number,
      default: 0,
      min: [0, 'Warning count cannot be negative'],
    },
    lastWarnedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
)

export const User = mongoose.model('User', userSchema)
