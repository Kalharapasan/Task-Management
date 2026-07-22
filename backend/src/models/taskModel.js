const { pool } = require('../config/db');

const ALLOWED_STATUS = ['Pending', 'In Progress', 'Completed'];
const ALLOWED_PRIORITY = ['Low', 'Medium', 'High'];

const ALLOWED_SORTS = {
  newest: 't.created_at DESC',
  oldest: 't.created_at ASC',
  due_date: 't.due_date ASC',
};

const BASE_SELECT = `
  SELECT
    t.id, t.user_id, t.assigned_to, t.project_id,
    t.title, t.description, t.completion_note, t.priority, t.status, t.due_date,
    t.created_at, t.updated_at,
    u.name AS assigned_to_name,
    p.name AS project_name
  FROM tasks t
  LEFT JOIN users u ON u.id = t.assigned_to
  LEFT JOIN projects p ON p.id = t.project_id
`;

const TaskModel = {
  ALLOWED_STATUS,
  ALLOWED_PRIORITY,

  async getCommits(taskId) {
    const [rows] = await pool.query(
      `SELECT c.id, c.status, c.note, c.created_at, u.name AS user_name, u.role AS user_role
       FROM task_commits c
       LEFT JOIN users u ON u.id = c.user_id
       WHERE c.task_id = ?
       ORDER BY c.created_at DESC`,
      [taskId]
    );
    return rows;
  },

  async addCommit(taskId, userId, status, note) {
    if (!status && !note) return;
    await pool.query(
      `INSERT INTO task_commits (task_id, user_id, status, note) VALUES (?, ?, ?, ?)`,
      [taskId, userId, status, note || null]
    );
  },

  async findAll(userId, role, { search, status, priority, sort, page = 1, limit = 10, projectId } = {}) {
    const isManagerOrAdmin = role === 'admin' || role === 'task_manager';
    const clauses = isManagerOrAdmin ? [] : ['t.assigned_to = ?'];
    const params = isManagerOrAdmin ? [] : [userId];

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
    if (projectId) {
      clauses.push('t.project_id = ?');
      params.push(projectId);
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

  async findById(id, userId, role) {
    const isManagerOrAdmin = role === 'admin' || role === 'task_manager';
    const where = isManagerOrAdmin
      ? 'WHERE t.id = ?'
      : 'WHERE t.id = ? AND t.assigned_to = ?';
    const params = isManagerOrAdmin ? [id] : [id, userId];

    const [rows] = await pool.query(`${BASE_SELECT} ${where} LIMIT 1`, params);
    if (!rows[0]) return null;

    const commits = await this.getCommits(id);
    return { ...rows[0], commits };
  },

  async create(userId, { title, description, priority, status, due_date, assigned_to, project_id, completion_note }) {
    const [result] = await pool.query(
      `INSERT INTO tasks (user_id, assigned_to, project_id, title, description, completion_note, priority, status, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        assigned_to || null,
        project_id || null,
        title,
        description || null,
        completion_note || null,
        priority,
        status,
        due_date,
      ]
    );

    const createdId = result.insertId;
    if (completion_note || status) {
      await this.addCommit(createdId, userId, status, completion_note || 'Task created');
    }

    return this.findById(createdId, userId, 'admin');
  },

  async update(id, userId, role, fields) {
    const isManagerOrAdmin = role === 'admin' || role === 'task_manager';
    const allowedFields = isManagerOrAdmin
      ? ['title', 'description', 'priority', 'status', 'due_date', 'assigned_to', 'project_id', 'completion_note']
      : ['status', 'completion_note'];

    const setClauses = [];
    const params = [];

    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(fields, field)) {
        setClauses.push(`${field} = ?`);
        params.push(fields[field] === undefined ? null : fields[field]);
      }
    });

    if (setClauses.length === 0) {
      return this.findById(id, userId, role);
    }

    const whereClause = isManagerOrAdmin
      ? 'WHERE id = ?'
      : 'WHERE id = ? AND assigned_to = ?';

    params.push(id);
    if (!isManagerOrAdmin) params.push(userId);

    const [result] = await pool.query(
      `UPDATE tasks SET ${setClauses.join(', ')} ${whereClause}`,
      params
    );

    if (result.affectedRows === 0) return null;

    // Record commit activity log if status or completion_note was updated
    if (fields.status || fields.completion_note) {
      await this.addCommit(
        id,
        userId,
        fields.status || 'In Progress',
        fields.completion_note || `Status updated to ${fields.status}`
      );
    }

    return this.findById(id, userId, role);
  },

  async remove(id) {
    const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async bulkUpdateStatus(ids, status) {
    if (!ids.length) return 0;
    const placeholders = ids.map(() => '?').join(', ');
    const [result] = await pool.query(
      `UPDATE tasks SET status = ? WHERE id IN (${placeholders})`,
      [status, ...ids]
    );
    return result.affectedRows;
  },

  async bulkRemove(ids) {
    if (!ids.length) return 0;
    const placeholders = ids.map(() => '?').join(', ');
    const [result] = await pool.query(
      `DELETE FROM tasks WHERE id IN (${placeholders})`,
      [...ids]
    );
    return result.affectedRows;
  },

  async getStats(userId, role) {
    const isManagerOrAdmin = role === 'admin' || role === 'task_manager';
    const where = isManagerOrAdmin ? '' : 'WHERE assigned_to = ?';
    const params = isManagerOrAdmin ? [] : [userId];

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
