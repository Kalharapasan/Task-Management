const { pool } = require('../config/db');

const ALLOWED_PROJECT_STATUS = ['Active', 'Completed', 'On Hold'];

const ProjectModel = {
  ALLOWED_PROJECT_STATUS,

  async findAll(userId, role) {
    const isEmployee = role === 'employee';

    // Subquery tasks count grouped by project_id for MySQL 8.0 ONLY_FULL_GROUP_BY compliance
    const sql = `
      SELECT
        p.id, p.name, p.description, p.status, p.created_by, p.created_at, p.updated_at,
        u.name AS creator_name,
        COALESCE(t.total_tasks, 0) AS total_tasks,
        COALESCE(t.completed_tasks, 0) AS completed_tasks
      FROM projects p
      LEFT JOIN users u ON u.id = p.created_by
      LEFT JOIN (
        SELECT
          project_id,
          COUNT(*) AS total_tasks,
          SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed_tasks
        FROM tasks
        ${isEmployee ? 'WHERE assigned_to = ?' : ''}
        GROUP BY project_id
      ) t ON t.project_id = p.id
      ${isEmployee ? 'WHERE p.created_by = ? OR t.project_id IS NOT NULL' : ''}
      ORDER BY p.created_at DESC
    `;

    const params = isEmployee ? [userId, userId] : [];
    const [rows] = await pool.query(sql, params);

    return rows.map((r) => ({
      ...r,
      total_tasks: Number(r.total_tasks) || 0,
      completed_tasks: Number(r.completed_tasks) || 0,
      progress:
        Number(r.total_tasks) > 0
          ? Math.round((Number(r.completed_tasks) / Number(r.total_tasks)) * 100)
          : 0,
    }));
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.description, p.status, p.created_by, p.created_at, p.updated_at,
              u.name AS creator_name
       FROM projects p
       LEFT JOIN users u ON u.id = p.created_by
       WHERE p.id = ? LIMIT 1`,
      [id]
    );
    if (!rows[0]) return null;

    const [tasks] = await pool.query(
      `SELECT t.id, t.title, t.description, t.priority, t.status, t.due_date, t.assigned_to,
              u.name AS assigned_to_name
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assigned_to
       WHERE t.project_id = ?
       ORDER BY t.due_date ASC`,
      [id]
    );

    return { ...rows[0], tasks };
  },

  async create(userId, { name, description, status = 'Active' }) {
    const [result] = await pool.query(
      `INSERT INTO projects (name, description, status, created_by) VALUES (?, ?, ?, ?)`,
      [name, description || null, status, userId]
    );
    return this.findById(result.insertId);
  },

  async update(id, { name, description, status }) {
    const fields = [];
    const params = [];

    if (name !== undefined) { fields.push('name = ?'); params.push(name); }
    if (description !== undefined) { fields.push('description = ?'); params.push(description); }
    if (status !== undefined && ALLOWED_PROJECT_STATUS.includes(status)) {
      fields.push('status = ?'); params.push(status);
    }

    if (fields.length === 0) return this.findById(id);

    params.push(id);
    await pool.query(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  },

  async remove(id) {
    const [result] = await pool.query('DELETE FROM projects WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async getReport() {
    const [rows] = await pool.query(`
      SELECT
        COUNT(*) AS total_projects,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) AS active_projects,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed_projects,
        SUM(CASE WHEN status = 'On Hold' THEN 1 ELSE 0 END) AS on_hold_projects
      FROM projects
    `);

    const stats = rows[0];
    return {
      total: Number(stats.total_projects) || 0,
      active: Number(stats.active_projects) || 0,
      completed: Number(stats.completed_projects) || 0,
      onHold: Number(stats.on_hold_projects) || 0,
    };
  },
};

module.exports = ProjectModel;
