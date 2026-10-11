import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { slugify } from '../utils/slugify.js';

export const getCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find().sort('name');
  res.json(categories);
});

export const createCategory = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) throw new ApiError('Category name is required', 400);
  const slug = slugify(req.body.slug || name);
  const exists = await Category.findOne({ slug });
  if (exists) throw new ApiError('A category with this name already exists', 400);
  const category = await Category.create({
    name,
    slug,
    description: req.body.description || '',
    image: req.body.image || '',
  });
  res.status(201).json(category);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError('Category not found', 404);
  if (req.body.name) category.name = req.body.name.trim();
  if (req.body.slug || req.body.name) category.slug = slugify(req.body.slug || category.name);
  if (req.body.description != null) category.description = req.body.description;
  if (req.body.image != null) category.image = req.body.image;
  await category.save();
  res.json(category);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const used = await Product.countDocuments({ category: req.params.id });
  if (used) throw new ApiError('Move or remove products in this category first', 400);
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new ApiError('Category not found', 404);
  res.json({ message: 'Category removed' });
});
