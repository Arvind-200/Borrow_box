import { Router } from 'express'
import { signup, login, logout, me } from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'
import { loginLimiter, signupLimiter } from '../middleware/rateLimiters.js'

const router = Router()

router.post('/signup', signupLimiter, signup)
router.post('/login', loginLimiter, login)
router.post('/logout', logout)
router.get('/me', requireAuth, me)

export default router
