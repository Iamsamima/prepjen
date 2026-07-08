const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

exports.signup = asyncHandler(async (req, res) => {
  const { email, password, full_name } = req.body;
  if (!email || !password) throw new ApiError(400, 'email and password required');
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError(409, 'Email already registered');
  const password_hash = await User.hashPassword(password);
  const user = await User.create({ email, password_hash, full_name });
  await DoctorProfile.create({ user_id: user._id, doctor_name: full_name, email });
  res.status(201).json({
    token: signToken(user),
    user: { id: user._id, email: user.email, full_name: user.full_name, role: user.role },
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() });
  if (!user || !(await user.verifyPassword(password))) {
    throw new ApiError(401, 'Invalid credentials');
  }
  res.json({
    token: signToken(user),
    user: { id: user._id, email: user.email, full_name: user.full_name, role: user.role },
  });
});

exports.me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password_hash');
  res.json(user);
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;
  const user = await User.findById(req.user.id);
  if (!user || !(await user.verifyPassword(current_password))) {
    throw new ApiError(401, 'Current password incorrect');
  }
  user.password_hash = await User.hashPassword(new_password);
  await user.save();
  res.json({ ok: true });
});