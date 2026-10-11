import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { decrementStock, priceCart, restoreStock } from '../services/cartPricing.js';
import { processPayment } from '../services/payments.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function orderNumber() {
  return `VLR-${Math.floor(100000 + Math.random() * 900000)}`;
}

export const quoteOrder = asyncHandler(async (req, res) => {
  const priced = await priceCart(req.body.items, req.body.couponCode);
  res.json(priced);
});

export const createOrder = asyncHandler(async (req, res) => {
  const address = req.body.shippingAddress || {};
  const required = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'postalCode'];
  const missing = required.filter((field) => !String(address[field] || '').trim());
  if (missing.length) throw new ApiError('Complete every delivery field', 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) throw new ApiError('Enter a valid email', 400);

  const priced = await priceCart(req.body.items, req.body.couponCode);
  const paymentResult = await processPayment(req.body.paymentMethod || 'cod');
  await decrementStock(priced.items);

  let order;
  try {
    order = await Order.create({
      orderNumber: orderNumber(),
      user: req.user._id,
      items: priced.items,
      shippingAddress: {
        firstName: address.firstName.trim(),
        lastName: address.lastName.trim(),
        email: address.email.trim(),
        phone: address.phone.trim(),
        address: address.address.trim(),
        city: address.city.trim(),
        postalCode: address.postalCode.trim(),
      },
      paymentMethod: req.body.paymentMethod || 'cod',
      paymentResult,
      itemsPrice: priced.itemsPrice,
      shippingPrice: priced.shippingPrice,
      discount: priced.discount,
      couponCode: priced.couponCode,
      totalPrice: priced.totalPrice,
      status: 'Pending',
    });
  } catch (error) {
    await restoreStock(priced.items);
    throw error;
  }

  await User.findByIdAndUpdate(req.user._id, { cart: [] });
  res.status(201).json(order);
});

export const myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
  res.json(orders);
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError('Order not found', 404);
  const owns = String(order.user) === String(req.user._id);
  if (!owns && req.user.role !== 'admin') throw new ApiError('Order not found', 404);
  res.json(order);
});

export const getOrders = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.status) query.status = req.query.status;
  if (req.query.search) {
    query.$or = [
      { orderNumber: new RegExp(req.query.search, 'i') },
      { 'shippingAddress.email': new RegExp(req.query.search, 'i') },
      { 'shippingAddress.lastName': new RegExp(req.query.search, 'i') },
    ];
  }
  const orders = await Order.find(query).populate('user', 'name email').sort('-createdAt');
  res.json(orders);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const allowed = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  if (!allowed.includes(req.body.status)) throw new ApiError('Choose a valid status', 400);
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError('Order not found', 404);
  if (order.status !== 'Cancelled' && req.body.status === 'Cancelled') {
    await restoreStock(order.items);
  }
  if (order.status === 'Cancelled' && req.body.status !== 'Cancelled') {
    await decrementStock(order.items);
  }
  order.status = req.body.status;
  await order.save();
  res.json(order);
});

export const stats = asyncHandler(async (_req, res) => {
  const [orders, products, customers, recentProducts] = await Promise.all([
    Order.find().sort('-createdAt'),
    Product.countDocuments(),
    User.countDocuments({ role: 'customer' }),
    Product.find().sort('-createdAt').limit(5).select('name price images stock createdAt'),
  ]);

  const active = orders.filter((order) => order.status !== 'Cancelled');
  const revenue = active.reduce((sum, order) => sum + order.totalPrice, 0);
  const months = [];
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    date.setMonth(date.getMonth() - i);
    months.push({
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleString('en-US', { month: 'short' }),
      total: 0,
      count: 0,
    });
  }

  active.forEach((order) => {
    const date = new Date(order.createdAt);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const bucket = months.find((month) => month.key === key);
    if (!bucket) return;
    bucket.total += order.totalPrice;
    bucket.count += 1;
  });

  const statuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((status) => ({
    status,
    count: orders.filter((order) => order.status === status).length,
  }));

  const countStatus = (status) => orders.filter((order) => order.status === status).length;

  res.json({
    totalOrders: orders.length,
    revenue: Math.round(revenue),
    totalProducts: products,
    totalCustomers: customers,
    pendingOrders: countStatus('Pending'),
    confirmedOrders: countStatus('Confirmed'),
    sales: months.map(({ label, total, count }) => ({ label, total: Math.round(total), count })),
    statuses,
    recentOrders: orders.slice(0, 6).map((order) => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalPrice: order.totalPrice,
      createdAt: order.createdAt,
      customer: `${order.shippingAddress?.firstName || ''} ${order.shippingAddress?.lastName || ''}`.trim(),
    })),
    recentProducts: recentProducts.map((product) => ({
      _id: product._id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      image: product.images?.[0] || '',
    })),
  });
});
