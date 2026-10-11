import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken } from '../utils/token.js';

function publicUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    addresses: user.addresses,
  };
}

export const register = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!name || !email || !password) throw new ApiError('Name, email, and password are required', 400);
  if (password.length < 6) throw new ApiError('Password must be at least 6 characters', 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError('Enter a valid email', 400);

  const exists = await User.findOne({ email });
  if (exists) throw new ApiError('An account with this email already exists', 400);

  const user = await User.create({ name, email, password });
  res.status(201).json({ user: publicUser(user), token: signToken(user._id) });
});

export const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!email || !password) throw new ApiError('Email and password are required', 400);

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError('Incorrect email or password', 401);
  }

  res.json({ user: publicUser(user), token: signToken(user._id) });
});

export const me = asyncHandler(async (req, res) => {
  res.json(publicUser(req.user));
});
