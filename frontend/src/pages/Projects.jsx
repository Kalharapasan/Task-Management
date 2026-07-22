import React, { useEffect, useState } from 'react';
import {
  Plus, FolderKanban, Pencil, Trash2, X, CheckCircle2, Clock, PauseCircle,
  Eye, User, MessageSquare, Calendar, ListChecks,
} from 'lucide-react';
import Layout from '../components/Layout';
import ConfirmDialog from '../components/ConfirmDialog';
import { projectApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatusBadge, PriorityBadge } from '../components/Badges';

function ProjectStatusBadge({ status }) {
  const styles = {
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Completed: 'bg-primary-50 text-primary-700 border-primary-200',
    'On Hold': 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[status] || 'bg-slate-100'}`}>
      {status === 'Active' && <Clock size={12} />}
      {status === 'Completed' && <CheckCircle2 size={12} />}
      {status === 'On Hold' && <PauseCircle size={12} />}
      {status}
    </span>
  );
}

export default function Projects() {
  const { canManageProjects, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Project Create/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', status: 'Active' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Project Summary / Details Modal
  const [summaryProject, setSummaryProject] = useState(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  // Delete Project Dialog
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await projectApi.getAll();
      setProjects(response.data.data.projects);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to load projects', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreateModal = () => {
    setEditingProject(null);
    setForm({ name: '', description: '', status: 'Active' });
    setIsModalOpen(true);
  };

  const openEditModal = (p, e) => {
    if (e) e.stopPropagation();
    setEditingProject(p);
    setForm({ name: p.name, description: p.description || '', status: p.status || 'Active' });
    setIsModalOpen(true);
  };

  const openSummaryModal = async (project) => {
    setIsSummaryLoading(true);
    try {
      const res = await projectApi.getById(project.id);
      setSummaryProject(res.data.data.project);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to load project details', 'error');
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('Project name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingProject) {
        await projectApi.update(editingProject.id, form);
        showToast('Project updated successfully');
      } else {
        await projectApi.create(form);
        showToast('Project created successfully');
      }
      setIsModalOpen(false);
      fetchProjects();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save project', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      await projectApi.remove(projectToDelete.id);
      showToast('Project deleted successfully');
      setProjectToDelete(null);
      fetchProjects();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete project', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredProjects = projects.filter((p) => (!statusFilter ? true : p.status === statusFilter));

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Projects</h1>
          <p className="text-sm text-slate-500 mt-1">
            Click any project card to view its task updates and employee work commit notes.
          </p>
        </div>

        {canManageProjects && (
          <button type="button" onClick={openCreateModal} className="btn-primary">
            <Plus size={16} />
            <span>New Project</span>
          </button>
        )}
      </div>

      <div className="card p-4 mb-6 flex items-center gap-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status:</span>
        <div className="flex gap-1.5 flex-wrap">
          {['', 'Active', 'Completed', 'On Hold'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                statusFilter === st ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st || 'All Projects'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton-pulse h-44 w-full" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="card p-12 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
            <FolderKanban size={22} />
          </div>
          <p className="text-slate-900 font-semibold">No projects found</p>
          <p className="text-sm text-slate-500 mt-1">
            {canManageProjects ? 'Create a project to group your tasks.' : 'No projects found.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((p) => (
            <div
              key={p.id}
              onClick={() => openSummaryModal(p)}
              className="card p-5 flex flex-col justify-between cursor-pointer hover:shadow-lg transition hover:border-primary-300 group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h2 className="font-bold text-slate-900 text-lg leading-snug group-hover:text-primary-600">
                    {p.name}
                  </h2>
                  <ProjectStatusBadge status={p.status} />
                </div>
                {p.description && <p className="text-sm text-slate-500 line-clamp-2 mb-4">{p.description}</p>}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span>Tasks progress</span>
                  <span className="font-semibold text-slate-700">
                    {p.completed_tasks} / {p.total_tasks} ({p.progress}%)
                  </span>
                </div>

                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">By {p.creator_name || 'Admin'}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openSummaryModal(p);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 bg-primary-50 px-2 py-1 rounded-md hover:bg-primary-100"
                    >
                      <Eye size={13} />
                      <span>Summary</span>
                    </button>
                    {canManageProjects && (
                      <button
                        type="button"
                        onClick={(e) => openEditModal(p, e)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        aria-label="Edit project"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProjectToDelete(p);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        aria-label="Delete project"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Summary / Details Modal */}
      {summaryProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <FolderKanban size={20} className="text-primary-600" />
                <h2 className="text-lg font-bold text-slate-900">{summaryProject.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSummaryProject(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Project overview banner */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <ProjectStatusBadge status={summaryProject.status} />
                  <span className="text-xs text-slate-500">Created by: <strong>{summaryProject.creator_name || 'Admin'}</strong></span>
                </div>
                {summaryProject.description && (
                  <p className="text-sm text-slate-600">{summaryProject.description}</p>
                )}
              </div>

              {/* Tasks List with Commit Notes */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ListChecks size={18} className="text-primary-600" />
                    <span>Project Tasks ({summaryProject.tasks?.length || 0})</span>
                  </h3>
                </div>

                {(!summaryProject.tasks || summaryProject.tasks.length === 0) ? (
                  <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-sm">
                    No tasks linked to this project yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {summaryProject.tasks.map((task) => (
                      <div key={task.id} className="card p-4 hover:border-slate-300 transition">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{task.title}</p>
                            {task.description && (
                              <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <PriorityBadge priority={task.priority} />
                            <StatusBadge status={task.status} />
                          </div>
                        </div>

                        {/* Work Commit Note display */}
                        {task.completion_note && (
                          <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 mt-2 flex items-start gap-1.5">
                            <MessageSquare size={14} className="mt-0.5 shrink-0 text-emerald-600" />
                            <div>
                              <strong className="text-emerald-900">Work Commit Note:</strong>
                              <p className="text-emerald-800 mt-0.5">{task.completion_note}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100">
                          <span className="flex items-center gap-1">
                            <User size={12} /> Assigned: <strong>{task.assigned_to_name || 'Unassigned'}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> Due: {task.due_date}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSummaryProject(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">
                {editingProject ? 'Edit Project' : 'Create Project'}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Project Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Website Redesign"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  className="input-field min-h-[80px]"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief summary of the project goals"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  className="input-field"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Project Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(projectToDelete)}
        title="Delete Project?"
        message={`This will permanently delete "${projectToDelete?.name}" and all associated tasks.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setProjectToDelete(null)}
        isSubmitting={isDeleting}
      />
    </Layout>
  );
}
