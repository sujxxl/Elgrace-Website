import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Hero } from './components/Hero';
import { Mission } from './components/Mission';
import { Services } from './components/Services';
import { TalentGallery } from './components/TalentGallery';
import { ContactGrid } from './components/ContactGrid';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { Brands } from './components/Brands';
import { Castings } from './components/Castings';
import { AuthPage } from './components/AuthPage';
import { AuthProvider } from './context/AuthContext';

const viewToPath = (v: 'home' | 'services' | 'talents' | 'castings' | 'auth') =>
  v === 'home' ? '/' : `/${v}`;

const pathToView = (p: string): 'home' | 'services' | 'talents' | 'castings' | 'auth' => {
  if (p.startsWith('/services')) return 'services';
  if (p.startsWith('/talents')) return 'talents';
  if (p.startsWith('/castings')) return 'castings';
  if (p.startsWith('/auth')) return 'auth';
  return 'home';
};

const AppRouterContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentView = pathToView(location.pathname);
  const onNavigate = (view: 'home' | 'services' | 'talents' | 'castings' | 'auth') => {
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
          path="/talents"
          element={
            <main className="pt-20 relative z-10">
              <TalentGallery />
              <ContactGrid />
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
          path="/auth"
          element={
            <main className="pt-20 relative z-10">
              <AuthPage onLoginSuccess={() => navigate('/')} />
            </main>
          }
        />
      </Routes>

      <Footer />
    </div>
  );
};

const AppContent: React.FC = () => (
  <BrowserRouter>
    <AppRouterContent />
  </BrowserRouter>
);

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;