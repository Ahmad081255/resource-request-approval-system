import { useEffect, useState } from 'react';
import { api } from '../api/client';
import {
  BarChart3,
  TrendingUp,
  Boxes,
  Building2,
  PieChart,
  Download,
  FileSpreadsheet,
  FileJson,
  Printer,
  FileText,
  CheckCircle2
} from 'lucide-react';

const STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  modification_requested: 'Needs Changes'
};

const STATUS_COLORS = {
  pending: 'bg-amber-500',
  approved: 'bg-emerald-500',
  rejected: 'bg-rose-500',
  modification_requested: 'bg-purple-500'
};

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadSuccess, setDownloadSuccess] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [sum, reqs] = await Promise.all([
          api.get('/reports/summary'),
          api.get('/requests').catch(() => [])
        ]);
        setSummary(sum);
        setRequests(reqs);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  function triggerDownload(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(`Downloaded ${filename}`);
    setTimeout(() => setDownloadSuccess(''), 3500);
  }

  // Export 1: Executive Summary Report (CSV)
  function downloadSummaryCSV() {
    if (!summary) return;
    const now = new Date().toISOString();
    let csv = `RRAM - EXECUTIVE RESOURCE MANAGEMENT REPORT\nGenerated At,${now}\nTotal Requests Logged,${summary.total || 0}\n\n`;

    csv += `STATUS BREAKDOWN\nStatus,Count,Percentage\n`;
    const totalVolume = summary.statusCounts.reduce((acc, curr) => acc + curr.count, 0) || 1;
    summary.statusCounts.forEach((s) => {
      const pct = Math.round((s.count / totalVolume) * 100);
      csv += `"${STATUS_LABELS[s.status] || s.status}",${s.count},${pct}%\n`;
    });

    csv += `\nTOP REQUESTED RESOURCES\nResource Name,Request Count,Total Quantity\n`;
    summary.topResources.forEach((r) => {
      csv += `"${r.resource_type.replace(/"/g, '""')}",${r.count},${r.total_quantity}\n`;
    });

    csv += `\nDEPARTMENT REQUISITIONS\nDepartment,Total Requests\n`;
    summary.byDepartment.forEach((d) => {
      csv += `"${(d.department_name || 'Unassigned').replace(/"/g, '""')}",${d.count}\n`;
    });

    triggerDownload(csv, `rram_executive_summary_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
  }

  // Export 2: Detailed Line-by-Line Requests Log (CSV)
  function downloadDetailedRequestsCSV() {
    if (!requests || requests.length === 0) return;
    const headers = ['Request ID', 'Resource', 'Quantity', 'Requester', 'Department', 'Purpose', 'Status', 'Date'];
    const rows = requests.map((r) => [
      r.request_id,
      `"${(r.resource_type || '').replace(/"/g, '""')}"`,
      r.quantity,
      `"${(r.requester_name || '').replace(/"/g, '""')}"`,
      `"${(r.department_name || 'Unassigned').replace(/"/g, '""')}"`,
      `"${(r.purpose || '').replace(/"/g, '""')}"`,
      r.status,
      new Date(r.request_date).toLocaleDateString()
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    triggerDownload(csvContent, `rram_requests_dataset_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
  }

  // Export 3: Raw JSON Structured Report
  function downloadJSONReport() {
    if (!summary) return;
    const payload = {
      report_title: 'RRAM Resource Requisitions Summary',
      generated_at: new Date().toISOString(),
      summary,
      detailed_requests: requests
    };
    triggerDownload(JSON.stringify(payload, null, 2), `rram_report_payload_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  }

  // Export 4: Print/PDF View
  function handlePrintReport() {
    window.print();
  }

  if (loading || !summary) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <span>Generating analytical reports…</span>
      </div>
    );
  }

  const maxStatusCount = Math.max(...summary.statusCounts.map((s) => s.count), 1);
  const totalVolume = summary.statusCounts.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div id="reports-page" className="space-y-6">
      {/* Header & Download Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
            Executive Analytics & Governance
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Reports & Insights</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            High-level overview of requisition throughput, status breakdowns, and resource allocations.
          </p>
        </div>

        {/* Quick Action Download Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="download-summary-csv-btn"
            onClick={downloadSummaryCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 shadow-2xs transition-all cursor-pointer"
            title="Download Summary CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Summary CSV</span>
          </button>

          <button
            id="download-requests-csv-btn"
            onClick={downloadDetailedRequestsCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none transition-all cursor-pointer"
            title="Download Complete Requests Dataset"
          >
            <Download className="w-4 h-4" />
            <span>Export Requests (CSV)</span>
          </button>

          <button
            id="download-json-btn"
            onClick={downloadJSONReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 shadow-2xs transition-all cursor-pointer"
            title="Export JSON Data"
          >
            <FileJson className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>JSON</span>
          </button>

          <button
            id="print-report-btn"
            onClick={handlePrintReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 shadow-2xs transition-all cursor-pointer"
            title="Print or Save as PDF"
          >
            <Printer className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Download Alert Banner */}
      {downloadSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Download Center Panel */}
      <div className="bg-slate-900 dark:bg-slate-900/90 border border-slate-800 text-white rounded-2xl p-6 sm:p-7 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Download className="w-3.5 h-3.5" />
              <span>Export & Compliance Hub</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Download Full Analytical Reports
            </h2>
            <p className="text-xs text-slate-300 dark:text-slate-400 max-w-xl leading-relaxed">
              Export comprehensive logs formatted for spreadsheet analysis, accounting audits, departmental budgeting, and compliance records.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              onClick={downloadDetailedRequestsCSV}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Requisitions Log (.csv)</span>
            </button>
            <button
              onClick={downloadSummaryCSV}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Download Executive Summary (.csv)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Status Distribution & Top Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Requests by Status</h2>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
              Total: {totalVolume}
            </span>
          </div>

          <div className="space-y-4 pt-1">
            {summary.statusCounts.map((s) => {
              const pct = totalVolume > 0 ? Math.round((s.count / totalVolume) * 100) : 0;
              const barColor = STATUS_COLORS[s.status] || 'bg-indigo-600';
              return (
                <div key={s.status} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {STATUS_LABELS[s.status] || s.status}
                    </span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-400 dark:text-slate-500">{pct}%</span>
                      <span className="font-bold text-slate-900 dark:text-white">{s.count}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${(s.count / maxStatusCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Requested Resources Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Boxes className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Top Requested Resources</h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4 font-semibold">Resource</th>
                  <th className="py-3 px-4 font-semibold text-right">Req. Count</th>
                  <th className="py-3 px-4 font-semibold text-right">Total Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {summary.topResources.map((r) => (
                  <tr key={r.resource_type} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {r.resource_type}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-600 dark:text-slate-400">
                      {r.count}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {r.total_quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Department Breakdown Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Requisitions by Department</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {summary.byDepartment.map((d) => (
            <div
              key={d.department_name || 'unassigned'}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all shadow-2xs"
            >
              <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mb-1">
                {d.count}
              </div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
                {d.department_name || 'Unassigned'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
