import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import FacilitiesPage from './pages/FacilitiesPage';
import DashboardPage from './pages/DashboardPage';
import ResourceMobileView from './pages/ResourceMobileView';
import BookingsPage from './pages/BookingsPage';
import ProfilePage from './pages/ProfilePage';
import SubmitTicketPage from './pages/SubmitTicketPage';
import TicketsListPage from './pages/TicketsListPage';
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
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/tickets" element={<TicketsListPage />} />
            <Route path="/tickets/new" element={<SubmitTicketPage />} />
            <Route path="/profile" element={<ProfilePage />} />
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
