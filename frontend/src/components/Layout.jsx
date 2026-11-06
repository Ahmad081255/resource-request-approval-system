import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  Bell,
  PlusCircle,
  FileText,
  CheckSquare,
  BarChart3,
  Users,
  Building2,
  Boxes,
  ScrollText,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Briefcase,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const isStaff = user?.role_name === 'Staff';
  const isApprover = user?.role_name === 'Manager' || user?.role_name === 'Administrator';
  const isAdmin = user?.role_name === 'Administrator';

  const linkClass = ({ isActive }) =>
    `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
      isActive
        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-none'
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
    }`;

  const iconClass = (active) =>
    `w-4.5 h-4.5 shrink-0 transition-colors ${
      active ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
    }`;

  // Helper to determine current section title for top bar
  function getSectionTitle() {
    const p = location.pathname;
    if (p === '/') return 'Dashboard';
    if (p === '/new-request') return 'New Resource Request';
    if (p === '/requests') return 'Request Directory';
    if (p === '/approvals') return 'Approval Queue';
    if (p === '/reports') return 'Reports & Analytics';
    if (p === '/notifications') return 'Notifications';
    if (p === '/admin/users') return 'Admin · Users';
    if (p === '/admin/departments') return 'Admin · Departments';
    if (p === '/admin/resources') return 'Admin · Catalogue';
    if (p === '/admin/audit') return 'Admin · Audit Trail';
    return 'Resource Management';
  }

  return (
    <div id="app-layout" className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-200">
      {/* Mobile Top Navigation Header */}
      <header id="mobile-header" className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            L&D
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white text-sm leading-tight">Ledger & Desk</div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400">Resource Requests</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle Button Mobile */}
          <button
            id="mobile-theme-toggle-btn"
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          <button
            id="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside
        id="sidebar"
        className={`${
          mobileMenuOpen ? 'flex' : 'hidden'
        } md:flex flex-col w-full md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 shrink-0 md:sticky md:top-0 md:h-screen z-30 transition-all`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white font-bold text-base shadow-sm shadow-indigo-100 dark:shadow-none">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-base tracking-tight leading-none">Ledger&Desk</div>
              <div className="text-[11px] uppercase font-mono tracking-wider text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                Resource Portal
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          {/* Main Group */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
              Main Menu
            </div>
            <nav className="space-y-1">
              <NavLink to="/" end className={linkClass} onClick={() => setMobileMenuOpen(false)}>
                {({ isActive }) => (
                  <>
                    <LayoutDashboard className={iconClass(isActive)} />
                    <span>Dashboard</span>
                  </>
                )}
              </NavLink>
              <NavLink to="/notifications" className={linkClass} onClick={() => setMobileMenuOpen(false)}>
                {({ isActive }) => (
                  <>
                    <Bell className={iconClass(isActive)} />
                    <span>Notifications</span>
                  </>
                )}
              </NavLink>
            </nav>
          </div>

          {/* Requests Group */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
              Requests & Flow
            </div>
            <nav className="space-y-1">
              {isStaff && (
                <NavLink to="/new-request" className={linkClass} onClick={() => setMobileMenuOpen(false)}>
                  {({ isActive }) => (
                    <>
                      <PlusCircle className={iconClass(isActive)} />
                      <span>New Request</span>
                    </>
                  )}
                </NavLink>
              )}
              <NavLink to="/requests" className={linkClass} onClick={() => setMobileMenuOpen(false)}>
                {({ isActive }) => (
                  <>
                    <FileText className={iconClass(isActive)} />
                    <span>{isStaff ? 'My Requests' : 'All Requests'}</span>
                  </>
                )}
              </NavLink>
              {isApprover && (
                <NavLink to="/approvals" className={linkClass} onClick={() => setMobileMenuOpen(false)}>
                  {({ isActive }) => (
                    <>
                      <CheckSquare className={iconClass(isActive)} />
                      <span>Approvals Queue</span>
                    </>
                  )}
                </NavLink>
              )}
            </nav>
          </div>

          {/* Insights Group */}
          {isApprover && (
            <div>
              <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                Analytics
              </div>
              <nav className="space-y-1">
                <NavLink to="/reports" className={linkClass} onClick={() => setMobileMenuOpen(false)}>
                  {({ isActive }) => (
                    <>
                      <BarChart3 className={iconClass(isActive)} />
                      <span>Reports & Insights</span>
                    </>
                  )}
                </NavLink>
              </nav>
            </div>
          )}

          {/* Administration Group */}
          {isAdmin && (
            <div>
              <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                <span>Administration</span>
              </div>
              <nav className="space-y-1">
                <NavLink to="/admin/users" className={linkClass} onClick={() => setMobileMenuOpen(false)}>
                  {({ isActive }) => (
                    <>
                      <Users className={iconClass(isActive)} />
                      <span>Users & Roles</span>
                    </>
                  )}
                </NavLink>
                <NavLink to="/admin/departments" className={linkClass} onClick={() => setMobileMenuOpen(false)}>
                  {({ isActive }) => (
                    <>
                      <Building2 className={iconClass(isActive)} />
                      <span>Departments</span>
                    </>
                  )}
                </NavLink>
                <NavLink to="/admin/resources" className={linkClass} onClick={() => setMobileMenuOpen(false)}>
                  {({ isActive }) => (
                    <>
                      <Boxes className={iconClass(isActive)} />
                      <span>Catalogue Resources</span>
                    </>
                  )}
                </NavLink>
                <NavLink to="/admin/audit" className={linkClass} onClick={() => setMobileMenuOpen(false)}>
                  {({ isActive }) => (
                    <>
                      <ScrollText className={iconClass(isActive)} />
                      <span>Audit Trail</span>
                    </>
                  )}
                </NavLink>
              </nav>
            </div>
          )}
        </div>

        {/* Sidebar Footer User Profile */}
        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
          <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center uppercase shrink-0">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user?.full_name}</div>
                <div className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">{user?.role_name}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            id="logout-btn"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area with Desktop Top Navigation Header */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Header Bar */}
        <header
          id="desktop-header"
          className="hidden md:flex items-center justify-between px-8 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 sticky top-0 z-20 transition-colors"
        >
          {/* Breadcrumb / Page Context */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider">Portal</span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{getSectionTitle()}</span>
          </div>

          {/* Right Header Controls: Dark Mode Toggle & Quick Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/80 transition-all cursor-pointer shadow-2xs"
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle Dark Mode"
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0" />
                  <span className="text-xs font-mono">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-600 transition-transform" />
                  <span className="text-xs font-mono">Dark</span>
                </>
              )}
            </button>

            {/* Quick Status Pill */}
            <div className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-[11px] font-mono font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>System Online</span>
            </div>
          </div>
        </header>

        {/* Main Viewport */}
        <main id="main-content" className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
