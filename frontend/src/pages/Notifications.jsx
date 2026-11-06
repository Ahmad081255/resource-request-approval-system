import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Bell, CheckCheck, Inbox, Clock, Mail, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' | 'email-logs'

  async function load() {
    try {
      const [data, logs] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/email-logs').catch(() => [])
      ]);
      setItems(data);
      setEmailLogs(logs || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function markAllRead() {
    await api.patch('/notifications/read-all');
    load();
  }

  async function markRead(id) {
    await api.patch(`/notifications/${id}/read`);
    load();
  }

  async function handleSendTestEmail() {
    setSendingTest(true);
    setTestResult(null);
    try {
      const res = await api.post('/notifications/test-email', {});
      setTestResult({ success: true, message: 'Test notification email dispatched successfully.' });
      const logs = await api.get('/notifications/email-logs');
      setEmailLogs(logs || []);
    } catch (err) {
      setTestResult({ success: false, message: err.message || 'Failed to dispatch test email.' });
    } finally {
      setSendingTest(false);
    }
  }

  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <div id="notifications-page" className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
            System Inbox & Email Alerts
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Notifications</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time in-app alerts and automated email notifications for submissions and approvals.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {unreadCount > 0 && activeTab === 'inbox' && (
            <button
              id="mark-all-read-btn"
              onClick={markAllRead}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Mark all read</span>
            </button>
          )}

          <button
            id="send-test-email-btn"
            onClick={handleSendTestEmail}
            disabled={sendingTest}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{sendingTest ? 'Sending…' : 'Send Test Email'}</span>
          </button>
        </div>
      </div>

      {testResult && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
          testResult.success
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
        }`}>
          {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'inbox'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>In-App Inbox</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500 text-white">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('email-logs')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'email-logs'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Sent Email Alerts</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {emailLogs.length}
          </span>
        </button>
      </div>

      {/* In-App Notifications List */}
      {activeTab === 'inbox' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Loading notifications…</span>
            </div>
          ) : items.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">No notifications</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                You're all caught up with recent updates and alerts.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((n) => (
                <div
                  key={n.notification_id}
                  onClick={() => !n.is_read && markRead(n.notification_id)}
                  className={`p-4 sm:p-5 transition-colors flex items-start gap-3.5 cursor-pointer ${
                    n.is_read
                      ? 'bg-white dark:bg-slate-900 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 opacity-80'
                      : 'bg-indigo-50/40 dark:bg-indigo-950/30 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/50'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      n.is_read
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        : 'bg-indigo-600 text-white shadow-xs shadow-indigo-200 dark:shadow-none'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm ${n.is_read ? 'text-slate-700 dark:text-slate-300' : 'font-semibold text-slate-900 dark:text-white'}`}>
                        {n.message}
                      </p>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-1.5">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Email Notifications Log */}
      {activeTab === 'email-logs' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-500" />
              <span>Automated email alerts are triggered on new requests, approvals, and decisions.</span>
            </div>
          </div>

          {emailLogs.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">No email notifications sent yet</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                Submit a new request or click "Send Test Email" above to trigger an automated notification email.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {emailLogs.map((log) => (
                <div key={log.id} className="p-4 sm:p-5 flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {log.subject}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 shrink-0">
                        {log.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Recipient: <span className="font-mono text-slate-700 dark:text-slate-300">{log.to}</span>
                    </p>
                    {log.text && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg font-mono">
                        {log.text}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-2">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(log.sentAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
