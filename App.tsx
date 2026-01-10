import React from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
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
import { GalleryPage } from './components/GalleryPage';
import { siteConfig, RouteKey, ViewKey } from './siteConfig';
import { TalentOnboardingPage } from './components/TalentOnboardingPage';
import { ensureBrandProfileForUser, getProfileByUserId } from './services/ProfileService';
import TestSession from './components/TestSession';

const viewToPath = (v: ViewKey) =>
  v === 'home' ? '/' : `/${v}`;

const pathToView = (p: string): ViewKey => {
  if (p.startsWith('/services')) return 'services';
  if (p.startsWith('/talents')) return 'talents';
  if (p.startsWith('/gallery')) return 'gallery';
  if (p.startsWith('/castings')) return 'castings';
  if (p.startsWith('/auth')) return 'auth';
  if (p.startsWith('/profile')) return 'profile';
  if (p.startsWith('/admin') || p.startsWith('/brands')) return 'profile';
  return 'home';
};

const DisabledRouteGate: React.FC<{
  route: RouteKey;
  children: React.ReactNode;
  allowAdmin?: boolean;
  allowAuthed?: boolean;
  redirectTo?: string;
}> = ({ route, children, allowAdmin = true, allowAuthed = false, redirectTo = '/' }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  const isEnabled = siteConfig.routes[route] === 1;
  const isAdmin = user?.role === 'admin';
  const isAuthed = !!user;

  if (isEnabled) return <>{children}</>;
  if (allowAdmin && isAdmin) return <>{children}</>;
  if (allowAuthed && isAuthed) return <>{children}</>;

  return <Navigate to={redirectTo} replace />;
};

const AppRouterContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [profileIncomplete, setProfileIncomplete] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!user) {
        setProfileIncomplete(false);
        return;
      }

      try {
        if (user.role === 'model') {
          // Check if profile exists (do NOT create stub)
          const profile = await getProfileByUserId(user.id);
          if (cancelled) return;
          // If profile doesn't exist or has no status, they need to complete onboarding
          setProfileIncomplete(!profile || !profile.status);
        } else if (user.role === 'client') {
          await ensureBrandProfileForUser(user.id, user.email);
          if (cancelled) return;
          setProfileIncomplete(false);
        } else {
          setProfileIncomplete(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('ensure profile at login failed', err);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [user, location.pathname]);

  const currentView = pathToView(location.pathname);
  const onNavigate = (view: ViewKey) => {
    navigate(viewToPath(view));
  };

  const isDarkShell = currentView === 'home' || currentView === 'services';
  const isDarkContact = isDarkShell;
  const navbarVariant = isDarkShell ? 'dark' : 'light';

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('theme-dark', isDarkShell);
    return () => {
      root.classList.remove('theme-dark');
    };
  }, [isDarkShell]);

  const showProfileHint = user && user.role === 'model' && profileIncomplete;

  return (
    <div
      className={`min-h-screen selection:bg-[#c9a961] selection:text-[#111827] relative ${
        isDarkShell
          ? 'bg-zinc-950 text-white selection:bg-white/15 selection:text-white'
          : 'bg-[#fbf3e4] text-[#111827] theme-light'
      }`}
    >
      <Navbar
        onNavigate={onNavigate}
        currentView={currentView}
        showProfileHint={!!showProfileHint}
        variant={navbarVariant}
      />

      <div className="pt-16">
      <Routes>
        <Route
          path="/"
          element={
            <main className="relative z-10">
              <Hero />
              <Mission />
              <Brands />
              <ContactGrid variant={isDarkContact ? 'dark' : 'light'} />
            </main>
          }
        />

        <Route
          path="/services"
          element={
            <DisabledRouteGate route="services">
              <main className="relative z-10">
                <Services />
                <ContactGrid variant={isDarkContact ? 'dark' : 'light'} />
              </main>
            </DisabledRouteGate>
          }
        />

        <Route
          path="/services/elgrace-talents"
          element={
            <DisabledRouteGate route="services_elgrace_talents">
              <main className="relative z-10">
                <ElgraceTalentsPage />
                <ContactGrid variant={isDarkContact ? 'dark' : 'light'} />
              </main>
            </DisabledRouteGate>
          }
        />

        <Route
          path="/services/eventicon"
          element={
            <DisabledRouteGate route="services_eventicon">
              <main className="relative z-10">
                <EventIconPage />
                <ContactGrid variant={isDarkContact ? 'dark' : 'light'} />
              </main>
            </DisabledRouteGate>
          }
        />

        <Route
          path="/talents"
          element={
            <DisabledRouteGate route="talents">
              <main className="relative z-10">
                <TalentGallery />
                <ContactGrid variant="light" />
              </main>
            </DisabledRouteGate>
          }
        />

        {/* Authenticated onboarding form (shown after login) */}
        <Route
          path="/talents/onboarding"
          element={
            <ProtectedRoute requireAuth={true}>
              <DisabledRouteGate route="talents_onboarding" allowAuthed={true}>
                <main className="relative z-10">
                  <TalentOnboardingPage />
                </main>
              </DisabledRouteGate>
            </ProtectedRoute>
          }
        />

        <Route
          path="/gallery"
          element={
            <DisabledRouteGate route="gallery">
              <main className="relative z-10">
                <GalleryPage />
                <ContactGrid variant="light" />
              </main>
            </DisabledRouteGate>
          }
        />

        <Route
          path="/test-session"
          element={
            <DisabledRouteGate route="test_session" allowAdmin={true}>
              <main className="relative z-10">
                <TestSession />
              </main>
            </DisabledRouteGate>
          }
        />

        <Route
          path="/talents/:userId"
          element={
            <DisabledRouteGate route="talent_profile">
              <main className="relative z-10">
                <TalentProfilePage />
              </main>
            </DisabledRouteGate>
          }
        />

        <Route
          path="/castings"
          element={
            <DisabledRouteGate route="castings">
              <main className="relative z-10">
                <Castings />
              </main>
            </DisabledRouteGate>
          }
        />

        <Route
          path="/castings/:castingId"
          element={
            <DisabledRouteGate route="casting_detail">
              <main className="relative z-10">
                <CastingDetail />
              </main>
            </DisabledRouteGate>
          }
        />

        <Route
          path="/auth"
          element={
            <ProtectedRoute requireAuth={false} redirectTo="/profile">
              <DisabledRouteGate route="auth" allowAuthed={true}>
                <main className="relative z-10">
                  <AuthPage />
                </main>
              </DisabledRouteGate>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reset-password"
          element={
            <DisabledRouteGate route="reset_password">
              <main className="relative z-10">
                <ResetPasswordPage />
              </main>
            </DisabledRouteGate>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute requireAuth={true}>
              <DisabledRouteGate route="profile" allowAuthed={true}>
                <main className="relative z-10">
                  {user?.role === 'admin' ? <AdminDashboard /> : <ProfileDashboard />}
                </main>
              </DisabledRouteGate>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute requireAuth={true}>
              <DisabledRouteGate route="profile_edit" allowAuthed={true}>
                <main className="relative z-10">
                  <ProfileEdit />
                </main>
              </DisabledRouteGate>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAuth={true} requireRole="admin">
              <DisabledRouteGate route="admin" allowAdmin={true}>
                <main className="relative z-10">
                  <AdminDashboard />
                </main>
              </DisabledRouteGate>
            </ProtectedRoute>
          }
        />

        <Route
          path="/brands/:userId"
          element={
            <ProtectedRoute requireAuth={true} requireRole="admin">
              <DisabledRouteGate route="brand_profile" allowAdmin={true}>
                <main className="relative z-10">
                  <BrandPage />
                </main>
              </DisabledRouteGate>
            </ProtectedRoute>
          }
        />
      </Routes>
      </div>

      <Footer />
    </div>
  );
};

const AppContent: React.FC = () => (
  // Use HashRouter so refreshing on nested routes works on static hosts
  // without requiring server-side rewrite rules.
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