const express = require('express');
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectReport,
} = require('../controllers/projectController');
const requireAuth = require('../middleware/auth');
const { requireAdmin, requireManagerOrAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/stats/report', requireManagerOrAdmin, getProjectReport);
router.get('/', getProjects);
router.get('/:id', getProjectById);

router.post('/', requireManagerOrAdmin, createProject);
router.put('/:id', requireManagerOrAdmin, updateProject);
router.delete('/:id', requireAdmin, deleteProject);

module.exports = router;
