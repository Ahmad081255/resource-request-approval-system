import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  CheckCheck,
  Inbox,
  Clock,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Settings,
  ShieldCheck,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Sliders,
  Sparkles
} from 'lucide-react';

export default function Notifications() {
  const { user } = useAuth();
  const isAdminOrManager = user?.role_name === 'Administrator' || user?.role_name === 'Manager';

  const [items, setItems] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' | 'email-logs' | 'mailtrap-setup'

  // Mailtrap & SMTP Config State
  const [config, setConfig] = useState({
    host: 'sandbox.smtp.mailtrap.io',
    port: 2525,
    secure: false,
    user: '',
    pass: '',
    from: '"RRAM Notifications" <notifications@rram-portal.com>',
    isConfigured: false,
    isMailtrap: true,
    provider: 'Local Simulator'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [configVerifying, setConfigVerifying] = useState(false);
  const [configMessage, setConfigMessage] = useState(null);
  const [sampleSending, setSampleSending] = useState(null);

  async function load() {
    try {
      const [notifs, logs, mailtrapData] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/email-logs').catch(() => []),
        api.get('/notifications/mailtrap-config').catch(() => null)
      ]);
      setItems(Array.isArray(notifs) ? notifs : []);
      setEmailLogs(Array.isArray(logs) ? logs : []);
      if (mailtrapData) {
        setConfig(prev => ({
          ...prev,
          ...mailtrapData,
          pass: '' // Keep password input clean for security
        }));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

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
      setTestResult({
        success: true,
        message: 'Test notification email dispatched successfully! Delivered to Mailtrap outbox.'
      });
      const logs = await api.get('/notifications/email-logs');
      setEmailLogs(logs || []);
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to dispatch test email.'
      });
    } finally {
      setSendingTest(false);
    }
  }

  async function handleVerifyMailtrap() {
    setConfigVerifying(true);
    setConfigMessage(null);
    try {
      const res = await api.post('/notifications/mailtrap-verify', {
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.user,
        pass: config.pass
      });
      setConfigMessage({
        success: true,
        text: res.message || 'Handshake successful! Mailtrap SMTP connection verified.'
      });
    } catch (err) {
      setConfigMessage({
        success: false,
        text: err.message || 'Connection failed. Please check your Mailtrap Username and Password.'
      });
    } finally {
      setConfigVerifying(false);
    }
  }

  async function handleSaveMailtrap() {
    setConfigSaving(true);
    setConfigMessage(null);
    try {
      const payload = {
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.user,
        from: config.from
      };
      if (config.pass) payload.pass = config.pass;

      const res = await api.post('/notifications/mailtrap-config', payload);
      setConfigMessage({
        success: true,
        text: 'Mailtrap configuration saved successfully! Emails are now active.'
      });
      if (res.config) {
        setConfig(prev => ({ ...prev, ...res.config, pass: '' }));
      }
    } catch (err) {
      setConfigMessage({
        success: false,
        text: err.message || 'Failed to save configuration.'
      });
    } finally {
      setConfigSaving(false);
    }
  }

  async function handleSendSample(eventType) {
    setSampleSending(eventType);
    setConfigMessage(null);
    try {
      const res = await api.post('/notifications/send-sample-event', { eventType });
      setConfigMessage({
        success: true,
        text: res.message || `Sample ${eventType} email sent to Mailtrap!`
      });
      const logs = await api.get('/notifications/email-logs');
      setEmailLogs(logs || []);
    } catch (err) {
      setConfigMessage({
        success: false,
        text: err.message || 'Failed to send sample email.'
      });
    } finally {
      setSampleSending(null);
    }
  }

  function applyMailtrapPresets() {
    setConfig(prev => ({
      ...prev,
      host: 'sandbox.smtp.mailtrap.io',
      port: 2525,
      secure: false,
      from: '"RRAM Notifications" <notifications@rram-portal.com>'
    }));
  }

  const unreadCount = items.filter(n => !n.is_read).length;

  return (
    <div id="notifications-page" className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            <span>Email Alerts & In-App Notifications</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Notifications & Mailtrap
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Automated email alerts for requisitions, approvals, and rejections delivered via Mailtrap.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
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
            <span>{sendingTest ? 'Sending…' : 'Send Test Alert'}</span>
          </button>
        </div>
      </div>

      {testResult && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            testResult.success
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'inbox'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
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
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'email-logs'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Sent Email Alerts (Outbox)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {emailLogs.length}
          </span>
        </button>

        {isAdminOrManager && (
          <button
            onClick={() => setActiveTab('mailtrap-setup')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'mailtrap-setup'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Mailtrap Setup & Testing</span>
            {config.isConfigured ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Connected" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-500" title="Simulation Mode" />
            )}
          </button>
        )}
      </div>

      {/* 1. In-App Notifications List */}
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
              {items.map(n => (
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
                      <p
                        className={`text-sm ${
                          n.is_read
                            ? 'text-slate-700 dark:text-slate-300'
                            : 'font-semibold text-slate-900 dark:text-white'
                        }`}
                      >
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

      {/* 2. Sent Email Alerts (Outbox) */}
      {activeTab === 'email-logs' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-500" />
              <span>
                All notification emails sent to Managers, Administrators, and Staff via Mailtrap.
              </span>
            </div>
            <button
              onClick={() => api.get('/notifications/email-logs').then(l => setEmailLogs(l || []))}
              className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          {emailLogs.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                No email notifications sent yet
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                Submit a new request, approve/reject a request, or use the Mailtrap Testing tab to trigger emails.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {emailLogs.map(log => {
                const isApproved = log.eventType === 'request_approved';
                const isRejected = log.eventType === 'request_rejected';
                const isMod = log.eventType === 'modification_requested';

                return (
                  <div key={log.id} className="p-4 sm:p-5 flex items-start gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isApproved
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                          : isRejected
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                          : isMod
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                          : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                      }`}
                    >
                      {isApproved ? (
                        <ThumbsUp className="w-4 h-4" />
                      ) : isRejected ? (
                        <ThumbsDown className="w-4 h-4" />
                      ) : (
                        <Mail className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {log.subject}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                              isApproved
                                ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                                : isRejected
                                ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                                : isMod
                                ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                                : 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
                            }`}
                          >
                            {log.eventType || 'Alert'}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {log.provider || 'Mailtrap'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Recipient: <span className="font-mono text-slate-800 dark:text-slate-200">{log.to}</span>
                      </p>
                      {log.text && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg font-mono line-clamp-3">
                          {log.text}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-2">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(log.sentAt).toLocaleString()}</span>
                        <span>·</span>
                        {log.status === 'failed' ? (
                          <span className="text-rose-600 dark:text-rose-400 font-semibold">
                            Failed: {log.error || 'SMTP error'}
                          </span>
                        ) : log.isMailtrap ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            Delivered to Mailtrap
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">
                            Simulated (Configure Mailtrap to send live)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. Mailtrap Setup & Testing */}
      {isAdminOrManager && activeTab === 'mailtrap-setup' && (
        <div className="space-y-6">
          {/* Status Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    config.isConfigured
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Mailtrap SMTP Service Status
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono uppercase ${
                        config.isConfigured
                          ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {config.isConfigured ? 'Connected to Mailtrap' : 'Simulation Mode'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {config.isConfigured
                      ? `Active host: ${config.host}:${config.port} (user: ${config.user})`
                      : 'Enter your Mailtrap credentials below to deliver emails straight to your Mailtrap Sandbox inbox.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={applyMailtrapPresets}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                <span>Reset to Mailtrap Sandbox Presets</span>
              </button>
            </div>
          </div>

          {configMessage && (
            <div
              className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 ${
                configMessage.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
              }`}
            >
              {configMessage.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{configMessage.text}</span>
            </div>
          )}

          {/* Quick Workflow Email Tester */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Live Notification Testing: Approvals, Rejections & Requests
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Click any button below to instantly trigger a formatted notification email and verify it inside your Mailtrap Sandbox inbox:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleSendSample('request_submitted')}
                disabled={sampleSending !== null}
                className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/40 transition-colors text-left cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>New Request</span>
                  </span>
                  <span className="text-[10px] font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                    {sampleSending === 'request_submitted' ? 'Sending…' : 'Trigger'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Email sent to all Managers & Admins when a new requisition is created.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleSendSample('approved')}
                disabled={sampleSending !== null}
                className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 transition-colors text-left cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Approval Notice</span>
                  </span>
                  <span className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {sampleSending === 'approved' ? 'Sending…' : 'Trigger'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Email sent to the Requester confirming their requisition was approved.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleSendSample('rejected')}
                disabled={sampleSending !== null}
                className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-100/60 dark:hover:bg-rose-900/40 transition-colors text-left cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-rose-950 dark:text-rose-200 flex items-center gap-1.5">
                    <ThumbsDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span>Rejection Notice</span>
                  </span>
                  <span className="text-[10px] font-mono font-semibold text-rose-600 dark:text-rose-400">
                    {sampleSending === 'rejected' ? 'Sending…' : 'Trigger'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Email sent to the Requester with detailed remarks explaining why it was rejected.
                </p>
              </button>
            </div>
          </div>

          {/* Credentials Form */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Mailtrap Connection Settings
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Configure your Mailtrap credentials below. These are stored in your TiDB Cloud database and take effect immediately.
            </p>

            <form
              onSubmit={e => {
                e.preventDefault();
                handleSaveMailtrap();
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={config.host}
                    onChange={e => setConfig({ ...config, host: e.target.value })}
                    placeholder="sandbox.smtp.mailtrap.io"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Port
                  </label>
                  <input
                    type="number"
                    value={config.port}
                    onChange={e => setConfig({ ...config, port: Number(e.target.value) })}
                    placeholder="2525"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mailtrap Username
                  </label>
                  <input
                    type="text"
                    value={config.user}
                    onChange={e => setConfig({ ...config, user: e.target.value })}
                    placeholder="e.g. 45f8a912e73bcd"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mailtrap Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={config.pass}
                      onChange={e => setConfig({ ...config, pass: e.target.value })}
                      placeholder={config.hasPassword ? '•••••••••••• (Leave blank to keep current)' : 'e.g. 7d81ef39a04b12'}
                      className="w-full px-3.5 py-2 pr-10 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sender Email (From)
                </label>
                <input
                  type="text"
                  value={config.from}
                  onChange={e => setConfig({ ...config, from: e.target.value })}
                  placeholder='"RRAM Notifications" <notifications@rram-portal.com>'
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleVerifyMailtrap}
                    disabled={configVerifying || !config.user}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${configVerifying ? 'animate-spin' : ''}`} />
                    <span>{configVerifying ? 'Testing…' : 'Test SMTP Connection'}</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={configSaving || !config.user}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{configSaving ? 'Saving…' : 'Save Mailtrap Configuration'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Mailtrap Guide Card */}
          <div className="p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-2 flex items-center gap-1.5">
              <Mail className="w-4 h-4" />
              <span>How to find your Mailtrap Credentials</span>
            </h4>
            <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-decimal pl-4">
              <li>Log in to your account at <strong>mailtrap.io</strong>.</li>
              <li>Navigate to <strong>Email Testing</strong> &rarr; <strong>Inboxes</strong> (select or create an inbox like "My Inbox").</li>
              <li>Under <strong>SMTP Settings</strong>, look for <strong>Host: sandbox.smtp.mailtrap.io</strong>, <strong>Port: 2525</strong>.</li>
              <li>Copy your assigned <strong>Username</strong> and <strong>Password</strong>.</li>
              <li>Paste them into the fields above and click <strong>Save Mailtrap Configuration</strong>.</li>
            </ol>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-indigo-100 dark:border-indigo-900/40">
              Once saved, whenever any user submits a request, or whenever an administrator or manager approves, rejects, or requests modifications on a requisition, an email notification will immediately appear in your Mailtrap inbox with complete HTML styling!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
