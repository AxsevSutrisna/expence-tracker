import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@features/auth';
import { ProtectedRoute } from './ProtectedRoute';
import LoginPage from '@pages/LoginPage';
import DashboardPage from '@pages/DashboardPage';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
