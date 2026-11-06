import React from 'react';

const LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  modification_requested: 'Needs Changes',
  available: 'Available',
  unavailable: 'Unavailable',
  active: 'Active',
  inactive: 'Inactive'
};

const STYLES = {
  pending: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60 ring-amber-500/10',
  approved: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60 ring-emerald-500/10',
  rejected: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60 ring-rose-500/10',
  modification_requested: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60 ring-purple-500/10',
  available: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60 ring-emerald-500/10',
  unavailable: 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 ring-slate-500/10',
  active: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60 ring-emerald-500/10',
  inactive: 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 ring-slate-500/10'
};

const DOT_STYLES = {
  pending: 'bg-amber-500',
  approved: 'bg-emerald-500',
  rejected: 'bg-rose-500',
  modification_requested: 'bg-purple-500',
  available: 'bg-emerald-500',
  unavailable: 'bg-slate-400',
  active: 'bg-emerald-500',
  inactive: 'bg-slate-400'
};

export default function Stamp({ status, size = 'md' }) {
  const style = STYLES[status] || 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 ring-slate-500/10';
  const dot = DOT_STYLES[status] || 'bg-slate-400';
  const label = LABELS[status] || status;

  const sizeClass = size === 'sm' 
    ? 'px-2 py-0.5 text-[11px] font-medium'
    : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      id={`stamp-${status}`}
      className={`inline-flex items-center gap-1.5 rounded-full border ring-1 tracking-wide uppercase font-mono shadow-xs ${sizeClass} ${style}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      <span>{label}</span>
    </span>
  );
}
