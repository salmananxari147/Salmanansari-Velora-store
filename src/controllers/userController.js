import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

async function enrichCart(cart) {
  const products = await Product.find({ _id: { $in: cart.map((item) => item.product) } });
  const map = new Map(products.map((product) => [String(product._id), product]));
  return cart
    .map((item) => {
      const product = map.get(String(item.product));
      if (!product) return null;
      return {
        _id: item._id,
        product: product._id,
        size: item.size,
        color: item.color,
        qty: item.qty,
        name: product.name,
        slug: product.slug,
        image: product.images[0] || '',
        price: product.price,
        stock: product.stock,
      };
    })
    .filter(Boolean);
}

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (req.body.name) user.name = String(req.body.name).trim();
  if (req.body.phone != null) user.phone = String(req.body.phone).trim();
  if (Array.isArray(req.body.addresses)) user.addresses = req.body.addresses;
  await user.save();
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    addresses: user.addresses,
  });
});

export const updatePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  const next = String(req.body.password || '');
  if (!(await user.comparePassword(req.body.currentPassword || ''))) {
    throw new ApiError('Current password is incorrect', 400);
  }
  if (next.length < 6) throw new ApiError('Password must be at least 6 characters', 400);
  user.password = next;
  await user.save();
  res.json({ message: 'Password updated' });
});

export const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'wishlist',
    populate: { path: 'category', select: 'name slug' },
  });
  res.json(user.wishlist);
});

export const toggleWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const id = String(req.params.productId);
  const exists = user.wishlist.some((item) => String(item) === id);
  user.wishlist = exists ? user.wishlist.filter((item) => String(item) !== id) : [...user.wishlist, req.params.productId];
  await user.save();
  res.json({ wishlist: user.wishlist, added: !exists });
});

export const getCart = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ items: await enrichCart(user.cart) });
});

export const replaceCart = asyncHandler(async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  const cart = items
    .filter((item) => item.product && item.size && item.color && Number(item.qty) > 0)
    .map((item) => ({
      product: item.product,
      size: String(item.size),
      color: item.color,
      qty: Number(item.qty),
    }));
  const user = await User.findByIdAndUpdate(req.user._id, { cart }, { new: true });
  res.json({ items: await enrichCart(user.cart) });
});

export const getCustomers = asyncHandler(async (_req, res) => {
  const customers = await User.find().select('name email role phone createdAt').sort('-createdAt');
  res.json(customers);
});
