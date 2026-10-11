import asyncHandler from 'express-async-handler'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import User from '../models/User.js'

export const getOverview = asyncHandler(async (req, res) => {
  const [orders, products, customers] = await Promise.all([
    Order.find(),
    Product.countDocuments(),
    User.countDocuments({ role: 'customer' }),
  ])

  const paid = orders.filter((order) => order.status !== 'Cancelled')
  const totalRevenue = paid.reduce((sum, order) => sum + order.totalPrice, 0)

  const months = []
  const now = new Date()
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = date.toLocaleString('en', { month: 'short' })
    const total = paid
      .filter((order) => {
        const created = new Date(order.createdAt)
        return created.getMonth() === date.getMonth() && created.getFullYear() === date.getFullYear()
      })
      .reduce((sum, order) => sum + order.totalPrice, 0)
    const count = orders.filter((order) => {
      const created = new Date(order.createdAt)
      return created.getMonth() === date.getMonth() && created.getFullYear() === date.getFullYear()
    }).length
    months.push({ month: label, total, count })
  }

  const statuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
  const ordersByStatus = statuses.map((status) => ({
    status,
    count: orders.filter((order) => order.status === status).length,
  }))

  res.json({
    totalOrders: orders.length,
    totalRevenue,
    totalProducts: products,
    totalCustomers: customers,
    salesByMonth: months,
    ordersByStatus,
  })
})
