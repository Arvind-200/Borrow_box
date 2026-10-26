import crypto from 'node:crypto'
import mongoose from 'mongoose'
import { connectDB } from '../src/config/db.js'
import { User } from '../src/models/User.js'
import { Category } from '../src/models/Category.js'
import { Product } from '../src/models/Product.js'
import { hashPassword } from '../src/utils/password.js'

const DEMO_OWNER_EMAIL = 'demo.owner@borrowbox.local'

const DEMO_CATEGORIES = [
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Phones, speakers, consoles and everyday gadgets.',
    icon: 'electronics',
    sortOrder: 1,
  },
  {
    name: 'Cameras',
    slug: 'cameras',
    description: 'DSLRs, lenses, action cameras and photography gear.',
    icon: 'camera',
    sortOrder: 2,
  },
  {
    name: 'Tools',
    slug: 'tools',
    description: 'Drills, saws, ladders and DIY equipment.',
    icon: 'tools',
    sortOrder: 3,
  },
  {
    name: 'Gaming',
    slug: 'gaming',
    description: 'Consoles, controllers and gaming accessories.',
    icon: 'gaming',
    sortOrder: 4,
  },
  {
    name: 'Outdoor',
    slug: 'outdoor',
    description: 'Tents, camping gear and adventure equipment.',
    icon: 'outdoor',
    sortOrder: 5,
  },
  {
    name: 'Events & Party',
    slug: 'events',
    description: 'Projectors, speakers and party essentials.',
    icon: 'events',
    sortOrder: 6,
  },
  {
    name: 'Sports',
    slug: 'sports',
    description: 'Bicycles, rackets and fitness equipment.',
    icon: 'sports',
    sortOrder: 7,
  },
  {
    name: 'Home & Utility',
    slug: 'home',
    description: 'Cleaning, gardening and household tools.',
    icon: 'home',
    sortOrder: 8,
  },
]

const DEMO_PRODUCTS = [
  {
    seedKey: 'demo-dslr-camera-kit',
    title: 'DSLR Camera Kit',
    description:
      'A complete DSLR kit with a versatile zoom lens, spare battery, charger and padded carry bag. Ideal for events, travel and content creation.',
    categorySlug: 'cameras',
    rentPerDay: 800,
    location: 'Central District',
    availability: 'available',
    condition: 'good',
    images: [],
    tags: ['Popular', 'Photography'],
    ratingAverage: 4.9,
    reviewCount: 47,
  },
  {
    seedKey: 'demo-cordless-drill-set',
    title: 'Cordless Drill Set',
    description:
      'Cordless drill with two batteries, charger and a 24-piece bit set. Suitable for furniture assembly, shelf mounting and light home repairs.',
    categorySlug: 'tools',
    rentPerDay: 350,
    location: 'Riverside',
    availability: 'available',
    condition: 'good',
    images: [],
    tags: ['DIY', 'Home repair'],
    ratingAverage: 4.7,
    reviewCount: 32,
  },
  {
    seedKey: 'demo-bluetooth-speaker',
    title: 'Bluetooth Speaker',
    description:
      'Portable Bluetooth speaker with clear sound, deep bass and a full-day battery. Comes with a charging cable and carry strap.',
    categorySlug: 'electronics',
    rentPerDay: 200,
    location: 'University Area',
    availability: 'available',
    condition: 'like-new',
    images: [],
    tags: ['New', 'Audio'],
    ratingAverage: 4.6,
    reviewCount: 28,
  },
  {
    seedKey: 'demo-projector-screen',
    title: 'Projector & Screen',
    description:
      'Full HD projector with a portable 100-inch screen, HDMI cable and remote. Great for movie nights, presentations and small events.',
    categorySlug: 'events',
    rentPerDay: 600,
    location: 'Tech Park',
    availability: 'available',
    condition: 'good',
    images: [],
    tags: ['Events', 'Movie night'],
    ratingAverage: 4.8,
    reviewCount: 19,
  },
  {
    seedKey: 'demo-gaming-console',
    title: 'Gaming Console',
    description:
      'Modern gaming console with two wireless controllers and a selection of family-friendly games. Includes all required cables.',
    categorySlug: 'gaming',
    rentPerDay: 500,
    location: 'Central District',
    availability: 'available',
    condition: 'good',
    images: [],
    tags: ['Popular', 'Family'],
    ratingAverage: 4.9,
    reviewCount: 41,
  },
  {
    seedKey: 'demo-4-person-tent',
    title: '4-Person Tent',
    description:
      'Weather-resistant four-person tent with a quick-pitch frame, carry bag and groundsheet. Suitable for weekend camping trips.',
    categorySlug: 'outdoor',
    rentPerDay: 400,
    location: 'Old Town',
    availability: 'available',
    condition: 'fair',
    images: [],
    tags: ['Camping', 'Weekend'],
    ratingAverage: 4.5,
    reviewCount: 22,
  },
  {
    seedKey: 'demo-road-bicycle',
    title: 'Road Bicycle',
    description:
      'Lightweight road bicycle with a comfortable frame, fresh tyres and a helmet included. Ideal for commuting or longer weekend rides.',
    categorySlug: 'sports',
    rentPerDay: 300,
    location: 'Riverside',
    availability: 'available',
    condition: 'good',
    images: [],
    tags: ['Cycling', 'Commute'],
    ratingAverage: 4.7,
    reviewCount: 15,
  },
  {
    seedKey: 'demo-rotary-hammer-drill',
    title: 'Rotary Hammer Drill',
    description:
      'Powerful rotary hammer drill for concrete and masonry work. Includes a set of SDS bits, safety goggles and a sturdy carry case.',
    categorySlug: 'tools',
    rentPerDay: 450,
    location: 'Tech Park',
    availability: 'available',
    condition: 'good',
    images: [],
    tags: ['DIY', 'Heavy duty'],
    ratingAverage: 4.6,
    reviewCount: 18,
  },
]

async function ensureDemoOwner() {
  const existing = await User.findOne({ email: DEMO_OWNER_EMAIL })
  if (existing) return existing

  // The demo owner cannot be used to log in: a random password is hashed and
  // never printed. This account exists only to own seeded products.
  const passwordHash = await hashPassword(crypto.randomBytes(32).toString('hex'))

  return User.create({
    name: 'BorrowBox Demo',
    email: DEMO_OWNER_EMAIL,
    passwordHash,
    role: 'user',
    status: 'active',
  })
}

async function seed() {
  await connectDB()

  try {
    await Promise.all([Category.init(), Product.init()])

    const owner = await ensureDemoOwner()
    const categoriesBySlug = new Map()

    for (const category of DEMO_CATEGORIES) {
      const document = await Category.findOneAndUpdate(
        { slug: category.slug },
        { $set: category },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
          runValidators: true,
        }
      )
      categoriesBySlug.set(category.slug, document)
    }

    for (const product of DEMO_PRODUCTS) {
      const category = categoriesBySlug.get(product.categorySlug)
      if (!category) {
        throw new Error(`Missing seed category: ${product.categorySlug}`)
      }

      const { categorySlug, seedKey, ...fields } = product

      await Product.findOneAndUpdate(
        { seedKey },
        {
          $set: {
            ...fields,
            owner: owner._id,
            category: category._id,
          },
          $setOnInsert: { seedKey },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
          runValidators: true,
        }
      )
    }

    console.log(
      `Seed complete: ${DEMO_CATEGORIES.length} categories and ${DEMO_PRODUCTS.length} demo products upserted.`
    )
    console.log(
      `Demo owner: ${DEMO_OWNER_EMAIL} (login is not possible; password is random and never printed).`
    )
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close()
    }
  }
}

seed().catch((error) => {
  console.error('Seed failed:', error.message)
  process.exitCode = 1
})
