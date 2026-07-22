import React, { useEffect, useState } from 'react';
import { ListChecks, Clock, Loader2, CheckCircle2, AlertOctagon, FolderKanban, Shield, Briefcase, User } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import { taskApi, projectApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const STATUS_COLORS = {
  Pending: '#94a3b8',
  'In Progress': '#14b8a6',
  Completed: '#22c55e',
};

const PRIORITY_COLORS = {
  Low: '#94a3b8',
  Medium: '#f59e0b',
  High: '#e11d48',
};

export default function Dashboard() {
  const { user, isAdmin, isTaskManager, canManageProjects } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [projectReport, setProjectReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardData() {
      try {
        const taskStatsRes = await taskApi.getStats();
        if (isMounted) setStats(taskStatsRes.data.data.stats);

        if (canManageProjects) {
          const reportRes = await projectApi.getReport();
          if (isMounted) setProjectReport(reportRes.data.data.report);
        }
      } catch (error) {
        showToast(error.response?.data?.message || 'Failed to load dashboard data', 'error');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchDashboardData();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManageProjects]);

  const cards = [
    { label: 'Total Tasks', value: stats?.total ?? 0, icon: ListChecks, color: 'slate' },
    { label: 'Pending', value: stats?.pending ?? 0, icon: Clock, color: 'amber' },
    { label: 'In Progress', value: stats?.inProgress ?? 0, icon: Loader2, color: 'teal' },
    { label: 'Completed', value: stats?.completed ?? 0, icon: CheckCircle2, color: 'emerald' },
    { label: 'Overdue', value: stats?.overdue ?? 0, icon: AlertOctagon, color: 'rose' },
  ];

  const statusChartData = stats
    ? [
        { name: 'Pending', value: stats.pending },
        { name: 'In Progress', value: stats.inProgress },
        { name: 'Completed', value: stats.completed },
      ].filter((d) => d.value > 0)
    : [];

  const priorityChartData = stats
    ? [
        { name: 'Low', value: stats.byPriority?.Low ?? 0 },
        { name: 'Medium', value: stats.byPriority?.Medium ?? 0 },
        { name: 'High', value: stats.byPriority?.High ?? 0 },
      ]
    : [];

  const hasTasks = (stats?.total ?? 0) > 0;

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Welcome back, {user?.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">Here is your project & task status report overview.</p>
        </div>

        <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          {isAdmin && <><Shield size={13} className="text-rose-600" /> Admin</>}
          {isTaskManager && <><Briefcase size={13} className="text-amber-600" /> Task Manager</>}
          {!isAdmin && !isTaskManager && <><User size={13} className="text-slate-600" /> Employee</>}
        </div>
      </div>

      {/* Task Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} isLoading={isLoading} />
        ))}
      </div>

      {/* Project Status Summary (Admin & Task Manager) */}
      {canManageProjects && projectReport && (
        <div className="card p-5 mb-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <FolderKanban size={20} className="text-primary-400" />
            <h2 className="text-base font-bold">Project Status Report Overview</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-xs text-slate-300">Total Projects</p>
              <p className="text-2xl font-black mt-1 text-white">{projectReport.total}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-xs text-emerald-300">Active</p>
              <p className="text-2xl font-black mt-1 text-emerald-400">{projectReport.active}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-xs text-primary-300">Completed</p>
              <p className="text-2xl font-black mt-1 text-primary-400">{projectReport.completed}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-xs text-amber-300">On Hold</p>
              <p className="text-2xl font-black mt-1 text-amber-400">{projectReport.onHold}</p>
            </div>
          </div>
        </div>
      )}

      {!isLoading && hasTasks && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Tasks by Status</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {statusChartData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2 flex-wrap">
              {statusChartData.map((entry) => (
                <span key={entry.name} className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[entry.name] }}
                  />
                  {entry.name} ({entry.value})
                </span>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Tasks by Priority</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {priorityChartData.map((entry) => (
                      <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
