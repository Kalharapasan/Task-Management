import React, { useState } from 'react';
import { Calendar, Pencil, Trash2, GripVertical } from 'lucide-react';
import { PriorityBadge } from './Badges';

const COLUMNS = [
  { status: 'Pending', accent: 'border-t-slate-400' },
  { status: 'In Progress', accent: 'border-t-teal-500' },
  { status: 'Completed', accent: 'border-t-emerald-500' },
];

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function isOverdue(task) {
  if (task.status === 'Completed') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(task.due_date) < today;
}

export default function KanbanBoard({ tasks, onStatusChange, onEdit, onDelete }) {
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.status] = tasks.filter((t) => t.status === col.status);
    return acc;
  }, {});

  const handleDrop = (status) => {
    if (draggedId != null) {
      const task = tasks.find((t) => t.id === draggedId);
      if (task && task.status !== status) {
        onStatusChange(task, status);
      }
    }
    setDraggedId(null);
    setDragOverColumn(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {COLUMNS.map((col) => (
        <div
          key={col.status}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverColumn(col.status);
          }}
          onDragLeave={() => setDragOverColumn((prev) => (prev === col.status ? null : prev))}
          onDrop={() => handleDrop(col.status)}
          className={`rounded-xl border-t-4 ${col.accent} bg-slate-50/60 border border-slate-200 p-3 min-h-[16rem] transition-colors ${
            dragOverColumn === col.status ? 'bg-primary-50/60 ring-2 ring-primary-200' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-sm font-semibold text-slate-700">{col.status}</h3>
            <span className="text-xs font-medium text-slate-400 bg-white border border-slate-200 rounded-full px-2 py-0.5">
              {tasksByStatus[col.status].length}
            </span>
          </div>

          <div className="space-y-2">
            {tasksByStatus[col.status].map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={() => setDraggedId(task.id)}
                onDragEnd={() => {
                  setDraggedId(null);
                  setDragOverColumn(null);
                }}
                className={`card p-3 cursor-grab active:cursor-grabbing transition ${
                  draggedId === task.id ? 'opacity-40' : 'hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-2">
                  <GripVertical size={14} className="mt-0.5 text-slate-300 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 leading-snug">{task.title}</p>
                    <div className="flex items-center flex-wrap gap-1.5 mt-2">
                      <PriorityBadge priority={task.priority} />
                      <span
                        className={`inline-flex items-center gap-1 text-xs ${
                          isOverdue(task) ? 'text-rose-600 font-medium' : 'text-slate-500'
                        }`}
                      >
                        <Calendar size={11} />
                        {formatDate(task.due_date)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-1 mt-2 -mb-1 -mr-1">
                  <button
                    type="button"
                    onClick={() => onEdit(task)}
                    className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-primary-600"
                    aria-label={`Edit ${task.title}`}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(task)}
                    className="p-1.5 rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Delete ${task.title}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}

            {tasksByStatus[col.status].length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6 border border-dashed border-slate-200 rounded-lg">
                Drop a task here
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
