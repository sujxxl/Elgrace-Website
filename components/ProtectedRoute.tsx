import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRole?: 'model' | 'client' | 'admin';
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireRole,
  redirectTo = '/',
}) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    // If route requires authentication but user is not logged in
    if (requireAuth && !user) {
      navigate('/auth', { replace: true, state: { from: location.pathname } });
      return;
    }

    // If user is logged in but trying to access auth pages
    if (!requireAuth && user && location.pathname === '/auth') {
      navigate(redirectTo, { replace: true });
      return;
    }

    // If route requires specific role
    if (requireRole && user && user.role !== requireRole) {
      navigate('/', { replace: true });
      return;
    }
  }, [user, loading, requireAuth, requireRole, navigate, location.pathname, redirectTo]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf3e4]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#3d211a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#6b7280]">Loading...</p>
        </div>
      </div>
    );
  }

  // If route requires auth and user is not logged in, show nothing (will redirect)
  if (requireAuth && !user) {
    return null;
  }

  // If route is auth-only and user is logged in, show nothing (will redirect)
  if (!requireAuth && user && location.pathname === '/auth') {
    return null;
  }

  // If role check fails, show nothing (will redirect)
  if (requireRole && user && user.role !== requireRole) {
    return null;
  }

  return <>{children}</>;
};
