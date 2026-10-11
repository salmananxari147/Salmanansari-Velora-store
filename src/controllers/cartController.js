import asyncHandler from 'express-async-handler'
import User from '../models/User.js'
import Product from '../models/Product.js'

async function shapeCart(user) {
  await user.populate('cart.product')
  const items = []
  for (const item of user.cart) {
    if (!item.product) continue
    items.push({
      productId: item.product._id,
      name: item.product.name,
      slug: item.product.slug,
      image: item.product.images?.[0] || '',
      price: item.product.price,
      size: item.size,
      color: item.color,
      qty: item.qty,
      stock: item.product.stock,
      accentColor: item.product.accentColor,
    })
  }
  return items
}

export const getCart = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  res.json({ items: await shapeCart(user) })
})

export const addCartItem = asyncHandler(async (req, res) => {
  const { productId, size, color, qty = 1 } = req.body
  if (!productId || !size || !color) {
    res.status(400)
    throw new Error('Product, size, and color are required')
  }

  const product = await Product.findById(productId)
  if (!product) {
    res.status(404)
    throw new Error('Product not found')
  }
  if (!product.sizes.includes(String(size))) {
    res.status(400)
    throw new Error('Select a valid size')
  }
  if (product.stock < 1) {
    res.status(400)
    throw new Error('This product is out of stock')
  }

  const user = await User.findById(req.user._id)
  const existing = user.cart.find(
    (item) =>
      String(item.product) === String(productId) && item.size === String(size) && item.color === color
  )
  const nextQty = (existing?.qty || 0) + Number(qty)
  if (nextQty > product.stock) {
    res.status(400)
    throw new Error('Not enough stock for that quantity')
  }

  if (existing) existing.qty = nextQty
  else user.cart.push({ product: productId, size: String(size), color, qty: Number(qty) })

  await user.save()
  res.status(201).json({ items: await shapeCart(user) })
})

export const updateCartItem = asyncHandler(async (req, res) => {
  const { productId, size, color, qty } = req.body
  const user = await User.findById(req.user._id)
  const item = user.cart.find(
    (entry) =>
      String(entry.product) === String(productId) && entry.size === String(size) && entry.color === color
  )
  if (!item) {
    res.status(404)
    throw new Error('Cart item not found')
  }

  const product = await Product.findById(productId)
  const nextQty = Number(qty)
  if (nextQty < 1) {
    user.cart = user.cart.filter((entry) => entry !== item)
  } else {
    if (product && nextQty > product.stock) {
      res.status(400)
      throw new Error('Not enough stock for that quantity')
    }
    item.qty = nextQty
  }

  await user.save()
  res.json({ items: await shapeCart(user) })
})

export const removeCartItem = asyncHandler(async (req, res) => {
  const { productId, size, color } = req.body
  const user = await User.findById(req.user._id)
  user.cart = user.cart.filter(
    (item) =>
      !(String(item.product) === String(productId) && item.size === String(size) && item.color === color)
  )
  await user.save()
  res.json({ items: await shapeCart(user) })
})

export const clearCart = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  user.cart = []
  await user.save()
  res.json({ items: [] })
})

export const replaceCart = asyncHandler(async (req, res) => {
  const incoming = Array.isArray(req.body.items) ? req.body.items : []
  const user = await User.findById(req.user._id)
  const next = []

  for (const entry of incoming) {
    if (!entry.productId || !entry.size || !entry.color) continue
    const product = await Product.findById(entry.productId)
    if (!product || product.stock < 1) continue
    const qty = Math.min(product.stock, Math.max(1, Number(entry.qty) || 1))
    next.push({ product: product._id, size: String(entry.size), color: entry.color, qty })
  }

  user.cart = next
  await user.save()
  res.json({ items: await shapeCart(user) })
})

export const syncCart = asyncHandler(async (req, res) => {
  const incoming = Array.isArray(req.body.items) ? req.body.items : []
  const user = await User.findById(req.user._id)

  for (const entry of incoming) {
    if (!entry.productId || !entry.size || !entry.color) continue
    const product = await Product.findById(entry.productId)
    if (!product || product.stock < 1) continue
    const existing = user.cart.find(
      (item) =>
        String(item.product) === String(entry.productId) &&
        item.size === String(entry.size) &&
        item.color === entry.color
    )
    const qty = Math.min(product.stock, Math.max(1, Number(entry.qty) || 1))
    if (existing) existing.qty = Math.min(product.stock, existing.qty + qty)
    else user.cart.push({ product: entry.productId, size: String(entry.size), color: entry.color, qty })
  }

  await user.save()
  res.json({ items: await shapeCart(user) })
})
