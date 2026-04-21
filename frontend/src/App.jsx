import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Landing from './pages/Landing';
import Wardrobe from './pages/Wardrobe';
import DressingRoom from './pages/DressingRoom';
import CalendarPage from './pages/CalendarPage';
import Shopping from './pages/Shopping';
import AIAssistant from './pages/AIAssistant';
import Profile from './pages/Profile';
import SocialProfile from './pages/SocialProfile';
import { clearLegacyPersistentAuth, hasActiveSession } from './utils/auth';

function ProtectedRoute({ children }) {
  return hasActiveSession() ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  return hasActiveSession() ? <Navigate to="/" replace /> : children;
}

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const isLandingPage = location.pathname === '/' && hasActiveSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    clearLegacyPersistentAuth();
  }, []);

  return (
    <div className="min-h-screen bg-offwhite text-dark flex flex-col relative overflow-hidden">
      {!isLoginPage && !isLandingPage && <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />}
      {!isLoginPage && <Sidebar isOpen={isSidebarOpen} closeSidebar={() => setIsSidebarOpen(false)} />}
      
      <main className={`flex-1 ${(!isLoginPage && !isLandingPage) ? 'pt-24' : ''} h-full`}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Landing toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wardrobe"
              element={
                <ProtectedRoute>
                  <Wardrobe />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dressing-room"
              element={
                <ProtectedRoute>
                  <DressingRoom />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <CalendarPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shopping"
              element={
                <ProtectedRoute>
                  <Shopping />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-assistant"
              element={
                <ProtectedRoute>
                  <AIAssistant />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/social-profile"
              element={
                <ProtectedRoute>
                  <SocialProfile />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to={hasActiveSession() ? '/' : '/login'} replace />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
