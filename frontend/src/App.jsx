import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import FacilitiesPage from './pages/FacilitiesPage';
import DashboardPage from './pages/DashboardPage';
import ResourceMobileView from './pages/ResourceMobileView';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/facilities" element={<FacilitiesPage />} />
        <Route path="/resource/view/:id" element={<ResourceMobileView />} />
        <Route path="*" element={<Navigate to="/" />} />
        <Route path="/dashboard" element={<DashboardPage />} /> {/* Your Module's Route */}      
      </Routes>
    </Router>
  );
}
export default App;