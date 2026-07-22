import React from 'react';
import { Trash2, X } from 'lucide-react';

export default function BulkActionBar({ selectedCount, onClear, onBulkStatus, onBulkDelete, isSubmitting }) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-0 z-10 -mx-4 sm:mx-0 mb-4 px-4 sm:px-0">
      <div className="card p-3 flex flex-wrap items-center gap-3 border-primary-200 bg-primary-50/60">
        <button
          type="button"
          onClick={onClear}
          className="p-1.5 rounded-md text-slate-500 hover:bg-white"
          aria-label="Clear selection"
        >
          <X size={16} />
        </button>
        <p className="text-sm font-medium text-slate-700">
          {selectedCount} task{selectedCount > 1 ? 's' : ''} selected
        </p>

        <div className="flex items-center gap-2 ml-auto">
          <select
            className="input-field py-1.5 w-auto text-sm"
            defaultValue=""
            disabled={isSubmitting}
            onChange={(e) => {
              if (e.target.value) {
                onBulkStatus(e.target.value);
                e.target.value = '';
              }
            }}
          >
            <option value="" disabled>
              Mark as...
            </option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <button
            type="button"
            onClick={onBulkDelete}
            disabled={isSubmitting}
            className="btn-danger py-1.5"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
