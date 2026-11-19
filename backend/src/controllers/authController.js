/**
 * Authentication Controller
 */

const { findByEmail, createUser, findById } = require('../models/userModel');
const { hashPassword, comparePassword, generateToken } = require('../utils/security');

async function register(req, res) {
  try {
    const { fullName, email, password } = req.body || {};
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed: fullName, email, and password are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    const existingUser = await findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists'
      });
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({
      fullName,
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'CUSTOMER'
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      data: {
        token,
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed: email and password are required'
      });
    }

    const user = await findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials: user not found'
      });
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials: incorrect password'
      });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name
    });

    res.json({
      success: true,
      message: 'Authentication successful',
      data: {
        token,
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function getMe(req, res) {
  try {
    const user = await findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  register,
  login,
  getMe
};
