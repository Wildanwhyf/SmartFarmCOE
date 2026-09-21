const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthService {
  // Login user and return JWT token
  async login(email, password) {
    const [users] = await db.execute(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.email = ?`,
      [email]
    );

    if (users.length === 0) {
      throw { statusCode: 401, message: 'Invalid email or password' };
    }

    const user = users[0];

    if (!user.is_active) {
      throw { statusCode: 403, message: 'Account is deactivated. Contact admin.' };
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw { statusCode: 401, message: 'Invalid email or password' };
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role_name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' }
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role_name
      }
    };
  }

  // Admin creates Farmer account (role_id = 2)
  async createFarmer({ username, email, password }) {
    const [existing] = await db.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existing.length > 0) {
      throw { statusCode: 409, message: 'Username or Email already exists' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      `INSERT INTO users (role_id, username, email, password_hash, is_active) 
       VALUES (2, ?, ?, ?, 1)`,
      [username, email, hashedPassword]
    );

    return { id: result.insertId, username, email, role: 'farmer' };
  }

  // Admin deactivates/activates account (Cannot delete per requirement)
  async toggleUserStatus(userId, isActive) {
    const [result] = await db.execute(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [isActive ? 1 : 0, userId]
    );

    if (result.affectedRows === 0) {
      throw { statusCode: 404, message: 'User not found' };
    }

    return { message: `User status updated to ${isActive ? 'active' : 'deactivated'}` };
  }

  // Get list of all users
  async listUsers() {
    const [users] = await db.execute(
      `SELECT u.id, u.username, u.email, u.is_active, r.name as role, u.created_at 
       FROM users u 
       JOIN roles r ON u.role_id = r.id`
    );
    return users;
  }

// Get current user profile by ID
  async getProfile(userId) {
    const [users] = await db.execute(
      `SELECT u.id, u.username, u.email, u.is_active, r.name as role, u.created_at 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      throw { statusCode: 404, message: 'User not found' };
    }

    return users[0];
  }

}



module.exports = new AuthService();