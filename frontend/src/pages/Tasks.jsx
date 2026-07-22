import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus, Pencil, Trash2, Calendar, Inbox,
  List as ListIcon, Kanban as KanbanIcon, User, Folder, MessageSquare,
} from 'lucide-react';
import Layout from '../components/Layout';
import TaskToolbar from '../components/TaskToolbar';
import TaskFormModal from '../components/TaskFormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import KanbanBoard from '../components/KanbanBoard';
import BulkActionBar from '../components/BulkActionBar';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import { taskApi, projectApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const PAGE_SIZE = 8;
const BOARD_LIMIT = 200;

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
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
  const { canManageTasks, isAdmin } = useAuth();

  const [view, setView] = useState('list');
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', sort: 'newest', projectId: '' });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  useEffect(() => {
    projectApi.getAll()
      .then((res) => setProjects(res.data.data.projects))
      .catch(() => setProjects([]));
  }, []);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = view === 'board'
        ? { page: 1, limit: BOARD_LIMIT }
        : { page, limit: PAGE_SIZE };
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.sort) params.sort = filters.sort;
      if (filters.projectId) params.projectId = filters.projectId;

      const response = await taskApi.getAll(params);
      setTasks(response.data.data.tasks);
      setPagination(response.data.data.pagination);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to load tasks', 'error');
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page, view]);

  useEffect(() => {
    const handle = setTimeout(fetchTasks, filters.search ? 350 : 0);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page, view]);

  const handleFilterChange = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
    setSelectedIds(new Set());
  };
  const handleClearFilters = () => {
    setFilters({ search: '', status: '', priority: '', sort: 'newest', projectId: '' });
    setPage(1);
    setSelectedIds(new Set());
  };

  const openCreateForm = () => { setEditingTask(null); setIsFormOpen(true); };
  const openEditForm = (task) => { setEditingTask(task); setIsFormOpen(true); };
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
        showToast(canManageTasks ? 'Task updated successfully' : 'Task status & commit note updated!');
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

  const handleKanbanStatusChange = async (task, newStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
    try {
      await taskApi.update(task.id, canManageTasks
        ? { title: task.title, description: task.description, priority: task.priority, status: newStatus, due_date: task.due_date, assigned_to: task.assigned_to, project_id: task.project_id }
        : { status: newStatus }
      );
      showToast(`"${task.title}" moved to ${newStatus}`);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update task status', 'error');
      fetchTasks();
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    setSelectedIds((prev) => (prev.size === tasks.length ? new Set() : new Set(tasks.map((t) => t.id))));
  };
  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkStatus = async (status) => {
    setIsBulkSubmitting(true);
    try {
      await taskApi.bulkUpdateStatus([...selectedIds], status);
      showToast(`Updated ${selectedIds.size} task(s) to ${status}`);
      clearSelection();
      fetchTasks();
    } catch (error) {
      showToast(error.response?.data?.message || 'Bulk update failed', 'error');
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkSubmitting(true);
    try {
      await taskApi.bulkRemove([...selectedIds]);
      showToast(`Deleted ${selectedIds.size} task(s)`);
      clearSelection();
      setBulkDeleteOpen(false);
      fetchTasks();
    } catch (error) {
      showToast(error.response?.data?.message || 'Bulk delete failed', 'error');
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  const emptyState = useMemo(() => !isLoading && tasks.length === 0, [isLoading, tasks]);

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            {canManageTasks ? 'All Tasks' : 'My Assigned Tasks'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {canManageTasks
              ? 'Create, assign to projects & employees, and track progress.'
              : 'Click any task item to update status and attach work commit notes.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setView('list')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                view === 'list' ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ListIcon size={15} /> List
            </button>
            <button
              type="button"
              onClick={() => setView('board')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                view === 'board' ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <KanbanIcon size={15} /> Board
            </button>
          </div>

          {canManageTasks && (
            <button type="button" onClick={openCreateForm} className="btn-primary">
              <Plus size={16} />
              <span className="hidden sm:inline">New Task</span>
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <TaskToolbar filters={filters} onChange={handleFilterChange} onClear={handleClearFilters} />
        </div>
        <div className="card p-2 flex items-center gap-2 min-w-[200px]">
          <Folder size={16} className="text-slate-400 ml-2" />
          <select
            className="input-field border-none shadow-none text-xs py-1"
            value={filters.projectId}
            onChange={(e) => handleFilterChange({ projectId: e.target.value })}
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {canManageTasks && view === 'list' && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          onClear={clearSelection}
          onBulkStatus={handleBulkStatus}
          onBulkDelete={() => setBulkDeleteOpen(true)}
          isSubmitting={isBulkSubmitting}
        />
      )}

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
          <p className="text-slate-900 font-semibold">
            {canManageTasks ? 'No tasks found' : 'No tasks assigned to you yet'}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {canManageTasks
              ? 'Try adjusting your filters, or create a new task.'
              : 'Your Task Manager or Admin will assign tasks to you.'}
          </p>
        </div>
      ) : view === 'board' ? (
        <KanbanBoard
          tasks={tasks}
          onStatusChange={handleKanbanStatusChange}
          onEdit={openEditForm}
          onDelete={canManageTasks ? setTaskToDelete : null}
        />
      ) : (
        <>
          <div className="hidden md:block card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  {canManageTasks && (
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-primary-600 focus-ring"
                        checked={tasks.length > 0 && selectedIds.size === tasks.length}
                        onChange={toggleSelectAll}
                        aria-label="Select all tasks"
                      />
                    </th>
                  )}
                  <th className="text-left font-semibold px-4 py-3">Task & Commit Notes</th>
                  <th className="text-left font-semibold px-4 py-3">Project</th>
                  {canManageTasks && <th className="text-left font-semibold px-4 py-3">Assigned To</th>}
                  <th className="text-left font-semibold px-4 py-3">Priority</th>
                  <th className="text-left font-semibold px-4 py-3">Status</th>
                  <th className="text-left font-semibold px-4 py-3">Due Date</th>
                  <th className="text-right font-semibold px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => openEditForm(task)}
                    className={`hover:bg-slate-50 cursor-pointer transition ${canManageTasks && selectedIds.has(task.id) ? 'bg-primary-50/50' : ''}`}
                  >
                    {canManageTasks && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-primary-600 focus-ring"
                          checked={selectedIds.has(task.id)}
                          onChange={() => toggleSelect(task.id)}
                          aria-label={`Select ${task.title}`}
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 hover:text-primary-600">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{task.description}</p>
                      )}
                      {task.completion_note && (
                        <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded p-1.5 mt-1.5 flex items-start gap-1">
                          <MessageSquare size={12} className="mt-0.5 shrink-0 text-emerald-600" />
                          <span><strong>Commit Note:</strong> {task.completion_note}</span>
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {task.project_name ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          <Folder size={11} /> {task.project_name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">—</span>
                      )}
                    </td>
                    {canManageTasks && (
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                          <User size={12} />
                          {task.assigned_to_name || <span className="text-slate-400 italic">Unassigned</span>}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 ${isOverdue(task) ? 'text-rose-600 font-medium' : 'text-slate-600'}`}>
                        <Calendar size={14} />
                        {formatDate(task.due_date)}
                        {isOverdue(task) && ' (Overdue)'}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditForm(task)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 hover:text-primary-600 focus-ring"
                        >
                          <Pencil size={14} />
                          <span>Update</span>
                        </button>
                        {canManageTasks && (
                          <button
                            type="button"
                            onClick={() => setTaskToDelete(task)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 focus-ring"
                            aria-label={`Delete ${task.title}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile view */}
          <div className="md:hidden space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => openEditForm(task)}
                className="card p-4 cursor-pointer hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{task.title}</p>
                    {task.project_name && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-700 mt-0.5">
                        <Folder size={11} /> {task.project_name}
                      </span>
                    )}
                    {task.completion_note && (
                      <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded p-1.5 mt-1.5 flex items-start gap-1">
                        <MessageSquare size={12} className="mt-0.5 shrink-0 text-emerald-600" />
                        <span><strong>Commit Note:</strong> {task.completion_note}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => openEditForm(task)}
                      className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                    >
                      <Pencil size={16} />
                    </button>
                    {canManageTasks && (
                      <button
                        type="button"
                        onClick={() => setTaskToDelete(task)}
                        className="p-2 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center flex-wrap gap-2 mt-3 pt-2 border-t border-slate-100">
                  <PriorityBadge priority={task.priority} />
                  <StatusBadge status={task.status} />
                  {task.assigned_to_name && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <User size={11} /> {task.assigned_to_name}
                    </span>
                  )}
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

      {canManageTasks && (
        <>
          <ConfirmDialog
            open={Boolean(taskToDelete)}
            title="Delete task?"
            message={`This will permanently delete "${taskToDelete?.title}".`}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setTaskToDelete(null)}
            isSubmitting={isDeleting}
          />
          <ConfirmDialog
            open={bulkDeleteOpen}
            title={`Delete ${selectedIds.size} task(s)?`}
            message="This will permanently delete all selected tasks."
            onConfirm={handleBulkDelete}
            onCancel={() => setBulkDeleteOpen(false)}
            isSubmitting={isBulkSubmitting}
          />
        </>
      )}
    </Layout>
  );
}
