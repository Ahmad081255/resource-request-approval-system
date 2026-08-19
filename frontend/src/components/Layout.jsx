import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const isStaff = user.role_name === 'Staff';
  const isApprover = user.role_name === 'Manager' || user.role_name === 'Administrator';
  const isAdmin = user.role_name === 'Administrator';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand">Ledger&amp;Desk</div>
          <div className="brand-sub">Resource Requests</div>
        </div>

        <nav className="nav-group">
          <div className="nav-label">Overview</div>
          <NavLink to="/" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} end>Dashboard</NavLink>
          <NavLink to="/notifications" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Notifications</NavLink>
        </nav>

        <nav className="nav-group">
          <div className="nav-label">Requests</div>
          {isStaff && (
            <NavLink to="/new-request" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Submit Request</NavLink>
          )}
          <NavLink to="/requests" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            {isStaff ? 'My Requests' : 'All Requests'}
          </NavLink>
          {isApprover && (
            <NavLink to="/approvals" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Approvals Queue</NavLink>
          )}
        </nav>

        {isApprover && (
          <nav className="nav-group">
            <div className="nav-label">Insights</div>
            <NavLink to="/reports" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Reports</NavLink>
          </nav>
        )}

        {isAdmin && (
          <nav className="nav-group">
            <div className="nav-label">Administration</div>
            <NavLink to="/admin/users" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Users</NavLink>
            <NavLink to="/admin/departments" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Departments</NavLink>
            <NavLink to="/admin/resources" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Resources</NavLink>
            <NavLink to="/admin/audit" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Audit Trail</NavLink>
          </nav>
        )}

        <div className="sidebar-footer">
          <div className="user-chip">
            <span className="name">{user.full_name}</span>
            <span className="role">{user.role_name}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Log out</button>
        </div>
      </aside>

      <main className="main-area">{children}</main>
    </div>
  );
}
