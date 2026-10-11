import mongoose from 'mongoose';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { Review } from '../models/Review.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex, slugify } from '../utils/slugify.js';

const sorts = {
  newest: { createdAt: -1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  popular: { sold: -1, rating: -1 },
  rating: { rating: -1 },
  featured: { featuredOrder: 1, createdAt: -1 },
};

async function uniqueSlug(name, requested, ignoreId) {
  let slug = slugify(requested || name);
  if (!slug) throw new ApiError('A product name is required', 400);
  const existing = await Product.findOne({ slug, ...(ignoreId ? { _id: { $ne: ignoreId } } : {}) });
  if (existing) slug = `${slug}-${Date.now().toString().slice(-4)}`;
  return slug;
}

function cleanProduct(body, slug) {
  const price = Number(body.price);
  const stock = Number(body.stock);
  if (!body.name?.trim()) throw new ApiError('Name is required', 400);
  if (!body.description?.trim()) throw new ApiError('Description is required', 400);
  if (!body.category) throw new ApiError('Category is required', 400);
  if (Number.isNaN(price) || price < 0) throw new ApiError('Enter a valid price', 400);
  if (Number.isNaN(stock) || stock < 0) throw new ApiError('Enter a valid stock count', 400);

  const images = (Array.isArray(body.images) ? body.images : String(body.images || '').split('\n'))
    .map((item) => String(item).trim())
    .filter(Boolean);
  const sizes = (Array.isArray(body.sizes) ? body.sizes : []).map(String).filter(Boolean);
  const colors = (Array.isArray(body.colors) ? body.colors : [])
    .filter((color) => color?.name && color?.hex)
    .map((color) => ({ name: String(color.name).trim(), hex: String(color.hex).trim() }));

  if (!images.length) throw new ApiError('Add at least one image', 400);
  if (!sizes.length) throw new ApiError('Select at least one size', 400);
  if (!colors.length) throw new ApiError('Add at least one color', 400);

  return {
    name: body.name.trim(),
    slug,
    description: body.description.trim(),
    category: body.category,
    price,
    comparePrice: Number(body.comparePrice) || 0,
    images,
    colors,
    sizes,
    stock,
    featured: Boolean(body.featured),
    newArrival: Boolean(body.newArrival),
    trending: Boolean(body.trending),
    showInHero: Boolean(body.showInHero),
    heroOrder: Number(body.heroOrder) || 99,
    accentColor: body.accentColor || colors[0].hex,
    featuredOrder: Number(body.featuredOrder) || 99,
    rating: body.rating != null ? Number(body.rating) : undefined,
  };
}

export const getHome = asyncHandler(async (_req, res) => {
  const [hero, newArrivals, trending, categories] = await Promise.all([
    Product.find({ showInHero: true }).populate('category', 'name slug').sort({ heroOrder: 1, createdAt: -1 }).limit(8),
    Product.find({ newArrival: true }).populate('category', 'name slug').sort('-createdAt').limit(8),
    Product.find({ trending: true }).populate('category', 'name slug').sort('-sold').limit(8),
    Category.find().sort('name'),
  ]);
  res.json({ hero, newArrivals, trending, categories });
});

export const getMeta = asyncHandler(async (_req, res) => {
  const products = await Product.find({}, 'colors sizes price');
  const colorMap = new Map();
  const sizes = new Set();
  let minPrice = Infinity;
  let maxPrice = 0;
  products.forEach((product) => {
    product.colors.forEach((color) => colorMap.set(color.name, color.hex));
    product.sizes.forEach((size) => sizes.add(size));
    minPrice = Math.min(minPrice, product.price);
    maxPrice = Math.max(maxPrice, product.price);
  });
  res.json({
    colors: [...colorMap.entries()].map(([name, hex]) => ({ name, hex })),
    sizes: [...sizes].sort((a, b) => Number(a) - Number(b)),
    minPrice: Number.isFinite(minPrice) ? minPrice : 0,
    maxPrice,
  });
});

export const getProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 12));
  const query = {};

  if (req.query.category) {
    const clauses = [{ slug: req.query.category }];
    if (mongoose.isValidObjectId(req.query.category)) clauses.push({ _id: req.query.category });
    const category = await Category.findOne({ $or: clauses });
    query.category = category ? category._id : new mongoose.Types.ObjectId();
  }

  if (req.query.search) query.name = { $regex: escapeRegex(req.query.search), $options: 'i' };
  if (req.query.minPrice || req.query.maxPrice) {
    query.price = {};
    if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
  }
  if (req.query.size) query.sizes = String(req.query.size);
  if (req.query.color) query['colors.name'] = new RegExp(`^${escapeRegex(req.query.color)}$`, 'i');
  if (req.query.rating) query.rating = { $gte: Number(req.query.rating) };
  if (req.query.featured === 'true') query.featured = true;
  if (req.query.newArrival === 'true') query.newArrival = true;
  if (req.query.trending === 'true') query.trending = true;

  const sort = sorts[req.query.sort] || sorts.newest;
  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('category', 'name slug')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(query),
  ]);

  res.json({ products, page, pages: Math.max(1, Math.ceil(total / limit)), total });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug }).populate('category', 'name slug');
  if (!product) throw new ApiError('Product not found', 404);
  const reviews = await Review.find({ product: product._id }).sort('-createdAt').limit(12);
  res.json({ product, reviews });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name slug');
  if (!product) throw new ApiError('Product not found', 404);
  res.json(product);
});

export const createProduct = asyncHandler(async (req, res) => {
  const slug = await uniqueSlug(req.body.name, req.body.slug);
  const payload = cleanProduct(req.body, slug);
  if (payload.rating == null) delete payload.rating;
  const product = await Product.create(payload);
  res.status(201).json(await product.populate('category', 'name slug'));
});

export const updateProduct = asyncHandler(async (req, res) => {
  const existing = await Product.findById(req.params.id);
  if (!existing) throw new ApiError('Product not found', 404);
  const slug = await uniqueSlug(req.body.name || existing.name, req.body.slug || existing.slug, existing._id);
  const payload = cleanProduct({ ...existing.toObject(), ...req.body }, slug);
  if (payload.rating == null) delete payload.rating;
  const product = await Product.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true }).populate(
    'category',
    'name slug'
  );
  res.json(product);
});

export const updateStock = asyncHandler(async (req, res) => {
  const stock = Number(req.body.stock);
  if (Number.isNaN(stock) || stock < 0) throw new ApiError('Enter a valid stock count', 400);
  const product = await Product.findByIdAndUpdate(req.params.id, { stock }, { new: true });
  if (!product) throw new ApiError('Product not found', 404);
  res.json(product);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError('Product not found', 404);
  await Review.deleteMany({ product: product._id });
  await product.deleteOne();
  res.json({ message: 'Product removed' });
});
