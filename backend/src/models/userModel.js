const { pool } = require('../config/db');

const DB = `\`${process.env.DB_NAME}\``;
const ALLOWED_ROLES = ['admin', 'task_manager', 'employee'];

const UserModel = {
  ALLOWED_ROLES,

  async findByEmail(email) {
    const [rows] = await pool.query(`SELECT * FROM ${DB}.\`users\` WHERE email = ? LIMIT 1`, [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT id, name, email, role, created_at, updated_at FROM ${DB}.\`users\` WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  async create(name, email, hashedPassword) {
    const [result] = await pool.query(
      `INSERT INTO ${DB}.\`users\` (name, email, password, role) VALUES (?, ?, ?, 'employee')`,
      [name, email, hashedPassword]
    );
    return this.findById(result.insertId);
  },

  // Admin: View all registered users
  async findAllUsers() {
    const [rows] = await pool.query(
      `SELECT id, name, email, role, created_at FROM ${DB}.\`users\` ORDER BY name ASC`
    );
    return rows;
  },

  // Admin: Update a user's role
  async updateRole(id, role) {
    if (!ALLOWED_ROLES.includes(role)) {
      throw new Error(`Invalid role. Must be one of: ${ALLOWED_ROLES.join(', ')}`);
    }
    await pool.query(`UPDATE ${DB}.\`users\` SET role = ? WHERE id = ?`, [role, id]);
    return this.findById(id);
  },

  // Admin & Task Manager: Get assignable users (employees and task managers)
  async findEmployees() {
    const [rows] = await pool.query(
      `SELECT id, name, email, role FROM ${DB}.\`users\` WHERE role IN ('employee', 'task_manager') ORDER BY name ASC`
    );
    return rows;
  },
};

module.exports = UserModel;
