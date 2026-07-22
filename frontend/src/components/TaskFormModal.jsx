import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/client';

const adminEmptyForm = {
  title: '',
  description: '',
  priority: 'Medium',
  status: 'Pending',
  due_date: '',
  assigned_to: '',
};

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export default function TaskFormModal({ open, onClose, onSubmit, initialTask, isSubmitting }) {
  const { isAdmin } = useAuth();
  const [form, setForm] = useState(adminEmptyForm);
  const [errors, setErrors] = useState({});
  const [employees, setEmployees] = useState([]);

  const isEditMode = Boolean(initialTask);

  // Fetch employees list for the assignment dropdown (admin only)
  useEffect(() => {
    if (!open || !isAdmin) return;
    userApi.getEmployees()
      .then((res) => setEmployees(res.data.data.employees))
      .catch(() => setEmployees([]));
  }, [open, isAdmin]);

  useEffect(() => {
    if (open) {
      if (initialTask) {
        setForm({
          title: initialTask.title || '',
          description: initialTask.description || '',
          priority: initialTask.priority || 'Medium',
          status: initialTask.status || 'Pending',
          due_date: initialTask.due_date || '',
          assigned_to: initialTask.assigned_to ?? '',
        });
      } else {
        setForm(adminEmptyForm);
      }
      setErrors({});
    }
  }, [open, initialTask]);

  if (!open) return null;

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const newErrors = {};
    if (isAdmin) {
      if (!form.title.trim()) newErrors.title = 'Title is required';
      if (!form.priority) newErrors.priority = 'Priority is required';
      if (!form.status) newErrors.status = 'Status is required';
      if (!form.due_date) {
        newErrors.due_date = 'Due date is required';
      } else if (!isEditMode && form.due_date < todayISO()) {
        newErrors.due_date = 'Due date cannot be earlier than today';
      }
    } else {
      // Employee: only status is editable
      if (!form.status) newErrors.status = 'Status is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (isAdmin) {
      onSubmit({
        title: form.title,
        description: form.description,
        priority: form.priority,
        status: form.status,
        due_date: form.due_date,
        assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
      });
    } else {
      // Employee submits status update only
      onSubmit({ status: form.status });
    }
  };

  // ── Employee view — read-only info + status picker ────────────────────────
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 px-0 sm:px-4">
        <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white">
            <h2 className="text-lg font-bold text-slate-900">Update Task Status</h2>
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
            {/* Read-only task info */}
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2">
              <p className="font-semibold text-slate-900">{initialTask?.title}</p>
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

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Admin view — full task form ───────────────────────────────────────────
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
          {/* Title */}
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
              placeholder="e.g. Prepare quarterly report"
            />
            {errors.title && <p className="mt-1 text-xs text-rose-600">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              className="input-field min-h-[80px]"
              value={form.description}
              onChange={handleChange('description')}
              placeholder="Optional details about this task"
            />
          </div>

          {/* Priority + Status */}
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

          {/* Due Date */}
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

          {/* Assign To */}
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
            {employees.length === 0 && (
              <p className="mt-1 text-xs text-slate-400">
                No employees yet — employees can sign up via the Register page.
              </p>
            )}
          </div>

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
