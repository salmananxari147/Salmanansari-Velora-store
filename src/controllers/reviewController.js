import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { Review } from '../models/Review.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

async function refreshRating(productId) {
  const stats = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Product.findByIdAndUpdate(productId, {
    rating: stats[0] ? Math.round(stats[0].avg * 10) / 10 : 0,
    numReviews: stats[0]?.count || 0,
  });
}

export const productReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.id }).sort('-createdAt');
  res.json(reviews);
});

export const createReview = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError('Product not found', 404);
  const rating = Number(req.body.rating);
  const comment = String(req.body.comment || '').trim();
  if (!rating || rating < 1 || rating > 5) throw new ApiError('Choose a rating from 1 to 5', 400);
  if (comment.length < 4) throw new ApiError('Write a short review', 400);

  const existing = await Review.findOne({ product: product._id, user: req.user._id });
  if (existing) throw new ApiError('You already reviewed this pair', 400);

  const review = await Review.create({
    product: product._id,
    user: req.user._id,
    name: req.user.name,
    rating,
    comment,
  });
  await refreshRating(product._id);
  res.status(201).json(review);
});

export const getReviews = asyncHandler(async (_req, res) => {
  const reviews = await Review.find().populate('product', 'name slug').sort('-createdAt');
  res.json(reviews);
});

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError('Review not found', 404);
  const productId = review.product;
  await review.deleteOne();
  await refreshRating(productId);
  res.json({ message: 'Review removed' });
});
