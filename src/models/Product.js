import mongoose from 'mongoose';

const colorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    hex: { type: String, required: true },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    price: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number, default: 0 },
    images: [{ type: String }],
    colors: [colorSchema],
    sizes: [{ type: String }],
    stock: { type: Number, required: true, min: 0, default: 0 },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    newArrival: { type: Boolean, default: false },
    trending: { type: Boolean, default: false },
    showInHero: { type: Boolean, default: false },
    heroOrder: { type: Number, default: 99 },
    accentColor: { type: String, default: '#A56B45' },
    featuredOrder: { type: Number, default: 99 },
    brand: { type: String, default: 'VELORA' },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text' });

export const Product = mongoose.model('Product', productSchema);
