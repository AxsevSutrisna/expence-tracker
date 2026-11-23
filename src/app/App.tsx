import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@features/auth';
import { ProtectedRoute } from './ProtectedRoute';
import { Loading } from '@shared/ui';
import LoginPage from '@pages/LoginPage';
import DashboardPage from '@pages/DashboardPage';

// Route sekunder dimuat on-demand agar tidak membebani bundle awal.
const PlannerPage = lazy(() => import('@pages/PlannerPage'));
const SavingsPage = lazy(() => import('@pages/SavingsPage'));

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
          <Route
            path="/planner"
            element={
              <ProtectedRoute>
                <Suspense fallback={<Loading />}>
                  <PlannerPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/savings"
            element={
              <ProtectedRoute>
                <Suspense fallback={<Loading />}>
                  <SavingsPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
