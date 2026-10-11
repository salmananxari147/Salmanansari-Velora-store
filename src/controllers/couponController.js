import { Coupon } from '../models/Coupon.js';
import { priceCart } from '../services/cartPricing.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getCoupons = asyncHandler(async (_req, res) => {
  res.json(await Coupon.find().sort('-createdAt'));
});

export const createCoupon = asyncHandler(async (req, res) => {
  const code = String(req.body.code || '').trim().toUpperCase();
  const value = Number(req.body.value);
  if (!code) throw new ApiError('A code is required', 400);
  if (!['percent', 'fixed'].includes(req.body.type)) throw new ApiError('Choose percent or fixed', 400);
  if (Number.isNaN(value) || value <= 0) throw new ApiError('Enter a discount value', 400);
  if (req.body.type === 'percent' && value > 80) throw new ApiError('Percentage discount cannot exceed 80', 400);

  const coupon = await Coupon.create({
    code,
    type: req.body.type,
    value,
    minOrder: Number(req.body.minOrder) || 0,
    expiresAt: req.body.expiresAt || null,
    active: req.body.active !== false,
  });
  res.status(201).json(coupon);
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw new ApiError('Coupon not found', 404);
  if (req.body.code) coupon.code = String(req.body.code).toUpperCase().trim();
  if (req.body.type) coupon.type = req.body.type;
  if (req.body.value != null) coupon.value = Number(req.body.value);
  if (req.body.minOrder != null) coupon.minOrder = Number(req.body.minOrder) || 0;
  if (req.body.expiresAt !== undefined) coupon.expiresAt = req.body.expiresAt || null;
  if (req.body.active != null) coupon.active = Boolean(req.body.active);
  await coupon.save();
  res.json(coupon);
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw new ApiError('Coupon not found', 404);
  res.json({ message: 'Coupon removed' });
});

export const validateCoupon = asyncHandler(async (req, res) => {
  const priced = await priceCart(req.body.items, req.body.code || req.body.couponCode);
  res.json(priced);
});
