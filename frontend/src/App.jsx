import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import FacilitiesPage from './pages/FacilitiesPage';
import DashboardPage from './pages/DashboardPage';
import ResourceMobileView from './pages/ResourceMobileView';
import ThemeToggle from './components/ThemeToggle';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <ThemeToggle />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/resource/view/:id" element={<ResourceMobileView />} />

        {/* Protected routes — redirect to / if not authenticated */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/facilities" element={<FacilitiesPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;