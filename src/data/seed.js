import 'dotenv/config';
import { connectDB, disconnectDB } from '../config/db.js';
import { categories, products, reviews } from './catalog.js';
import { Category } from '../models/Category.js';
import { Coupon } from '../models/Coupon.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Review } from '../models/Review.js';
import { User } from '../models/User.js';
import { slugify } from '../utils/slugify.js';

export async function seedIfEmpty() {
  const existing = await Product.countDocuments();
  if (existing > 0) {
    await ensureAdmin();
    await syncDemoNames();
    await Product.updateMany({ featured: true, showInHero: { $exists: false } }, [
      { $set: { showInHero: true, heroOrder: { $ifNull: ['$featuredOrder', 99] } } },
    ]);
    return;
  }
  await seedAll();
}

async function ensureAdmin() {
  const email = 'admin@velora.com';
  const admin = await User.findOne({ email });
  if (!admin) {
    await User.create({ name: 'Velora Studio', email, password: 'velora123', role: 'admin' });
    console.log('Created admin account admin@velora.com');
  }
}

const demoNames = [
  ['james@velora.com', 'Hamza Khan'],
  ['noah@velora.com', 'Muhammad Saad'],
  ['amir@velora.com', 'Abdullah Shah'],
  ['areeba@velora.com', 'Areeba Ahmed'],
  ['hira@velora.com', 'Hira Malik'],
  ['zara@velora.com', 'Zara Ahmed'],
];

async function syncDemoNames() {
  for (const [email, name] of demoNames) {
    const user = await User.findOne({ email });
    if (!user || user.name === name) continue;
    user.name = name;
    await user.save();
    await Review.updateMany({ user: user._id }, { name });
  }
}

export async function seedAll() {
  await Promise.all([
    Category.deleteMany({}),
    Product.deleteMany({}),
    User.deleteMany({}),
    Review.deleteMany({}),
    Order.deleteMany({}),
    Coupon.deleteMany({}),
  ]);

  const categoryDocs = await Category.insertMany(categories);
  const categoryMap = new Map(categoryDocs.map((category) => [category.slug, category._id]));

  const productDocs = await Product.insertMany(
    products.map((product) => ({
      ...product,
      slug: slugify(product.name),
      category: categoryMap.get(product.category),
      brand: 'VELORA',
      showInHero: Boolean(product.featured),
      heroOrder: product.featuredOrder ?? 99,
    }))
  );
  const productMap = new Map(productDocs.map((product) => [product.name, product]));

  const users = await User.create([
    { name: 'Velora Studio', email: 'admin@velora.com', password: 'velora123', role: 'admin' },
    {
      name: 'Hamza Khan',
      email: 'james@velora.com',
      password: 'velora123',
      phone: '0300 1234567',
      addresses: [
        {
          label: 'Home',
          firstName: 'Hamza',
          lastName: 'Khan',
          phone: '0300 1234567',
          address: 'House 14, Block 5, Clifton',
          city: 'Karachi',
          postalCode: '75600',
        },
      ],
    },
    { name: 'Muhammad Saad', email: 'noah@velora.com', password: 'velora123' },
    { name: 'Abdullah Shah', email: 'amir@velora.com', password: 'velora123' },
    { name: 'Areeba Ahmed', email: 'areeba@velora.com', password: 'velora123' },
    { name: 'Hira Malik', email: 'hira@velora.com', password: 'velora123' },
    { name: 'Zara Ahmed', email: 'zara@velora.com', password: 'velora123' },
  ]);
  const userMap = new Map(users.map((user) => [user.email, user]));

  for (const review of reviews) {
    const product = productMap.get(review.product);
    const user = userMap.get(review.author);
    if (!product || !user) continue;
    await Review.create({
      product: product._id,
      user: user._id,
      name: user.name,
      rating: review.rating,
      comment: review.comment,
    });
  }

  const allReviews = await Review.find();
  const grouped = new Map();
  allReviews.forEach((review) => {
    const key = String(review.product);
    grouped.set(key, [...(grouped.get(key) || []), review.rating]);
  });
  for (const [id, ratings] of grouped) {
    const avg = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    await Product.findByIdAndUpdate(id, {
      rating: Math.round(avg * 10) / 10,
      numReviews: ratings.length,
    });
  }

  await Coupon.create({
    code: 'WELCOME10',
    type: 'percent',
    value: 10,
    minOrder: 100,
    active: true,
    expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
  });

  const james = userMap.get('james@velora.com');
  const samples = [
    { product: 'Northline Court', size: '9', color: 'Glacier', qty: 1, status: 'Delivered', ago: 5 },
    { product: 'Apex Runner', size: '10', color: 'Cloud', qty: 1, status: 'Delivered', ago: 4 },
    { product: 'Civic Oxford', size: '9', color: 'Black', qty: 1, status: 'Shipped', ago: 3 },
    { product: 'Solace Penny', size: '8', color: 'Cognac', qty: 1, status: 'Processing', ago: 2 },
    { product: 'Drift Slide', size: '10', color: 'Black', qty: 2, status: 'Confirmed', ago: 1 },
    { product: 'Terrace Slip', size: '11', color: 'Coast Blue', qty: 1, status: 'Pending', ago: 0 },
    { product: 'Ridge Boot', size: '9', color: 'Rust', qty: 1, status: 'Cancelled', ago: 2 },
  ];

  for (const [index, sample] of samples.entries()) {
    const product = productMap.get(sample.product);
    const itemsPrice = product.price * sample.qty;
    const shippingPrice = itemsPrice >= 200 ? 0 : 18;
    const createdAt = monthsAgo(sample.ago);
    await Order.collection.insertOne({
      orderNumber: `VLR-${184200 + index}`,
      user: james._id,
      items: [
        {
          product: product._id,
          name: product.name,
          image: product.images[0],
          price: product.price,
          size: sample.size,
          color: sample.color,
          qty: sample.qty,
        },
      ],
      shippingAddress: {
        firstName: 'Hamza',
        lastName: 'Khan',
        email: james.email,
        phone: '0300 1234567',
        address: 'House 14, Block 5, Clifton',
        city: 'Karachi',
        postalCode: '75600',
      },
      paymentMethod: 'cod',
      paymentResult: { provider: 'cod', status: 'pending' },
      itemsPrice,
      shippingPrice,
      discount: 0,
      couponCode: '',
      totalPrice: itemsPrice + shippingPrice,
      status: sample.status,
      createdAt,
      updatedAt: createdAt,
    });
  }

  console.log('Seeded VELORA catalog');
}

function monthsAgo(count) {
  const date = new Date();
  date.setMonth(date.getMonth() - count);
  date.setDate(8);
  date.setHours(10, 0, 0, 0);
  return date;
}

const direct = process.argv[1]?.replace(/\\/g, '/').endsWith('/src/data/seed.js');
if (direct) {
  await connectDB();
  await seedAll();
  await disconnectDB();
}
