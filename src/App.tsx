import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FirewallProvider } from './context/FirewallContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Members from './pages/Members';
import Settings from './pages/Settings';
import Teams from './pages/Teams';
import TeamDetail from './pages/TeamDetail';
import Tasks from './pages/Tasks';
import Files from './pages/Files';
import ActivityLogs from './pages/ActivityLogs';

// Layout
import Sidebar from './components/shared/Sidebar';
import Topbar from './components/shared/Topbar';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          <p className="text-sm font-medium tracking-wide text-slate-400">Loading TaskFlow...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Admin Protection Route Wrapper
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  // Check if profile has is_admin set to true
  if (!user || !(user as any).is_admin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Main Dashboard Shell
const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-slate-100/40 dark:bg-slate-900/30 p-6 md:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/project/:projectId" element={<ProjectDetail />} />
            <Route path="/members" element={<Members />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/team/:teamId" element={<TeamDetail />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/files" element={<Files />} />
            <Route path="/activity" element={<ActivityLogs />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <FirewallProvider>
            <WorkspaceProvider>
              <Routes>
                {/* Auth Portals */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Dashboard Workspace */}
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </WorkspaceProvider>
          </FirewallProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
