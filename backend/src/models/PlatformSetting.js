import mongoose from 'mongoose'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const PLATFORM_SETTING_KEY = 'platform'

const platformSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      enum: [PLATFORM_SETTING_KEY],
      default: PLATFORM_SETTING_KEY,
      immutable: true,
    },
    siteName: {
      type: String,
      trim: true,
      maxlength: [80, 'Site name cannot exceed 80 characters'],
      default: 'BorrowBox',
    },
    supportEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [120, 'Support email cannot exceed 120 characters'],
      default: '',
      validate: {
        validator: (value) => !value || EMAIL_REGEX.test(value),
        message: 'Support email must be a valid email address',
      },
    },
    allowNewListings: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
)

export const PlatformSetting = mongoose.model(
  'PlatformSetting',
  platformSettingSchema
)
