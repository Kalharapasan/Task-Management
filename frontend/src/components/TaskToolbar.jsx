import React from 'react';
import { Search, X } from 'lucide-react';

export default function TaskToolbar({ filters, onChange, onClear }) {
  const { search, status, priority, sort } = filters;
  const hasActiveFilters = search || status || priority || sort !== 'newest';

  return (
    <div className="card p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by task title..."
          className="input-field pl-9"
          value={search}
          onChange={(e) => onChange({ search: e.target.value })}
        />
      </div>

      <select
        className="input-field sm:w-40"
        value={status}
        onChange={(e) => onChange({ status: e.target.value })}
      >
        <option value="">All Statuses</option>
        <option value="Pending">Pending</option>
        <option value="In Progress">In Progress</option>
        <option value="Completed">Completed</option>
      </select>

      <select
        className="input-field sm:w-40"
        value={priority}
        onChange={(e) => onChange({ priority: e.target.value })}
      >
        <option value="">All Priorities</option>
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>

      <select
        className="input-field sm:w-44"
        value={sort}
        onChange={(e) => onChange({ sort: e.target.value })}
      >
        <option value="newest">Newest Created</option>
        <option value="oldest">Oldest Created</option>
        <option value="due_date">Due Date</option>
      </select>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <X size={14} />
          Clear
        </button>
      )}
    </div>
  );
}
