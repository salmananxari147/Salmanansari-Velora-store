import { Router } from 'express';
import { login, me, register } from '../controllers/authController.js';
import { createCategory, deleteCategory, getCategories, updateCategory } from '../controllers/categoryController.js';
import { createCoupon, deleteCoupon, getCoupons, updateCoupon, validateCoupon } from '../controllers/couponController.js';
import { subscribe } from '../controllers/newsletterController.js';
import {
  createOrder,
  getOrder,
  getOrders,
  myOrders,
  quoteOrder,
  stats,
  updateStatus,
} from '../controllers/orderController.js';
import {
  createProduct,
  deleteProduct,
  getHome,
  getMeta,
  getProduct,
  getProductById,
  getProducts,
  updateProduct,
  updateStock,
} from '../controllers/productController.js';
import { createReview, deleteReview, getReviews, productReviews } from '../controllers/reviewController.js';
import { uploadImages } from '../controllers/uploadController.js';
import {
  getCart,
  getCustomers,
  getWishlist,
  replaceCart,
  toggleWishlist,
  updatePassword,
  updateProfile,
} from '../controllers/userController.js';
import { admin, protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

const MEDIA_HOSTS = ['https://images.pexels.com/', 'https://res.cloudinary.com/'];

router.get('/health', (_req, res) => res.json({ ok: true }));

router.get('/media', async (req, res) => {
  const url = String(req.query.url || '');
  if (!MEDIA_HOSTS.some((host) => url.startsWith(host))) {
    return res.status(400).json({ message: 'Image host is not allowed' });
  }
  try {
    const response = await fetch(url);
    const type = response.headers.get('content-type') || '';
    if (!response.ok || !type.startsWith('image/')) return res.status(404).end();
    res.set('Content-Type', type);
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(await response.arrayBuffer()));
  } catch {
    return res.status(502).end();
  }
});
router.post('/newsletter', subscribe);

router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', protect, me);

router.get('/products/home', getHome);
router.get('/products/meta', getMeta);
router.get('/products/id/:id', protect, admin, getProductById);
router.get('/products', getProducts);
router.get('/products/:slug', getProduct);
router.post('/products', protect, admin, createProduct);
router.put('/products/:id', protect, admin, updateProduct);
router.patch('/products/:id/stock', protect, admin, updateStock);
router.delete('/products/:id', protect, admin, deleteProduct);
router.get('/products/:id/reviews', productReviews);
router.post('/products/:id/reviews', protect, createReview);

router.get('/categories', getCategories);
router.post('/categories', protect, admin, createCategory);
router.put('/categories/:id', protect, admin, updateCategory);
router.delete('/categories/:id', protect, admin, deleteCategory);

router.post('/orders/quote', quoteOrder);
router.get('/orders/mine', protect, myOrders);
router.get('/orders/stats', protect, admin, stats);
router.get('/orders', protect, admin, getOrders);
router.get('/orders/:id', protect, getOrder);
router.post('/orders', protect, createOrder);
router.patch('/orders/:id/status', protect, admin, updateStatus);

router.get('/users/wishlist', protect, getWishlist);
router.post('/users/wishlist/:productId', protect, toggleWishlist);
router.put('/users/profile', protect, updateProfile);
router.put('/users/password', protect, updatePassword);
router.get('/users', protect, admin, getCustomers);

router.get('/cart', protect, getCart);
router.put('/cart', protect, replaceCart);

router.get('/reviews', protect, admin, getReviews);
router.delete('/reviews/:id', protect, admin, deleteReview);

router.get('/coupons', protect, admin, getCoupons);
router.post('/coupons/validate', validateCoupon);
router.post('/coupons', protect, admin, createCoupon);
router.put('/coupons/:id', protect, admin, updateCoupon);
router.delete('/coupons/:id', protect, admin, deleteCoupon);

router.post('/upload', protect, admin, upload.array('images', 6), uploadImages);

export default router;
