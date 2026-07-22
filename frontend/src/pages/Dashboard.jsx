import React, { useEffect, useState } from 'react';
import { ListChecks, Clock, Loader2, CheckCircle2, AlertOctagon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import { taskApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const STATUS_COLORS = {
  Pending: '#94a3b8', // slate-400
  'In Progress': '#14b8a6', // teal-500
  Completed: '#22c55e', // green-500 (primary)
};

const PRIORITY_COLORS = {
  Low: '#94a3b8', // slate-400
  Medium: '#f59e0b', // amber-500
  High: '#e11d48', // rose-600
};

export default function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchStats() {
      try {
        const response = await taskApi.getStats();
        if (isMounted) setStats(response.data.data.stats);
      } catch (error) {
        showToast(error.response?.data?.message || 'Failed to load dashboard stats', 'error');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchStats();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome back, {user?.name}
        </h1>
        <p className="text-sm text-slate-500 mt-1">Here&apos;s an overview of your tasks.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} isLoading={isLoading} />
        ))}
      </div>

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
