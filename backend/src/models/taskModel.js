const { pool } = require('../config/db');

const ALLOWED_STATUS = ['Pending', 'In Progress', 'Completed'];
const ALLOWED_PRIORITY = ['Low', 'Medium', 'High'];

const ALLOWED_SORTS = {
  newest: 't.created_at DESC',
  oldest: 't.created_at ASC',
  due_date: 't.due_date ASC',
};

// Base SELECT that always joins assignee name for the frontend.
const BASE_SELECT = `
  SELECT
    t.id, t.user_id, t.assigned_to,
    t.title, t.description, t.priority, t.status, t.due_date,
    t.created_at, t.updated_at,
    u.name AS assigned_to_name
  FROM tasks t
  LEFT JOIN users u ON u.id = t.assigned_to
`;

const TaskModel = {
  ALLOWED_STATUS,
  ALLOWED_PRIORITY,

  /**
   * findAll
   * isAdmin=true  → returns every task (no ownership filter)
   * isAdmin=false → returns only tasks assigned to the requesting employee
   */
  async findAll(userId, isAdmin, { search, status, priority, sort, page = 1, limit = 10 } = {}) {
    const clauses = isAdmin ? [] : ['t.assigned_to = ?'];
    const params = isAdmin ? [] : [userId];

    if (search) {
      clauses.push('t.title LIKE ?');
      params.push(`%${search}%`);
    }
    if (status && ALLOWED_STATUS.includes(status)) {
      clauses.push('t.status = ?');
      params.push(status);
    }
    if (priority && ALLOWED_PRIORITY.includes(priority)) {
      clauses.push('t.priority = ?');
      params.push(priority);
    }

    const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const orderBy = ALLOWED_SORTS[sort] || ALLOWED_SORTS.newest;

    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (safePage - 1) * safeLimit;

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM tasks t ${whereSql}`,
      params
    );
    const total = Number(countRows[0].total) || 0;

    const [rows] = await pool.query(
      `${BASE_SELECT} ${whereSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [...params, safeLimit, offset]
    );

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

  /**
   * findById
   * Admin can fetch any task; employee can only fetch tasks assigned to them.
   */
  async findById(id, userId, isAdmin) {
    const where = isAdmin
      ? 'WHERE t.id = ?'
      : 'WHERE t.id = ? AND t.assigned_to = ?';
    const params = isAdmin ? [id] : [id, userId];

    const [rows] = await pool.query(`${BASE_SELECT} ${where} LIMIT 1`, params);
    return rows[0] || null;
  },

  /**
   * create — admin only; assigned_to is required to assign the task to an employee.
   */
  async create(userId, { title, description, priority, status, due_date, assigned_to }) {
    const [result] = await pool.query(
      `INSERT INTO tasks (user_id, assigned_to, title, description, priority, status, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, assigned_to || null, title, description || null, priority, status, due_date]
    );
    return this.findById(result.insertId, userId, true);
  },

  /**
   * update
   * Admin: can update all fields including assigned_to
   * Employee: can only update status on their assigned tasks
   */
  async update(id, userId, isAdmin, fields) {
    const allowedFields = isAdmin
      ? ['title', 'description', 'priority', 'status', 'due_date', 'assigned_to']
      : ['status'];

    const setClauses = [];
    const params = [];

    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(fields, field)) {
        setClauses.push(`${field} = ?`);
        params.push(fields[field] === undefined ? null : fields[field]);
      }
    });

    if (setClauses.length === 0) {
      return this.findById(id, userId, isAdmin);
    }

    const whereClause = isAdmin
      ? 'WHERE id = ?'
      : 'WHERE id = ? AND assigned_to = ?';

    params.push(id);
    if (!isAdmin) params.push(userId);

    const [result] = await pool.query(
      `UPDATE tasks SET ${setClauses.join(', ')} ${whereClause}`,
      params
    );

    if (result.affectedRows === 0) return null;
    return this.findById(id, userId, isAdmin);
  },

  /**
   * remove — admin only (enforced at the route level)
   */
  async remove(id) {
    const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  /**
   * bulkUpdateStatus — admin only
   */
  async bulkUpdateStatus(ids, userId, status) {
    if (!ids.length) return 0;
    const placeholders = ids.map(() => '?').join(', ');
    const [result] = await pool.query(
      `UPDATE tasks SET status = ? WHERE id IN (${placeholders})`,
      [status, ...ids]
    );
    return result.affectedRows;
  },

  /**
   * bulkRemove — admin only
   */
  async bulkRemove(ids, userId) {
    if (!ids.length) return 0;
    const placeholders = ids.map(() => '?').join(', ');
    const [result] = await pool.query(
      `DELETE FROM tasks WHERE id IN (${placeholders})`,
      [...ids]
    );
    return result.affectedRows;
  },

  /**
   * getStats
   * Admin: stats across ALL tasks
   * Employee: stats for tasks assigned to them only
   */
  async getStats(userId, isAdmin) {
    const where = isAdmin ? '' : 'WHERE assigned_to = ?';
    const params = isAdmin ? [] : [userId];

    const [rows] = await pool.query(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) AS inProgress,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN status != 'Completed' AND due_date < CURDATE() THEN 1 ELSE 0 END) AS overdue,
        SUM(CASE WHEN priority = 'Low' THEN 1 ELSE 0 END) AS lowPriority,
        SUM(CASE WHEN priority = 'Medium' THEN 1 ELSE 0 END) AS mediumPriority,
        SUM(CASE WHEN priority = 'High' THEN 1 ELSE 0 END) AS highPriority
      FROM tasks ${where}`,
      params
    );

    const stats = rows[0];
    return {
      total: Number(stats.total) || 0,
      pending: Number(stats.pending) || 0,
      inProgress: Number(stats.inProgress) || 0,
      completed: Number(stats.completed) || 0,
      overdue: Number(stats.overdue) || 0,
      byPriority: {
        Low: Number(stats.lowPriority) || 0,
        Medium: Number(stats.mediumPriority) || 0,
        High: Number(stats.highPriority) || 0,
      },
    };
  },
};

module.exports = TaskModel;
