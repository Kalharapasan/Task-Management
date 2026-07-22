const ProjectModel = require('../models/projectModel');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/projects
const getProjects = asyncHandler(async (req, res) => {
  const projects = await ProjectModel.findAll(req.user.id, req.user.role);
  res.status(200).json({ success: true, count: projects.length, data: { projects } });
});

// GET /api/projects/:id
const getProjectById = asyncHandler(async (req, res) => {
  const project = await ProjectModel.findById(req.params.id);
  if (!project) throw new ApiError(404, 'Project not found');
  res.status(200).json({ success: true, data: { project } });
});

// POST /api/projects (Admin & Task Manager)
const createProject = asyncHandler(async (req, res) => {
  const { name, description, status } = req.body;
  if (!name || !name.trim()) throw new ApiError(400, 'Project name is required');

  const project = await ProjectModel.create(req.user.id, {
    name: name.trim(),
    description,
    status,
  });

  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    data: { project },
  });
});

// PUT /api/projects/:id (Admin & Task Manager)
const updateProject = asyncHandler(async (req, res) => {
  const existing = await ProjectModel.findById(req.params.id);
  if (!existing) throw new ApiError(404, 'Project not found');

  const { name, description, status } = req.body;
  const project = await ProjectModel.update(req.params.id, { name, description, status });

  res.status(200).json({
    success: true,
    message: 'Project updated successfully',
    data: { project },
  });
});

// DELETE /api/projects/:id (Admin only)
const deleteProject = asyncHandler(async (req, res) => {
  const existing = await ProjectModel.findById(req.params.id);
  if (!existing) throw new ApiError(404, 'Project not found');

  await ProjectModel.remove(req.params.id);
  res.status(200).json({ success: true, message: 'Project deleted successfully' });
});

// GET /api/projects/stats/report (Admin & Task Manager)
const getProjectReport = asyncHandler(async (req, res) => {
  const report = await ProjectModel.getReport();
  res.status(200).json({ success: true, data: { report } });
});

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectReport,
};
