import { Coupon } from '../models/Coupon.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { couponDiscount, totals } from '../utils/pricing.js';

export async function resolveItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new ApiError('Your cart is empty', 400);
  }

  const items = [];
  for (const raw of rawItems) {
    const qty = Number(raw.qty);
    if (!raw.product || !raw.size || !raw.color || !qty || qty < 1) {
      throw new ApiError('Each item needs a product, size, color, and quantity', 400);
    }

    const product = await Product.findById(raw.product);
    if (!product) throw new ApiError('A product in your cart is no longer available', 400);
    if (!product.sizes.includes(String(raw.size))) {
      throw new ApiError(`${product.name} is not available in size ${raw.size}`, 400);
    }
    if (!product.colors.some((color) => color.name.toLowerCase() === String(raw.color).toLowerCase())) {
      throw new ApiError(`${product.name} is not available in ${raw.color}`, 400);
    }
    if (product.stock < qty) {
      throw new ApiError(
        product.stock === 0 ? `${product.name} is out of stock` : `Only ${product.stock} left for ${product.name}`,
        400
      );
    }

    const color = product.colors.find((item) => item.name.toLowerCase() === String(raw.color).toLowerCase());
    items.push({
      product: product._id,
      name: product.name,
      image: product.images[0] || '',
      price: product.price,
      size: String(raw.size),
      color: color.name,
      qty,
    });
  }

  return items;
}

export async function priceCart(rawItems, couponCode) {
  const items = await resolveItems(rawItems);
  const itemsPrice = round(items.reduce((sum, item) => sum + item.price * item.qty, 0));
  let discount = 0;
  let code = '';

  if (couponCode) {
    const coupon = await Coupon.findOne({ code: String(couponCode).toUpperCase().trim() });
    if (!coupon || !coupon.active) throw new ApiError('This code is not valid', 400);
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new ApiError('This code has expired', 400);
    discount = couponDiscount(coupon, itemsPrice);
    code = coupon.code;
  }

  return { items, itemsPrice, couponCode: code, ...totals(itemsPrice, discount) };
}

export async function decrementStock(items) {
  const done = [];
  try {
    for (const item of items) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.qty } },
        { $inc: { stock: -item.qty, sold: item.qty } }
      );
      if (!updated) throw new ApiError(`${item.name} just sold out`, 400);
      done.push(item);
    }
  } catch (error) {
    await restoreStock(done);
    throw error;
  }
}

export async function restoreStock(items) {
  for (const item of items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.qty, sold: -item.qty } });
  }
}

function round(value) {
  return Math.round(value * 100) / 100;
}
