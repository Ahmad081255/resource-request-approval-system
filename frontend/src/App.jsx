import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import NewRequest from './pages/NewRequest';
import Requests from './pages/Requests';
import Approvals from './pages/Approvals';
import Notifications from './pages/Notifications';
import Reports from './pages/Reports';
import AdminUsers from './pages/admin/Users';
import AdminResources from './pages/admin/Resources';
import AdminDepartments from './pages/admin/Departments';
import AdminAudit from './pages/admin/Audit';

function Protected({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role_name)) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/forgot-password" element={user ? <Navigate to="/" replace /> : <ForgotPassword />} />
      <Route path="/reset-password" element={user ? <Navigate to="/" replace /> : <ResetPassword />} />

      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/new-request" element={<Protected roles={['Staff']}><NewRequest /></Protected>} />
      <Route path="/requests" element={<Protected><Requests /></Protected>} />
      <Route path="/approvals" element={<Protected roles={['Manager', 'Administrator']}><Approvals /></Protected>} />
      <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
      <Route path="/reports" element={<Protected roles={['Manager', 'Administrator']}><Reports /></Protected>} />
      <Route path="/admin/users" element={<Protected roles={['Administrator']}><AdminUsers /></Protected>} />
      <Route path="/admin/resources" element={<Protected roles={['Administrator']}><AdminResources /></Protected>} />
      <Route path="/admin/departments" element={<Protected roles={['Administrator']}><AdminDepartments /></Protected>} />
      <Route path="/admin/audit" element={<Protected roles={['Administrator']}><AdminAudit /></Protected>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
