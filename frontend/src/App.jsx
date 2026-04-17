import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import FacilitiesPage from './pages/FacilitiesPage';
import DashboardPage from './pages/DashboardPage';
import ResourceMobileView from './pages/ResourceMobileView';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages that show Navbar + ThemeToggle
const Layout = () => (
  <>
    <Navbar />
    <Outlet />
  </>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* Layout routes — Navbar + ThemeToggle visible */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/facilities" element={<FacilitiesPage />} />
          </Route>
        </Route>

        {/* Standalone routes — no Navbar */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/resource/view/:id" element={<ResourceMobileView />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
