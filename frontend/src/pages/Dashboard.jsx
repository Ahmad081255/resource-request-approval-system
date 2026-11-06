import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import Stamp from '../components/Stamp';
import {
  Clock,
  CheckCircle2,
  XCircle,
  FileQuestion,
  PlusCircle,
  ArrowRight,
  Boxes,
  TrendingUp,
  Inbox
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [dash, reqs] = await Promise.all([
          api.get('/users/dashboard/stats'),
          api.get('/requests')
        ]);
        setStats(dash);
        setRecent(reqs.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const isStaff = user.role_name === 'Staff';

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 text-sm">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-3" />
        <span>Loading workspace dashboard…</span>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Pending Review',
      count: stats?.pending || 0,
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-900/50'
    },
    {
      title: 'Approved Requisitions',
      count: stats?.approved || 0,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/50'
    },
    {
      title: 'Modifications Needed',
      count: stats?.modification_requested || 0,
      icon: FileQuestion,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200/80 dark:border-purple-900/50'
    },
    {
      title: 'Rejected',
      count: stats?.rejected || 0,
      icon: XCircle,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-900/50'
    }
  ];

  return (
    <div id="dashboard-page" className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
            Overview · {user.role_name} Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome back, {user.full_name.split(' ')[0]}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isStaff
              ? 'Track your submitted resource requests and review responses from department managers.'
              : 'Review pending requests, oversee organizational resources, and track approval workflows.'}
          </p>
        </div>

        {isStaff && (
          <Link
            id="new-request-quick-btn"
            to="/new-request"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none transition-all self-start sm:self-auto cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Request</span>
          </Link>
        )}
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between transition-all"
            >
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                  {card.title}
                </p>
                <p className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white mt-1.5">
                  {card.count}
                </p>
              </div>
              <div className={`p-3 rounded-xl border ${card.bg} ${card.color} shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Department Breakdown if Approver/Admin */}
      {stats?.byDepartment && stats.byDepartment.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Requisitions by Department</h2>
            <Link to="/reports" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
              <span>View Full Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {stats.byDepartment.map((d) => (
              <div key={d.department_name} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{d.department_name}</span>
                <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">{d.count} reqs</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Requests Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Activity</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Latest submitted requisitions in the system</p>
          </div>
          <Link
            to="/requests"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors"
          >
            <span>See all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Inbox className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No recent requests found</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Submit a new request to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4 font-semibold">ID</th>
                  <th className="py-3 px-4 font-semibold">Resource Details</th>
                  {!isStaff && <th className="py-3 px-4 font-semibold">Requester</th>}
                  <th className="py-3 px-4 font-semibold">Qty</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                {recent.map((r) => (
                  <tr key={r.request_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-400 dark:text-slate-500">
                      #{r.request_id}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {r.resource_type}
                    </td>
                    {!isStaff && (
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        {r.requester_name}
                      </td>
                    )}
                    <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {r.quantity}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                      {new Date(r.request_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <Stamp status={r.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
