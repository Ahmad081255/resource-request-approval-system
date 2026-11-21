import { useState } from 'react';
import { 
  Printer, 
  FileDown, 
  BookOpen, 
  ShieldCheck, 
  Database, 
  GitBranch, 
  Server, 
  Mail, 
  Key, 
  CheckCircle2, 
  Layers, 
  FileText,
  Sliders,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function Documentation() {
  const [downloadSuccess, setDownloadSuccess] = useState('');
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  async function handleDownloadPDF() {
    setDownloadingPDF(true);
    setDownloadSuccess('');
    try {
      const res = await fetch('/api/documentation/pdf');
      if (!res.ok) throw new Error('PDF generation request failed.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'RRAM_System_Documentation.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadSuccess('PDF manual downloaded successfully.');
      setTimeout(() => setDownloadSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      // Fallback: direct window location
      window.location.href = '/api/documentation/pdf';
    } finally {
      setDownloadingPDF(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  async function handleDownloadMarkdown() {
    try {
      const res = await fetch('/api/documentation/markdown').catch(() => null);
      let content = '';
      if (res && res.ok) {
        content = await res.text();
      } else {
        content = `# RRAM — Resource Request & Approval Management System\nVersion: 1.2.0\nGenerated At: ${new Date().toISOString()}`;
      }
      
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `RRAM_System_Documentation_${new Date().toISOString().split('T')[0]}.md`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadSuccess('Markdown file downloaded successfully.');
      setTimeout(() => setDownloadSuccess(''), 3000);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div id="documentation-view" className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Print-specific style block to ensure pristine PDF output */}
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #0f172a !important;
            font-size: 11pt !important;
          }
          #sidebar, 
          #desktop-header, 
          #mobile-header, 
          .no-print,
          button {
            display: none !important;
          }
          #main-content {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          .print-break-inside {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .print-break-after {
            page-break-after: always;
            break-after: page;
          }
          .print-show {
            display: block !important;
          }
          .doc-card {
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
        }
      `}</style>

      {/* Top Action Bar (hidden when printing) */}
      <div className="no-print bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Official Technical Specification & Manual</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">System Documentation</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Architecture, workflows, database schema, APIs, role permissions, and environment setup.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            id="download-pdf-btn"
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-sm shadow-indigo-200 dark:shadow-none transition-all cursor-pointer"
            title="Download complete system manual as PDF"
          >
            {downloadingPDF ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            <span>{downloadingPDF ? 'Generating PDF…' : 'Download PDF'}</span>
          </button>

          <a
            href="/api/documentation/pdf"
            download="RRAM_System_Documentation.pdf"
            className="no-print hidden sm:inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-slate-800 transition-colors"
            title="Direct link download for PDF"
          >
            <span>Direct PDF Link</span>
          </a>

          <button
            id="download-md-btn"
            onClick={handleDownloadMarkdown}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
            title="Download Markdown documentation file"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>.MD</span>
          </button>

          <button
            id="print-btn"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
            title="Print Document"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Print</span>
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="no-print p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* DOCUMENT PRINT COVER & HEADER (Always visible in print and screen) */}
      <div className="doc-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-2xs print-break-inside">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#0b2038] border border-slate-700/50 flex items-center justify-center p-2 shrink-0 shadow-md">
              <img src="/logo.jpg" alt="RRAM Logo" className="w-full h-full object-contain rounded-lg" />
            </div>
            <div>
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Enterprise Platform Documentation
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                RRAM System Manual
              </h2>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Resource Request & Approval Management · Version 1.2.0
              </div>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 sm:text-right space-y-1">
            <div><strong>Status:</strong> Production Ready</div>
            <div><strong>Date:</strong> {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div><strong>Stack:</strong> React · Node.js · Express · MySQL</div>
          </div>
        </div>

        {/* Quick jump navigation (hidden on print) */}
        <div className="no-print mt-6 pt-2">
          <div className="text-xs font-bold uppercase tracking-wider font-mono text-slate-400 dark:text-slate-500 mb-3">
            Table of Contents
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <a href="#section-1" className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              1. Executive Overview
            </a>
            <a href="#section-2" className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              2. Tech Architecture
            </a>
            <a href="#section-3" className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              3. Roles Matrix
            </a>
            <a href="#section-4" className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              4. Requisition Workflow
            </a>
            <a href="#section-5" className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              5. Database Schema
            </a>
            <a href="#section-6" className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              6. REST API Spec
            </a>
            <a href="#section-7" className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              7. Email Engine
            </a>
            <a href="#section-8" className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              8. Environment Vars
            </a>
          </div>
        </div>
      </div>

      {/* SECTION 1: EXECUTIVE OVERVIEW */}
      <section id="section-1" className="doc-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-2xs print-break-inside space-y-4">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold uppercase tracking-wider">
          <Layers className="w-4 h-4" />
          <span>Section 01</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">1. Executive Summary & Purpose</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          The <strong>Resource Request & Approval Management (RRAM)</strong> system provides an end-to-end digital pipeline for managing corporate and institutional requisitions. It replaces paper memos, spreadsheets, and informal emails with a secure, centralized portal backed by role-based authorization, immediate approvals routing, automated email alerts, and a non-repudiable audit trail.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono mb-1">
              Rigorous Governance
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Clear separation between staff requesting items, managers making decisions, and administrators managing access and catalogues.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono mb-1">
              Instant Alerts
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Dual in-app notifications and branded HTML emails alert managers on submission and staff upon decision.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono mb-1">
              Total Auditability
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Every status shift, remark, user creation, and catalogue edit is permanently recorded in the system audit trail.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2: SYSTEM ARCHITECTURE */}
      <section id="section-2" className="doc-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-2xs print-break-inside space-y-4">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold uppercase tracking-wider">
          <Server className="w-4 h-4" />
          <span>Section 02</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">2. Technology Architecture</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono">
                <th className="py-2.5 pr-4">Layer</th>
                <th className="py-2.5 px-4">Component</th>
                <th className="py-2.5 px-4">Implementation Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              <tr>
                <td className="py-3 pr-4 font-bold text-slate-900 dark:text-white">Frontend Client</td>
                <td className="py-3 px-4 font-mono">React 18 · Tailwind CSS</td>
                <td className="py-3 px-4">Modular SPA, Lucide icons, dark mode theme engine, accessible responsive layouts.</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-bold text-slate-900 dark:text-white">API Server</td>
                <td className="py-3 px-4 font-mono">Express.js (Node.js)</td>
                <td className="py-3 px-4">REST endpoints, JWT bearer authorization middleware, rate-friendly CORS.</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-bold text-slate-900 dark:text-white">Database Engine</td>
                <td className="py-3 px-4 font-mono">MySQL 8.0+ / Resilient Store</td>
                <td className="py-3 px-4">Automatic connection failover to zero-crash in-memory schema store for containerized preview.</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-bold text-slate-900 dark:text-white">Notification Engine</td>
                <td className="py-3 px-4 font-mono">Nodemailer (SMTP)</td>
                <td className="py-3 px-4">HTML formatted emails with direct action links, live in-app inbox and email event log.</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-bold text-slate-900 dark:text-white">Security & Crypto</td>
                <td className="py-3 px-4 font-mono">bcryptjs · JWT</td>
                <td className="py-3 px-4">Salted 10-round password hashing, cryptographically signed tokens with expiration.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 3: ROLES MATRIX */}
      <section id="section-3" className="doc-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-2xs print-break-inside space-y-4">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Section 03</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">3. Role-Based Access Control (RBAC) Matrix</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono">
                <th className="py-2.5 pr-4">Capability / Operation</th>
                <th className="py-2.5 px-4 text-center">Staff</th>
                <th className="py-2.5 px-4 text-center">Manager</th>
                <th className="py-2.5 px-4 text-center">Administrator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              <tr>
                <td className="py-2.5 pr-4 font-medium">Create & Submit Resource Requisition</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">✓</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-medium">View Personal Submitted Requisitions</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">✓</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-medium">View All Organization Requisitions</td>
                <td className="py-2.5 px-4 text-center text-rose-500 font-bold">✗</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">✓</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-medium">Approve / Reject Requisitions</td>
                <td className="py-2.5 px-4 text-center text-rose-500 font-bold">✗</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">✓</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-medium">Executive Analytics & CSV/JSON Exports</td>
                <td className="py-2.5 px-4 text-center text-rose-500 font-bold">✗</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">✓</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-medium">Manage Catalogue Resources</td>
                <td className="py-2.5 px-4 text-center text-rose-500 font-bold">✗</td>
                <td className="py-2.5 px-4 text-center text-rose-500 font-bold">✗</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">✓</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-medium">User Management & Status Toggles</td>
                <td className="py-2.5 px-4 text-center text-rose-500 font-bold">✗</td>
                <td className="py-2.5 px-4 text-center text-rose-500 font-bold">✗</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">✓</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-medium">Department Configuration</td>
                <td className="py-2.5 px-4 text-center text-rose-500 font-bold">✗</td>
                <td className="py-2.5 px-4 text-center text-rose-500 font-bold">✗</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">✓</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-medium">Immutable Audit Trail Logs</td>
                <td className="py-2.5 px-4 text-center text-rose-500 font-bold">✗</td>
                <td className="py-2.5 px-4 text-center text-rose-500 font-bold">✗</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">✓</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 4: REQUISITION WORKFLOW */}
      <section id="section-4" className="doc-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-2xs print-break-inside space-y-4">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold uppercase tracking-wider">
          <GitBranch className="w-4 h-4" />
          <span>Section 04</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">4. Requisition Lifecycle & Workflow</h3>
        
        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">1</span>
            <div>
              <strong className="text-slate-900 dark:text-white">Submission Phase:</strong> A staff user selects a catalogue item (or custom resource), specifies the required quantity, and writes a justification purpose. The database creates a record with status <code className="font-mono text-amber-600 dark:text-amber-400">pending</code>.
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">2</span>
            <div>
              <strong className="text-slate-900 dark:text-white">Notification Broadcast:</strong> An in-app alert is generated for all active Managers and Administrators, and an automated HTML notification email is dispatched containing full requisition details and direct review button.
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">3</span>
            <div>
              <strong className="text-slate-900 dark:text-white">Managerial Review:</strong> An approver opens the Approvals Queue (<code className="font-mono">/approvals</code>), reviews the justification, and selects an action:
              <ul className="list-disc pl-5 mt-1.5 space-y-1">
                <li><strong className="text-emerald-600">Approve:</strong> Request marked as approved; approval recorded in audit logs.</li>
                <li><strong className="text-rose-600">Reject:</strong> Request marked as rejected with mandatory or optional explanatory remarks.</li>
                <li><strong className="text-amber-600">Request Modification:</strong> Staff is prompted with remarks to revise requisition specs.</li>
              </ul>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">4</span>
            <div>
              <strong className="text-slate-900 dark:text-white">Decision Notification:</strong> Requester is immediately notified via in-app notification and an automated update email with approver remarks and badge.
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: DATABASE SCHEMA */}
      <section id="section-5" className="doc-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-2xs print-break-inside space-y-4">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold uppercase tracking-wider">
          <Database className="w-4 h-4" />
          <span>Section 05</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">5. Database Schema & Data Dictionary</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
            <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 mb-2">users</div>
            <ul className="space-y-1 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
              <li><strong className="text-slate-900 dark:text-white">user_id</strong> (INT, PK, AUTO_INC)</li>
              <li>username (VARCHAR, UNIQUE)</li>
              <li>password_hash (VARCHAR)</li>
              <li>email (VARCHAR, UNIQUE)</li>
              <li>full_name (VARCHAR)</li>
              <li>role_id (INT, FK -&gt; roles.role_id)</li>
              <li>department_id (INT, FK -&gt; departments)</li>
              <li>status (ENUM: 'active', 'inactive')</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
            <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 mb-2">requests</div>
            <ul className="space-y-1 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
              <li><strong className="text-slate-900 dark:text-white">request_id</strong> (INT, PK, AUTO_INC)</li>
              <li>user_id (INT, FK -&gt; users.user_id)</li>
              <li>resource_type (VARCHAR)</li>
              <li>resource_id (INT, NULLABLE)</li>
              <li>quantity (INT)</li>
              <li>purpose (TEXT)</li>
              <li>status ('pending', 'approved', 'rejected')</li>
              <li>request_date (DATETIME)</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
            <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 mb-2">approvals</div>
            <ul className="space-y-1 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
              <li><strong className="text-slate-900 dark:text-white">approval_id</strong> (INT, PK, AUTO_INC)</li>
              <li>request_id (INT, FK -&gt; requests.request_id)</li>
              <li>approver_id (INT, FK -&gt; users.user_id)</li>
              <li>decision ('approved', 'rejected', etc.)</li>
              <li>remarks (TEXT)</li>
              <li>decision_date (DATETIME)</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
            <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 mb-2">audit_logs & notifications</div>
            <ul className="space-y-1 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
              <li><strong className="text-slate-900 dark:text-white">audit_logs</strong>: log_id, user_id, action, details, timestamp, ip_address</li>
              <li><strong className="text-slate-900 dark:text-white">notifications</strong>: notification_id, user_id, request_id, type, message, is_read, created_at</li>
              <li><strong className="text-slate-900 dark:text-white">resources</strong>: resource_id, name, category, available_quantity, unit</li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 6: REST API SPEC */}
      <section id="section-6" className="doc-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-2xs print-break-inside space-y-4">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold uppercase tracking-wider">
          <FileText className="w-4 h-4" />
          <span>Section 06</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">6. REST API Endpoints Reference</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono">
                <th className="py-2.5 pr-3">Method</th>
                <th className="py-2.5 px-3">Endpoint</th>
                <th className="py-2.5 px-3">Access Level</th>
                <th className="py-2.5 px-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
              <tr>
                <td className="py-2 pr-3 text-indigo-600 font-bold">POST</td>
                <td className="py-2 px-3">/api/auth/login</td>
                <td className="py-2 px-3 text-slate-500">Public</td>
                <td className="py-2 px-3 font-sans">Authenticate credentials, return JWT</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 text-indigo-600 font-bold">POST</td>
                <td className="py-2 px-3">/api/auth/register</td>
                <td className="py-2 px-3 text-slate-500">Public</td>
                <td className="py-2 px-3 font-sans">Self-register staff member account</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 text-emerald-600 font-bold">GET</td>
                <td className="py-2 px-3">/api/requests</td>
                <td className="py-2 px-3 text-indigo-600">Authenticated</td>
                <td className="py-2 px-3 font-sans">List requisitions (scoped by role)</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 text-indigo-600 font-bold">POST</td>
                <td className="py-2 px-3">/api/requests</td>
                <td className="py-2 px-3 text-indigo-600">Staff</td>
                <td className="py-2 px-3 font-sans">Submit requisition, triggers emails</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 text-indigo-600 font-bold">POST</td>
                <td className="py-2 px-3">/api/requests/:id/decision</td>
                <td className="py-2 px-3 text-amber-600 font-semibold">Manager+</td>
                <td className="py-2 px-3 font-sans">Record approval/rejection decision</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 text-emerald-600 font-bold">GET</td>
                <td className="py-2 px-3">/api/reports/summary</td>
                <td className="py-2 px-3 text-amber-600 font-semibold">Manager+</td>
                <td className="py-2 px-3 font-sans">Aggregate analytics for dashboard and exports</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 text-indigo-600 font-bold">POST</td>
                <td className="py-2 px-3">/api/resources</td>
                <td className="py-2 px-3 text-rose-600 font-semibold">Admin Only</td>
                <td className="py-2 px-3 font-sans">Add new catalogue item</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 text-emerald-600 font-bold">GET</td>
                <td className="py-2 px-3">/api/users</td>
                <td className="py-2 px-3 text-rose-600 font-semibold">Admin Only</td>
                <td className="py-2 px-3 font-sans">Directory of users, roles, and status</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 7: EMAIL ENGINE */}
      <section id="section-7" className="doc-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-2xs print-break-inside space-y-4">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold uppercase tracking-wider">
          <Mail className="w-4 h-4" />
          <span>Section 07</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">7. Automated Email Notification Engine</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          The email notification engine is powered by <code className="font-mono text-xs">nodemailer</code> and is pre-configured with responsive, branded HTML templates featuring executive headers, status badges, and direct navigation links:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
            <strong className="text-slate-900 dark:text-white block mb-1">New Requisition Alert</strong>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              Sent to active Managers and Admins with requester name, item, quantity, purpose, and review button.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
            <strong className="text-slate-900 dark:text-white block mb-1">Decision Notification</strong>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              Sent to the requester immediately when a manager marks a request approved, rejected, or modified.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
            <strong className="text-slate-900 dark:text-white block mb-1">Password Recovery</strong>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              Dispatches a secure, single-use reset token valid for 1 hour with a direct password renewal link.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 8: CONFIGURATION & DEMO ACCOUNTS */}
      <section id="section-8" className="doc-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-2xs print-break-inside space-y-4">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold uppercase tracking-wider">
          <Sliders className="w-4 h-4" />
          <span>Section 08</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">8. Configuration & Demo Accounts</h3>

        <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-xs">
          <div className="font-bold font-mono uppercase tracking-wider text-indigo-900 dark:text-indigo-300 mb-2 flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-600" />
            <span>Pre-Seeded Demonstration Logins (Password: Password123)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="font-bold text-slate-900 dark:text-white">Administrator</div>
              <div className="font-mono text-slate-500 text-[11px]">username: admin</div>
            </div>
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="font-bold text-slate-900 dark:text-white">Manager</div>
              <div className="font-mono text-slate-500 text-[11px]">username: manager</div>
            </div>
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="font-bold text-slate-900 dark:text-white">Staff Member</div>
              <div className="font-mono text-slate-500 text-[11px]">username: staff</div>
            </div>
          </div>
        </div>
      </section>

      {/* PRINT-ONLY FOOTER */}
      <div className="hidden print-show text-center pt-8 border-t border-slate-200 text-xs text-slate-400 font-mono">
        RRAM System Manual · Generated on {new Date().toLocaleString()} · Confidential & Proprietary
      </div>
    </div>
  );
}
