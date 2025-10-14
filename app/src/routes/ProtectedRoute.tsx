import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { UsuarioPerfil } from '@/types';

interface ProtectedRouteProps {
  roles?: UsuarioPerfil[];
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ roles, children }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname || '/' }}
      />
    );
  }

  if (roles && !roles.includes(user.perfil)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
