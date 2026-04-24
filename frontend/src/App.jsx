import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MessagesPage from './pages/MessagesPage';
import PrivacySettingsPage from './pages/PrivacySettingsPage';
import FileUploadPage from './pages/FileUploadPage';
import PasswordResetPage from './pages/PasswordResetPage';
import SecurityLogsPage from './pages/SecurityLogsPage';
import ProfilePage from './pages/ProfilePage';
import FriendsPage from './pages/FriendsPage';
import FeedPage from './pages/FeedPage';
import UserProfilePage from './pages/UserProfilePage';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-navy-950">
          <Navbar />
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/reset-password" element={<PasswordResetPage />} />

            {/* Protected */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
            <Route path="/privacy" element={<ProtectedRoute><PrivacySettingsPage /></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><FileUploadPage /></ProtectedRoute>} />
            <Route path="/security-logs" element={<ProtectedRoute><SecurityLogsPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
            <Route path="/feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
            <Route path="/user/:username" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/feed" replace />} />
            <Route path="*" element={<Navigate to="/feed" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
