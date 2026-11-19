/**
 * User Model
 */

const { query, inMemoryStore, pool } = require('../config/db');

async function findByEmail(email) {
  if (process.env.USE_MOCK_DB === 'true' || !pool) {
    return inMemoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }
  const res = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
  return res.rows[0] || null;
}

async function findById(id) {
  if (process.env.USE_MOCK_DB === 'true' || !pool) {
    return inMemoryStore.users.find(u => u.id === id) || null;
  }
  const res = await query('SELECT id, full_name, email, role, created_at FROM users WHERE id = $1', [id]);
  return res.rows[0] || null;
}

async function createUser({ fullName, email, passwordHash, role = 'CUSTOMER' }) {
  if (process.env.USE_MOCK_DB === 'true' || !pool) {
    const newUser = {
      id: `u-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      full_name: fullName,
      email,
      password_hash: passwordHash,
      role,
      created_at: new Date().toISOString()
    };
    inMemoryStore.users.push(newUser);
    return newUser;
  }
  const res = await query(
    `INSERT INTO users (full_name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, full_name, email, role, created_at`,
    [fullName, email, passwordHash, role]
  );
  return res.rows[0];
}

async function getAllUsers() {
  if (process.env.USE_MOCK_DB === 'true' || !pool) {
    return inMemoryStore.users.map(({ password_hash, ...rest }) => rest);
  }
  const res = await query('SELECT id, full_name, email, role, created_at FROM users ORDER BY created_at DESC');
  return res.rows;
}

module.exports = {
  findByEmail,
  findById,
  createUser,
  getAllUsers
};
