import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';
export const PublicRoute = () => {
  const context = useContext(AuthContext);
  if (context?.user) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
};