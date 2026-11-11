import {
  PLATFORM_SETTING_KEY,
  PlatformSetting,
} from '../models/PlatformSetting.js'
import { logAdminAction } from './adminActivityService.js'

function toAdminUser(user) {
  if (!user) return null
  if (typeof user === 'object' && user._id) {
    return { id: String(user._id), name: user.name || '' }
  }

  return { id: String(user), name: '' }
}

function toPlatformSettings(setting) {
  return {
    id: String(setting._id),
    siteName: setting.siteName,
    supportEmail: setting.supportEmail || '',
    allowNewListings: setting.allowNewListings !== false,
    updatedBy: toAdminUser(setting.updatedBy),
    createdAt: setting.createdAt,
    updatedAt: setting.updatedAt,
  }
}

async function ensureSettingsDocument() {
  return PlatformSetting.findOneAndUpdate(
    { key: PLATFORM_SETTING_KEY },
    {
      $setOnInsert: {
        key: PLATFORM_SETTING_KEY,
        siteName: 'BorrowBox',
        supportEmail: '',
        allowNewListings: true,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    }
  )
}

export async function getPlatformSettings() {
  const setting = await ensureSettingsDocument()
  await setting.populate({ path: 'updatedBy', select: 'name' })
  return { settings: toPlatformSettings(setting) }
}

export async function areNewListingsAllowed() {
  const setting = await PlatformSetting.findOne({
    key: PLATFORM_SETTING_KEY,
  })
    .select('allowNewListings')
    .lean()

  return setting?.allowNewListings !== false
}

export async function updatePlatformSettings(adminId, input) {
  const setting = await ensureSettingsDocument()

  Object.assign(setting, input)
  setting.updatedBy = adminId
  await setting.save()

  await logAdminAction({
    admin: adminId,
    action: 'update_settings',
    targetType: 'setting',
    targetId: setting._id,
    metadata: {
      fields: Object.keys(input),
      allowNewListings: setting.allowNewListings,
    },
  })

  await setting.populate({ path: 'updatedBy', select: 'name' })
  return { settings: toPlatformSettings(setting) }
}
