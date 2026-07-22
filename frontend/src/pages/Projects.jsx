import React, { useEffect, useState } from 'react';
import { Plus, FolderKanban, Pencil, Trash2, X, CheckCircle2, Clock, PauseCircle } from 'lucide-react';
import Layout from '../components/Layout';
import ConfirmDialog from '../components/ConfirmDialog';
import { projectApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', status: 'Active' });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const openEditModal = (p) => {
    setEditingProject(p);
    setForm({ name: p.name, description: p.description || '', status: p.status || 'Active' });
    setIsModalOpen(true);
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
          <p className="text-sm text-slate-500 mt-1">Organize and monitor project task completion status.</p>
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
            {canManageProjects ? 'Create a project to group your tasks.' : 'No projects have been assigned yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((p) => (
            <div key={p.id} className="card p-5 flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h2 className="font-bold text-slate-900 text-lg leading-snug">{p.name}</h2>
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
                  <div className="bg-primary-600 h-2 rounded-full transition-all duration-300" style={{ width: `${p.progress}%` }} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">By {p.creator_name || 'Admin'}</span>
                  {canManageProjects && (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(p)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-primary-600 hover:bg-slate-100"
                        aria-label="Edit project"
                      >
                        <Pencil size={15} />
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setProjectToDelete(p)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          aria-label="Delete project"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Form Modal */}
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
