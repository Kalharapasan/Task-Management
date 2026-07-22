import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Calendar, Inbox } from 'lucide-react';
import Layout from '../components/Layout';
import TaskToolbar from '../components/TaskToolbar';
import TaskFormModal from '../components/TaskFormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import { taskApi } from '../api/client';
import { useToast } from '../context/ToastContext';

const PAGE_SIZE = 8;

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function isOverdue(task) {
  if (task.status === 'Completed') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(task.due_date) < today;
}

export default function Tasks() {
  const { showToast } = useToast();

  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', sort: 'newest' });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.sort) params.sort = filters.sort;

      const response = await taskApi.getAll(params);
      setTasks(response.data.data.tasks);
      setPagination(response.data.data.pagination);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to load tasks', 'error');
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  // Debounce the search box so we don't fire a request on every keystroke;
  // other filters (status/priority/sort) re-fetch immediately.
  useEffect(() => {
    const handle = setTimeout(fetchTasks, filters.search ? 350 : 0);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  // Any filter change should jump back to page 1, otherwise you can land
  // on an out-of-range page with no results.
  const handleFilterChange = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };
  const handleClearFilters = () => {
    setFilters({ search: '', status: '', priority: '', sort: 'newest' });
    setPage(1);
  };

  const openCreateForm = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  };

  const openEditForm = (task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (isSubmitting) return;
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const handleFormSubmit = async (form) => {
    setIsSubmitting(true);
    try {
      if (editingTask) {
        await taskApi.update(editingTask.id, form);
        showToast('Task updated successfully');
      } else {
        await taskApi.create(form);
        showToast('Task created successfully');
      }
      setIsFormOpen(false);
      setEditingTask(null);
      fetchTasks();
    } catch (error) {
      const message =
        error.response?.data?.errors?.[0]?.message ||
        error.response?.data?.message ||
        'Something went wrong while saving the task';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    try {
      await taskApi.remove(taskToDelete.id);
      showToast('Task deleted successfully');
      setTaskToDelete(null);
      fetchTasks();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete task', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const emptyState = useMemo(
    () => !isLoading && tasks.length === 0,
    [isLoading, tasks]
  );

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Tasks</h1>
          <p className="text-sm text-slate-500 mt-1">Create, update, and track your daily tasks.</p>
        </div>
        <button type="button" onClick={openCreateForm} className="btn-primary">
          <Plus size={16} />
          <span className="hidden sm:inline">New Task</span>
        </button>
      </div>

      <div className="mb-4">
        <TaskToolbar filters={filters} onChange={handleFilterChange} onClear={handleClearFilters} />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-pulse h-20 w-full" />
          ))}
        </div>
      ) : emptyState ? (
        <div className="card p-12 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
            <Inbox size={22} />
          </div>
          <p className="text-slate-900 font-semibold">No tasks found</p>
          <p className="text-sm text-slate-500 mt-1">
            Try adjusting your filters, or create a new task to get started.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left font-semibold px-4 py-3">Title</th>
                  <th className="text-left font-semibold px-4 py-3">Priority</th>
                  <th className="text-left font-semibold px-4 py-3">Status</th>
                  <th className="text-left font-semibold px-4 py-3">Due Date</th>
                  <th className="text-right font-semibold px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{task.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 ${isOverdue(task) ? 'text-rose-600 font-medium' : 'text-slate-600'}`}
                      >
                        <Calendar size={14} />
                        {formatDate(task.due_date)}
                        {isOverdue(task) && ' (Overdue)'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditForm(task)}
                          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-primary-600 focus-ring"
                          aria-label={`Edit ${task.title}`}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setTaskToDelete(task)}
                          className="p-2 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 focus-ring"
                          aria-label={`Delete ${task.title}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{task.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditForm(task)}
                      className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                      aria-label={`Edit ${task.title}`}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskToDelete(task)}
                      className="p-2 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                      aria-label={`Delete ${task.title}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center flex-wrap gap-2 mt-3">
                  <PriorityBadge priority={task.priority} />
                  <StatusBadge status={task.status} />
                  <span
                    className={`inline-flex items-center gap-1 text-xs ${isOverdue(task) ? 'text-rose-600 font-medium' : 'text-slate-500'}`}
                  >
                    <Calendar size={12} />
                    {formatDate(task.due_date)}
                    {isOverdue(task) && ' (Overdue)'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            page={pagination.page || page}
            totalPages={pagination.totalPages || 1}
            total={pagination.total || 0}
            limit={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      <TaskFormModal
        open={isFormOpen}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
        initialTask={editingTask}
        isSubmitting={isSubmitting}
      />

      <ConfirmDialog
        open={Boolean(taskToDelete)}
        title="Delete task?"
        message={`This will permanently delete "${taskToDelete?.title}". This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setTaskToDelete(null)}
        isSubmitting={isDeleting}
      />
    </Layout>
  );
}
