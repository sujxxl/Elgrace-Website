import React from 'react';
import { BrowserRouter, HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Hero } from './components/Hero';
import { Mission } from './components/Mission';
import { Services } from './components/Services';
import { TalentGallery } from './components/TalentGallery';
import { ContactGrid } from './components/ContactGrid';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { Brands } from './components/Brands';
import { Castings } from './components/Castings';
import { CastingDetail } from './components/CastingDetail';
import { AuthPage } from './components/AuthPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProfileDashboard } from './components/ProfileDashboard';
import { ProfileEdit } from './components/ProfileEdit';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminDashboard } from './components/AdminDashboard';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { TalentProfilePage } from './components/TalentProfilePage';
import { BrandPage } from './components/BrandPage';
import { EventIconPage } from './components/EventIconPage';
import { ElgraceTalentsPage } from './components/ElgraceTalentsPage';
import { ViewKey } from './siteConfig';

const viewToPath = (v: ViewKey) =>
  v === 'home' ? '/' : `/${v}`;

const pathToView = (p: string): ViewKey => {
  if (p.startsWith('/services')) return 'services';
  if (p.startsWith('/talents')) return 'talents';
  if (p.startsWith('/castings')) return 'castings';
  if (p.startsWith('/auth')) return 'auth';
  if (p.startsWith('/profile')) return 'profile';
  if (p.startsWith('/admin') || p.startsWith('/brands')) return 'profile';
  return 'home';
};

const ProfileRouteContent: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }
  return <ProfileDashboard />;
};

const AppRouterContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentView = pathToView(location.pathname);
  const onNavigate = (view: ViewKey) => {
    navigate(viewToPath(view));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-white selection:text-black relative">
      <Navbar onNavigate={onNavigate} currentView={currentView} />

      <Routes>
        <Route
          path="/"
          element={
            <main className="relative z-10">
              <Hero />
              <Mission />
              <Brands />
              <ContactGrid />
            </main>
          }
        />

        <Route
          path="/services"
          element={
            <main className="relative z-10">
              <Services />
              <ContactGrid />
            </main>
          }
        />

        <Route
          path="/services/elgrace-talents"
          element={
            <main className="relative z-10">
              <ElgraceTalentsPage />
              <ContactGrid />
            </main>
          }
        />

        <Route
          path="/services/eventicon"
          element={
            <main className="relative z-10">
              <EventIconPage />
              <ContactGrid />
            </main>
          }
        />

        <Route
          path="/talents"
          element={
            <main className="pt-20 relative z-10">
              <TalentGallery />
              <ContactGrid />
            </main>
          }
        />

        <Route
          path="/talents/:userId"
          element={
            <main className="pt-20 relative z-10">
              <TalentProfilePage />
            </main>
          }
        />

        <Route
          path="/castings"
          element={
            <main className="pt-20 relative z-10">
              <Castings />
            </main>
          }
        />

        <Route
          path="/castings/:castingId"
          element={
            <main className="pt-20 relative z-10">
              <CastingDetail />
            </main>
          }
        />

        <Route
          path="/auth"
          element={
            <ProtectedRoute requireAuth={false} redirectTo="/profile">
              <main className="pt-20 relative z-10">
                <AuthPage />
              </main>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reset-password"
          element={
            <main className="pt-20 relative z-10">
              <ResetPasswordPage />
            </main>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute requireAuth={true}>
              <main className="pt-20 relative z-10">
                <ProfileRouteContent />
              </main>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute requireAuth={true} requireRole="model">
              <main className="pt-20 relative z-10">
                <ProfileEdit />
              </main>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAuth={true} requireRole="admin">
              <main className="pt-20 relative z-10">
                <AdminDashboard />
              </main>
            </ProtectedRoute>
          }
        />

        <Route
          path="/brands/:userId"
          element={
            <ProtectedRoute requireAuth={true} requireRole="admin">
              <main className="pt-20 relative z-10">
                <BrandPage />
              </main>
            </ProtectedRoute>
          }
        />
      </Routes>

      <Footer />
    </div>
  );
};

const AppContent: React.FC = () => (
  // Use HashRouter so refreshing on nested routes (e.g. /services, /talents)
  // does not rely on server-side rewrite rules and avoids 404s on static hosts.
  <HashRouter>
    <AppRouterContent />
  </HashRouter>
);

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;