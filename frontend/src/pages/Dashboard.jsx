import React, { useEffect, useState } from 'react';
import { ListChecks, Clock, Loader2, CheckCircle2, AlertOctagon } from 'lucide-react';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import { taskApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

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
    { label: 'In Progress', value: stats?.inProgress ?? 0, icon: Loader2, color: 'sky' },
    { label: 'Completed', value: stats?.completed ?? 0, icon: CheckCircle2, color: 'emerald' },
    { label: 'Overdue', value: stats?.overdue ?? 0, icon: AlertOctagon, color: 'rose' },
  ];

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome back, {user?.name}
        </h1>
        <p className="text-sm text-slate-500 mt-1">Here&apos;s an overview of your tasks.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} isLoading={isLoading} />
        ))}
      </div>
    </Layout>
  );
}
