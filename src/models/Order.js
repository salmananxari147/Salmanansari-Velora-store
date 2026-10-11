import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    image: String,
    price: Number,
    size: String,
    color: String,
    qty: Number,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    shippingAddress: {
      firstName: String,
      lastName: String,
      email: String,
      phone: String,
      address: String,
      city: String,
      postalCode: String,
    },
    paymentMethod: { type: String, default: 'cod' },
    paymentResult: { type: mongoose.Schema.Types.Mixed, default: null },
    itemsPrice: { type: Number, required: true },
    shippingPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponCode: { type: String, default: '' },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model('Order', orderSchema);
