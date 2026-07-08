const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password_hash: { type: String, required: true },
    full_name: { type: String },
    role: { type: String, enum: ['admin', 'doctor', 'staff'], default: 'doctor' },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

UserSchema.methods.verifyPassword = function (pw) {
  return bcrypt.compare(pw, this.password_hash);
};

UserSchema.statics.hashPassword = function (pw) {
  return bcrypt.hash(pw, Number(process.env.BCRYPT_ROUNDS || 10));
};

module.exports = mongoose.model('User', UserSchema);