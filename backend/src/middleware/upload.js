import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import multer from 'multer'
import { ApiError } from '../utils/apiError.js'

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))

export const uploadsDir = path.resolve(currentDirectory, '../../uploads')
export const productsUploadsDir = path.join(uploadsDir, 'products')

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

const EXTENSIONS_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}

fs.mkdirSync(productsUploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, productsUploadsDir)
  },
  filename: (req, file, callback) => {
    const extension = EXTENSIONS_BY_MIME[file.mimetype] || ''
    callback(
      null,
      `${Date.now()}-${crypto.randomBytes(16).toString('hex')}${extension}`
    )
  },
})

function fileFilter(req, file, callback) {
  if (!EXTENSIONS_BY_MIME[file.mimetype]) {
    callback(
      new ApiError(400, 'Only JPEG, PNG, WebP, or GIF images are allowed')
    )
    return
  }

  callback(null, true)
}

const uploader = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_IMAGE_BYTES,
    files: 1,
  },
})

export function uploadProductImage(req, res, next) {
  uploader.single('image')(req, res, (error) => {
    if (!error) {
      next()
      return
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        next(new ApiError(413, 'Image must be 5 MB or smaller'))
        return
      }
      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        next(
          new ApiError(
            400,
            'Upload a single image using the "image" field'
          )
        )
        return
      }
      next(new ApiError(400, 'Image upload failed'))
      return
    }

    next(error)
  })
}
