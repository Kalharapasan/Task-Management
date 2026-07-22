const { pool } = require('../config/db');

const UserModel = {
  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  async create(name, email, hashedPassword) {
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'employee')",
      [name, email, hashedPassword]
    );
    return this.findById(result.insertId);
  },

  async findEmployees() {
    const [rows] = await pool.query(
      "SELECT id, name, email FROM users WHERE role = 'employee' ORDER BY name ASC"
    );
    return rows;
  },
};

module.exports = UserModel;
