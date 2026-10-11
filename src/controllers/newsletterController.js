import { Subscriber } from '../models/Subscriber.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const subscribe = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError('Enter a valid email', 400);
  await Subscriber.updateOne({ email }, { email }, { upsert: true });
  res.json({ message: 'You are on the list.' });
});
