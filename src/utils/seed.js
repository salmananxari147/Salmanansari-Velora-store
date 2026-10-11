import dotenv from 'dotenv'
import mongoose from 'mongoose'
import User from '../models/User.js'
import Category from '../models/Category.js'
import Product from '../models/Product.js'
import Review from '../models/Review.js'
import Order from '../models/Order.js'
import Coupon from '../models/Coupon.js'
import { connectDB } from '../config/db.js'
import { pathToFileURL } from 'url'

dotenv.config()

const shot = (id) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1400&q=85`

const SIZES = ['7', '8', '8.5', '9', '10', '11', '12']

export async function seedIfEmpty() {
  const existing = await Product.countDocuments()
  if (existing > 0 && process.env.SEED_FRESH !== 'true') {
    console.log('Catalog already seeded')
    return
  }

  if (process.env.SEED_FRESH === 'true') {
    await Promise.all([
      User.deleteMany(),
      Category.deleteMany(),
      Product.deleteMany(),
      Review.deleteMany(),
      Order.deleteMany(),
      Coupon.deleteMany(),
    ])
  }

  const [admin, alex, jordan, sam] = await User.create([
    { name: 'VELORA Admin', email: 'admin@velora.com', password: 'Admin123!', role: 'admin' },
    {
      name: 'Alex Mercer',
      email: 'alex@velora.com',
      password: 'Customer123!',
      phone: '555 014 2281',
      addresses: [
        {
          label: 'Home',
          firstName: 'Alex',
          lastName: 'Mercer',
          phone: '555 014 2281',
          address: '48 Mercer Street',
          city: 'New York',
          postalCode: '10013',
          isDefault: true,
        },
      ],
    },
    { name: 'Jordan Hale', email: 'jordan@velora.com', password: 'Customer123!' },
    { name: 'Sam Ortiz', email: 'sam@velora.com', password: 'Customer123!' },
  ])

  const categoryDocs = await Category.create([
    {
      name: 'Sneakers',
      slug: 'sneakers',
      description: 'Court shapes and everyday trainers.',
      image: shot('1552346154-21d32810aba3'),
    },
    {
      name: 'Running',
      slug: 'running',
      description: 'Light, fast shoes for distance and city miles.',
      image: shot('1556906781-9a412961c28c'),
    },
    {
      name: 'Casual',
      slug: 'casual',
      description: 'Clean pairs for days that do not need a plan.',
      image: shot('1525966222134-fcfa99b8ae77'),
    },
    {
      name: 'Formal',
      slug: 'formal',
      description: 'Sharp leather for evenings and tailored days.',
      image: shot('1449505278894-297fdb3edbc1'),
    },
    {
      name: 'Boots',
      slug: 'boots',
      description: 'Weather-ready boots with a tailored silhouette.',
      image: shot('1520639888713-7851133b1ed0'),
    },
    {
      name: 'Loafers',
      slug: 'loafers',
      description: 'Slip-on leather with a quieter kind of polish.',
      image: shot('1614252369475-531eba835eb1'),
    },
    {
      name: 'Slides',
      slug: 'slides',
      description: 'Easy off-duty pairs for warm days.',
      image: shot('1603487742131-4160ec999306'),
    },
  ])

  const cat = Object.fromEntries(categoryDocs.map((item) => [item.slug, item._id]))

  const catalog = [
    {
      name: 'Aero Court High',
      slug: 'aero-court-high',
      category: cat.sneakers,
      price: 178,
      comparePrice: 210,
      accentColor: '#2F6BFF',
      featured: true,
      newArrival: true,
      trending: true,
      stock: 24,
      images: [shot('1515955656352-a1fa3ffcd111'), shot('1551107696-a4b0c5a0d9a2')],
      colors: [
        { name: 'Signal Blue', hex: '#2F6BFF' },
        { name: 'White', hex: '#F4F1EA' },
      ],
      description:
        'A high-court sneaker cut from smooth leather with a cushioned cupsole. Built for long city days without looking like gym gear.',
    },
    {
      name: 'Night Form Oxford',
      slug: 'night-form-oxford',
      category: cat.formal,
      price: 220,
      comparePrice: 0,
      accentColor: '#2A2A2A',
      featured: true,
      newArrival: false,
      trending: true,
      stock: 16,
      images: [shot('1533867617858-e7b97e060509'), shot('1449505278894-297fdb3edbc1')],
      colors: [{ name: 'Ink', hex: '#1A1A1A' }],
      description:
        'A slim oxford in polished calf with a soft leather lining. The last is narrow enough for tailored trousers and comfortable enough for a full evening.',
    },
    {
      name: 'Ember Run',
      slug: 'ember-run',
      category: cat.running,
      price: 168,
      comparePrice: 190,
      accentColor: '#FF5A1F',
      featured: true,
      newArrival: true,
      trending: true,
      stock: 30,
      images: [shot('1549298916-b41d501d3772'), shot('1460353581641-37baddab0fa2')],
      colors: [
        { name: 'Ember', hex: '#FF5A1F' },
        { name: 'White', hex: '#F7F4EE' },
      ],
      description:
        'A lightweight runner with a responsive foam midsole and a breathable knit upper. Designed for daily mileage and early trains.',
    },
    {
      name: 'Ridge Boot',
      slug: 'ridge-boot',
      category: cat.boots,
      price: 248,
      comparePrice: 280,
      accentColor: '#8C5A34',
      featured: true,
      newArrival: false,
      trending: true,
      stock: 12,
      images: [shot('1520639888713-7851133b1ed0'), shot('1514989940723-e8e51635b782')],
      colors: [{ name: 'Saddle', hex: '#8C5A34' }],
      description:
        'A leather boot with a stacked sole and a clean ankle line. Storm welt detailing keeps the shape sharp after wet commutes.',
    },
    {
      name: 'Cloud Low',
      slug: 'cloud-low',
      category: cat.casual,
      price: 154,
      comparePrice: 0,
      accentColor: '#C8C2B6',
      featured: true,
      newArrival: true,
      trending: false,
      stock: 28,
      images: [shot('1600185365483-26d7a4cc7519'), shot('1579338559194-a162d19bf842')],
      colors: [
        { name: 'Cloud', hex: '#E7E1D6' },
        { name: 'Stone', hex: '#B7B1A6' },
      ],
      description:
        'An off-white low with a soft collar and a quiet rubber sole. The pair you reach for when the rest of the wardrobe is already decided.',
    },
    {
      name: 'Field Knit',
      slug: 'field-knit',
      category: cat.sneakers,
      price: 142,
      comparePrice: 0,
      accentColor: '#1F7A4D',
      featured: false,
      newArrival: true,
      trending: true,
      stock: 20,
      images: [shot('1606107557195-0e29a4b5b4aa'), shot('1595950653106-6c9ebd614d3a')],
      colors: [{ name: 'Grove', hex: '#1F7A4D' }],
      description:
        'A knit sneaker with a wrapped midsole and a low collar. Light on the foot, precise through the toe.',
    },
    {
      name: 'Metro Pace',
      slug: 'metro-pace',
      category: cat.running,
      price: 158,
      comparePrice: 175,
      accentColor: '#4C4F55',
      featured: false,
      newArrival: false,
      trending: true,
      stock: 18,
      images: [shot('1556906781-9a412961c28c'), shot('1460353581641-37baddab0fa2')],
      colors: [
        { name: 'Graphite', hex: '#4C4F55' },
        { name: 'White', hex: '#F3F1EC' },
      ],
      description:
        'A daily trainer tuned for pavement. Cushioned heel, firmer forefoot, and a reflective heel tab for late runs.',
    },
    {
      name: 'Atelier Loafer',
      slug: 'atelier-loafer',
      category: cat.loafers,
      price: 198,
      comparePrice: 0,
      accentColor: '#6B3E2E',
      featured: false,
      newArrival: true,
      trending: false,
      stock: 14,
      images: [shot('1614252369475-531eba835eb1'), shot('1533867617858-e7b97e060509')],
      colors: [{ name: 'Cognac', hex: '#6B3E2E' }],
      description:
        'A leather loafer with a hand-finished apron toe. Unlined for warmer months, still structured enough for a jacket.',
    },
    {
      name: 'Harbor Slide',
      slug: 'harbor-slide',
      category: cat.slides,
      price: 78,
      comparePrice: 0,
      accentColor: '#111111',
      featured: false,
      newArrival: true,
      trending: false,
      stock: 40,
      images: [shot('1603487742131-4160ec999306'), shot('1560769629-975ec94e6a86')],
      colors: [
        { name: 'Black', hex: '#111111' },
        { name: 'Sand', hex: '#D8C7A8' },
      ],
      description:
        'A contoured slide with a soft footbed and a wide strap. Made for weekends, studios, and the walk to the water.',
    },
    {
      name: 'Form Derby',
      slug: 'form-derby',
      category: cat.formal,
      price: 210,
      comparePrice: 240,
      accentColor: '#3A3330',
      featured: false,
      newArrival: false,
      trending: false,
      stock: 11,
      images: [shot('1449505278894-297fdb3edbc1'), shot('1533867617858-e7b97e060509')],
      colors: [{ name: 'Espresso', hex: '#3A3330' }],
      description:
        'An open-lacing derby in matte leather. Easier through the instep than an oxford, just as considered.',
    },
    {
      name: 'Drift Court',
      slug: 'drift-court',
      category: cat.casual,
      price: 136,
      comparePrice: 0,
      accentColor: '#C0392B',
      featured: false,
      newArrival: true,
      trending: true,
      stock: 22,
      images: [shot('1542291026-7eec264c27ff'), shot('1562183241-b937e95585b6')],
      colors: [{ name: 'Cardinal', hex: '#C0392B' }],
      description:
        'A low court shoe in saturated leather with a cream midsole. The accent is the color, not the hardware.',
    },
    {
      name: 'Summit Boot',
      slug: 'summit-boot',
      category: cat.boots,
      price: 268,
      comparePrice: 0,
      accentColor: '#1E1E1E',
      featured: false,
      newArrival: false,
      trending: true,
      stock: 9,
      images: [shot('1608256246200-53e635b5b65f'), shot('1514989940723-e8e51635b782')],
      colors: [{ name: 'Black', hex: '#1E1E1E' }],
      description:
        'A black leather boot with a lug sole that still reads as tailoring. Padded collar, clean seams, no extra branding.',
    },
    {
      name: 'Pace Elite',
      slug: 'pace-elite',
      category: cat.running,
      price: 184,
      comparePrice: 0,
      accentColor: '#2457C5',
      featured: false,
      newArrival: true,
      trending: false,
      stock: 15,
      images: [shot('1551107696-a4b0c5a0d9a2'), shot('1584735175315-9d5df23860e6')],
      colors: [{ name: 'Race Blue', hex: '#2457C5' }],
      description:
        'A race-day flat with a stripped upper and a firm plate feel. For tempo work and the mornings you actually feel fast.',
    },
    {
      name: 'Linen Slip',
      slug: 'linen-slip',
      category: cat.loafers,
      price: 176,
      comparePrice: 198,
      accentColor: '#C2B49A',
      featured: false,
      newArrival: false,
      trending: false,
      stock: 13,
      images: [shot('1491553895911-0055eca6402d'), shot('1614252369475-531eba835eb1')],
      colors: [{ name: 'Linen', hex: '#C2B49A' }],
      description:
        'A pale loafer in tumbled leather. The sole is light, the toe is almond, and the finish stays matte.',
    },
    {
      name: 'Court 90',
      slug: 'court-90',
      category: cat.sneakers,
      price: 148,
      comparePrice: 0,
      accentColor: '#E10600',
      featured: false,
      newArrival: false,
      trending: true,
      stock: 26,
      images: [shot('1562183241-b937e95585b6'), shot('1542291026-7eec264c27ff')],
      colors: [
        { name: 'Red', hex: '#E10600' },
        { name: 'White', hex: '#F5F3EE' },
      ],
      description:
        'A retro court silhouette updated with a softer insole and a slimmer foxing. Looks right with denim or a suit trouser.',
    },
    {
      name: 'After Hours',
      slug: 'after-hours',
      category: cat.formal,
      price: 236,
      comparePrice: 0,
      accentColor: '#111111',
      featured: false,
      newArrival: true,
      trending: false,
      stock: 8,
      images: [shot('1533867617858-e7b97e060509'), shot('1449505278894-297fdb3edbc1')],
      colors: [{ name: 'Black', hex: '#111111' }],
      description:
        'A whole-cut dress shoe with a mirror toe and a leather sole. Reserved for the nights that ask for less decoration.',
    },
    {
      name: 'Pool Slide',
      slug: 'pool-slide',
      category: cat.slides,
      price: 68,
      comparePrice: 0,
      accentColor: '#D8C7A8',
      featured: false,
      newArrival: false,
      trending: false,
      stock: 0,
      images: [shot('1603487742131-4160ec999306')],
      colors: [{ name: 'Sand', hex: '#D8C7A8' }],
      description:
        'A single-strap slide in sand leather. Currently resting between seasons — join the list when it returns.',
    },
    {
      name: 'Weekend Knit',
      slug: 'weekend-knit',
      category: cat.casual,
      price: 128,
      comparePrice: 0,
      accentColor: '#5C6B73',
      featured: false,
      newArrival: true,
      trending: false,
      stock: 19,
      images: [shot('1560769629-975ec94e6a86'), shot('1595950653106-6c9ebd614d3a')],
      colors: [{ name: 'Slate', hex: '#5C6B73' }],
      description:
        'A soft knit casual with a roomy toe box. Easy to pack, easy to walk in, and quiet enough for a hotel lobby.',
    },
  ].map((product) => ({
    ...product,
    brand: 'VELORA',
    sizes: SIZES,
    rating: 0,
    numReviews: 0,
  }))

  const products = await Product.create(catalog)
  const bySlug = Object.fromEntries(products.map((product) => [product.slug, product]))

  const reviewSeeds = [
    ['aero-court-high', alex, 5, 'The leather breaks in cleanly and the sole stays quiet on pavement.'],
    ['aero-court-high', jordan, 4, 'True to size. I wear a 10 and the 10 fits without a thick sock.'],
    ['night-form-oxford', alex, 5, 'Wore these to a dinner and forgot I had new shoes on. That is the point.'],
    ['ember-run', sam, 5, 'Light without feeling thin. Good for 10k and the walk home after.'],
    ['ember-run', jordan, 4, 'The orange is deeper in person. Cushioning is exactly enough.'],
    ['ridge-boot', alex, 5, 'Holds a crease well. Looks like a boot, walks like a shoe.'],
    ['cloud-low', sam, 4, 'Clean pair. The off-white stays brighter than I expected after a week.'],
    ['field-knit', jordan, 5, 'My everyday trainer now. Collar does not bite.'],
    ['atelier-loafer', alex, 5, 'Slips on, still looks finished with a cropped trouser.'],
    ['drift-court', sam, 4, 'The red is strong and the shape is simple. Exactly what I wanted.'],
    ['summit-boot', jordan, 5, 'Solid wet-weather boot that still works with a coat, not a hiking pack.'],
    ['court-90', alex, 4, 'Classic court shoe without the extra bulk.'],
  ]

  await Review.create(
    reviewSeeds.map(([slug, user, rating, comment]) => ({
      user: user._id,
      product: bySlug[slug]._id,
      name: user.name,
      rating,
      comment,
    }))
  )

  const reviewedIds = [...new Set(reviewSeeds.map(([slug]) => String(bySlug[slug]._id)))]
  for (const id of reviewedIds) {
    const stats = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ])
    if (stats[0]) {
      await Product.findByIdAndUpdate(id, {
        rating: Math.round(stats[0].avg * 10) / 10,
        numReviews: stats[0].count,
      })
    }
  }

  await Coupon.create([
    {
      code: 'VELORA10',
      type: 'percent',
      value: 10,
      expiresAt: new Date('2027-12-31'),
      active: true,
      minOrder: 120,
    },
    {
      code: 'MOVE20',
      type: 'fixed',
      value: 20,
      expiresAt: new Date('2027-06-30'),
      active: true,
      minOrder: 80,
    },
  ])

  const sample = (slug, size, qty) => {
    const product = bySlug[slug]
    return {
      product: product._id,
      name: product.name,
      image: product.images[0],
      size,
      color: product.colors[0].name,
      price: product.price,
      qty,
    }
  }

  const orderPayloads = [
    {
      createdAt: monthsAgo(5),
      status: 'Delivered',
      items: [sample('aero-court-high', '10', 1)],
    },
    {
      createdAt: monthsAgo(3),
      status: 'Delivered',
      items: [sample('ridge-boot', '9', 1), sample('harbor-slide', '10', 1)],
    },
    {
      createdAt: monthsAgo(1),
      status: 'Shipped',
      items: [sample('ember-run', '11', 1)],
    },
    {
      createdAt: monthsAgo(0),
      status: 'Processing',
      items: [sample('night-form-oxford', '10', 1)],
    },
  ]

  for (const payload of orderPayloads) {
    const itemsPrice = payload.items.reduce((sum, item) => sum + item.price * item.qty, 0)
    const shippingPrice = itemsPrice >= 200 ? 0 : 15
    const order = await Order.create({
      user: alex._id,
      orderNumber: `VL-${10420 + (await Order.countDocuments())}`,
      items: payload.items,
      shippingAddress: {
        firstName: 'Alex',
        lastName: 'Mercer',
        email: 'alex@velora.com',
        phone: '555 014 2281',
        address: '48 Mercer Street',
        city: 'New York',
        postalCode: '10013',
      },
      paymentMethod: 'cod',
      itemsPrice,
      shippingPrice,
      discount: 0,
      totalPrice: itemsPrice + shippingPrice,
      status: payload.status,
      isPaid: payload.status === 'Delivered',
      paidAt: payload.status === 'Delivered' ? payload.createdAt : undefined,
      deliveredAt: payload.status === 'Delivered' ? payload.createdAt : undefined,
    })
    await Order.updateOne({ _id: order._id }, { $set: { createdAt: payload.createdAt } }, { timestamps: false })
  }

  console.log('VELORA catalog seeded')
  console.log('Admin: admin@velora.com / Admin123!')
  console.log('Customer: alex@velora.com / Customer123!')
}

function monthsAgo(count) {
  const date = new Date()
  date.setMonth(date.getMonth() - count)
  date.setDate(12)
  return date
}

const isDirect = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (isDirect) {
  process.env.SEED_FRESH = process.env.SEED_FRESH || 'true'
  connectDB()
    .then(() => seedIfEmpty())
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
