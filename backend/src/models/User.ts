import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  id: { type: String, required: true, unique: true }, // UUID v4
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  passwordHash: { type: String }, // Opcional para Google Auth
  googleId: { type: String },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

export const User = model('User', userSchema);
