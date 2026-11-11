import { parsePlatformSettingInput } from '../validators/platformSettingInput.js'
import {
  getPlatformSettings,
  updatePlatformSettings,
} from '../services/platformSettingService.js'

export async function getSettingsHandler(req, res, next) {
  try {
    const result = await getPlatformSettings()
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export async function updateSettingsHandler(req, res, next) {
  try {
    const input = parsePlatformSettingInput(req.body)
    const result = await updatePlatformSettings(req.user._id, input)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}
