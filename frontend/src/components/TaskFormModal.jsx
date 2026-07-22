import React, { useEffect, useState } from 'react';
import { X, Folder, User, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userApi, projectApi } from '../api/client';

const adminEmptyForm = {
  title: '',
  description: '',
  priority: 'Medium',
  status: 'Pending',
  due_date: '',
  assigned_to: '',
  project_id: '',
  completion_note: '',
};

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export default function TaskFormModal({ open, onClose, onSubmit, initialTask, isSubmitting }) {
  const { canManageTasks } = useAuth();
  const [form, setForm] = useState(adminEmptyForm);
  const [errors, setErrors] = useState({});
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);

  const isEditMode = Boolean(initialTask);

  useEffect(() => {
    if (!open) return;

    if (canManageTasks) {
      userApi.getEmployees()
        .then((res) => setEmployees(res.data.data.employees))
        .catch(() => setEmployees([]));

      projectApi.getAll()
        .then((res) => setProjects(res.data.data.projects))
        .catch(() => setProjects([]));
    }

    if (initialTask) {
      setForm({
        title: initialTask.title || '',
        description: initialTask.description || '',
        completion_note: initialTask.completion_note || '',
        priority: initialTask.priority || 'Medium',
        status: initialTask.status || 'Pending',
        due_date: initialTask.due_date || '',
        assigned_to: initialTask.assigned_to ?? '',
        project_id: initialTask.project_id ?? '',
      });
    } else {
      setForm(adminEmptyForm);
    }
    setErrors({});
  }, [open, initialTask, canManageTasks]);

  if (!open) return null;

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const newErrors = {};
    if (canManageTasks) {
      if (!form.title.trim()) newErrors.title = 'Title is required';
      if (!form.priority) newErrors.priority = 'Priority is required';
      if (!form.status) newErrors.status = 'Status is required';
      if (!form.due_date) {
        newErrors.due_date = 'Due date is required';
      } else if (!isEditMode && form.due_date < todayISO()) {
        newErrors.due_date = 'Due date cannot be earlier than today';
      }
    } else {
      if (!form.status) newErrors.status = 'Status is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (canManageTasks) {
      onSubmit({
        title: form.title,
        description: form.description,
        completion_note: form.completion_note,
        priority: form.priority,
        status: form.status,
        due_date: form.due_date,
        assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
        project_id: form.project_id ? Number(form.project_id) : null,
      });
    } else {
      // Employee updating status and adding commit notes
      onSubmit({
        status: form.status,
        completion_note: form.completion_note,
      });
    }
  };

  // ── Employee View — read-only details + status & completion note ─────────────
  if (!canManageTasks) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 px-0 sm:px-4">
        <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white">
            <h2 className="text-lg font-bold text-slate-900">Update Task Progress</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 focus-ring rounded-full p-1"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2">
              <p className="font-semibold text-slate-900">{initialTask?.title}</p>
              {initialTask?.project_name && (
                <p className="text-xs text-primary-700 font-medium flex items-center gap-1">
                  <Folder size={12} /> {initialTask.project_name}
                </p>
              )}
              {initialTask?.description && (
                <p className="text-sm text-slate-500">{initialTask.description}</p>
              )}
              <div className="flex gap-4 text-xs text-slate-500 pt-1">
                <span>Priority: <strong className="text-slate-700">{initialTask?.priority}</strong></span>
                <span>Due: <strong className="text-slate-700">{initialTask?.due_date}</strong></span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="emp-status" className="block text-sm font-medium text-slate-700 mb-1">
                  Status <span className="text-rose-500">*</span>
                </label>
                <select
                  id="emp-status"
                  className="input-field"
                  value={form.status}
                  onChange={handleChange('status')}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
                {errors.status && <p className="mt-1 text-xs text-rose-600">{errors.status}</p>}
              </div>

              <div>
                <label htmlFor="completion_note" className="block text-sm font-medium text-slate-700 mb-1">
                  Work Commit / Completion Note
                </label>
                <textarea
                  id="completion_note"
                  className="input-field min-h-[90px]"
                  value={form.completion_note}
                  onChange={handleChange('completion_note')}
                  placeholder="Describe task progress, deliverable details, or notes..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Commit Status Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Admin & Task Manager View — full task creation/edit ──────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 px-0 sm:px-4">
      <div className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-slate-900">
            {isEditMode ? 'Edit Task' : 'Create Task'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 focus-ring rounded-full p-1"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              className="input-field"
              value={form.title}
              onChange={handleChange('title')}
              placeholder="e.g. Design homepage wireframe"
            />
            {errors.title && <p className="mt-1 text-xs text-rose-600">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="project_id" className="block text-sm font-medium text-slate-700 mb-1">
              Project
            </label>
            <select
              id="project_id"
              className="input-field"
              value={form.project_id}
              onChange={handleChange('project_id')}
            >
              <option value="">— No Project —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              className="input-field min-h-[70px]"
              value={form.description}
              onChange={handleChange('description')}
              placeholder="Optional task instructions"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-slate-700 mb-1">
                Priority <span className="text-rose-500">*</span>
              </label>
              <select id="priority" className="input-field" value={form.priority} onChange={handleChange('priority')}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              {errors.priority && <p className="mt-1 text-xs text-rose-600">{errors.priority}</p>}
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">
                Status <span className="text-rose-500">*</span>
              </label>
              <select id="status" className="input-field" value={form.status} onChange={handleChange('status')}>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
              {errors.status && <p className="mt-1 text-xs text-rose-600">{errors.status}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="due_date" className="block text-sm font-medium text-slate-700 mb-1">
              Due Date <span className="text-rose-500">*</span>
            </label>
            <input
              id="due_date"
              type="date"
              className="input-field"
              value={form.due_date}
              onChange={handleChange('due_date')}
              min={!isEditMode ? todayISO() : undefined}
            />
            {errors.due_date && <p className="mt-1 text-xs text-rose-600">{errors.due_date}</p>}
          </div>

          <div>
            <label htmlFor="assigned_to" className="block text-sm font-medium text-slate-700 mb-1">
              Assign To
            </label>
            <select
              id="assigned_to"
              className="input-field"
              value={form.assigned_to}
              onChange={handleChange('assigned_to')}
            >
              <option value="">— Unassigned —</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.email})
                </option>
              ))}
            </select>
          </div>

          {isEditMode && (
            <div>
              <label htmlFor="completion_note" className="block text-sm font-medium text-slate-700 mb-1">
                Completion Note / Commit Message
              </label>
              <textarea
                id="completion_note"
                className="input-field min-h-[60px]"
                value={form.completion_note}
                onChange={handleChange('completion_note')}
                placeholder="Optional progress or completion notes"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
