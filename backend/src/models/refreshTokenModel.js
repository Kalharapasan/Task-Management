const { pool } = require('../config/db');

const RefreshTokenModel = {
  async create(userId, jti, expiresAt) {
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, jti, expires_at) VALUES (?, ?, ?)',
      [userId, jti, expiresAt]
    );
  },

  async findValid(userId, jti) {
    const [rows] = await pool.query(
      'SELECT id FROM refresh_tokens WHERE user_id = ? AND jti = ? AND expires_at > NOW() LIMIT 1',
      [userId, jti]
    );
    return rows[0] || null;
  },

  async revoke(jti) {
    await pool.query('DELETE FROM refresh_tokens WHERE jti = ?', [jti]);
  },

  async revokeAllForUser(userId) {
    await pool.query('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
  },
};

module.exports = RefreshTokenModel;
