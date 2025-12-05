import React, { useState } from 'react';
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

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'services' | 'talents' | 'castings' | 'auth'>('home');

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-white selection:text-black">
      <Navbar onNavigate={setCurrentView} currentView={currentView} />
      
      {currentView === 'home' && (
        <main>
          <Hero />
          <Mission />
          <Brands />
          <ContactGrid />
        </main>
      )}

      {currentView === 'services' && (
        <main>
          <Services />
          <ContactGrid />
        </main>
      )}

      {currentView === 'talents' && (
        <main className="pt-20">
          <TalentGallery />
          <ContactGrid />
        </main>
      )}

      {currentView === 'castings' && (
        <main className="pt-20">
          <Castings />
        </main>
      )}

      {currentView === 'auth' && (
        <main className="pt-20">
          <AuthPage onLoginSuccess={() => setCurrentView('home')} />
        </main>
      )}

      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;