const { pool } = require('../config/db');

const ALLOWED_STATUS = ['Pending', 'In Progress', 'Completed'];
const ALLOWED_PRIORITY = ['Low', 'Medium', 'High'];

const ALLOWED_SORTS = {
  newest: 'created_at DESC',
  oldest: 'created_at ASC',
  due_date: 'due_date ASC',
};

const TaskModel = {
  ALLOWED_STATUS,
  ALLOWED_PRIORITY,

 
  async findAll(userId, { search, status, priority, sort, page = 1, limit = 10 } = {}) {
    const clauses = ['user_id = ?'];
    const params = [userId];

    if (search) {
      clauses.push('title LIKE ?');
      params.push(`%${search}%`);
    }

    if (status && ALLOWED_STATUS.includes(status)) {
      clauses.push('status = ?');
      params.push(status);
    }

    if (priority && ALLOWED_PRIORITY.includes(priority)) {
      clauses.push('priority = ?');
      params.push(priority);
    }

    const whereSql = clauses.join(' AND ');
    const orderBy = ALLOWED_SORTS[sort] || ALLOWED_SORTS.newest;

    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (safePage - 1) * safeLimit;

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM tasks WHERE ${whereSql}`,
      params
    );
    const total = Number(countRows[0].total) || 0;

    const sql = `
      SELECT id, user_id, title, description, priority, status, due_date, created_at, updated_at
      FROM tasks
      WHERE ${whereSql}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(sql, [...params, safeLimit, offset]);

    return {
      tasks: rows,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      },
    };
  },

  async findById(id, userId) {
    const [rows] = await pool.query(
      `SELECT id, user_id, title, description, priority, status, due_date, created_at, updated_at
       FROM tasks WHERE id = ? AND user_id = ? LIMIT 1`,
      [id, userId]
    );
    return rows[0] || null;
  },

  async create(userId, { title, description, priority, status, due_date }) {
    const [result] = await pool.query(
      `INSERT INTO tasks (user_id, title, description, priority, status, due_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, title, description || null, priority, status, due_date]
    );
    return this.findById(result.insertId, userId);
  },

  async update(id, userId, fields) {
    const allowedFields = ['title', 'description', 'priority', 'status', 'due_date'];
    const setClauses = [];
    const params = [];

    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(fields, field)) {
        setClauses.push(`${field} = ?`);
        params.push(fields[field]);
      }
    });

    if (setClauses.length === 0) {
      return this.findById(id, userId);
    }

    params.push(id, userId);

    const [result] = await pool.query(
      `UPDATE tasks SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return null;
    }

    return this.findById(id, userId);
  },

  async remove(id, userId) {
    const [result] = await pool.query('DELETE FROM tasks WHERE id = ? AND user_id = ?', [
      id,
      userId,
    ]);
    return result.affectedRows > 0;
  },

  /**
   * Aggregates dashboard counters in a single round trip using
   * conditional SUM() rather than four separate queries.
   */
  async getStats(userId) {
    const [rows] = await pool.query(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) AS inProgress,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN status != 'Completed' AND due_date < CURDATE() THEN 1 ELSE 0 END) AS overdue
      FROM tasks
      WHERE user_id = ?`,
      [userId]
    );

    const stats = rows[0];
    return {
      total: Number(stats.total) || 0,
      pending: Number(stats.pending) || 0,
      inProgress: Number(stats.inProgress) || 0,
      completed: Number(stats.completed) || 0,
      overdue: Number(stats.overdue) || 0,
    };
  },
};

module.exports = TaskModel;
