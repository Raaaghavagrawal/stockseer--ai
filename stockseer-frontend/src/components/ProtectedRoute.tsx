import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser } = useAuth();

  console.log('ProtectedRoute - currentUser:', currentUser ? 'Authenticated' : 'Not authenticated');

  return currentUser ? <>{children}</> : <Navigate to="/" replace />;
};

export default ProtectedRoute;
