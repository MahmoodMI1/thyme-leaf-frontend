import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from './useSession.js';
import { RolePanel } from '../components/Panels.jsx';

/**
 * Route guard. UX only — the server re-authorises every read and write, and a
 * 403 from it renders the same panel. This just saves the round trip.
 */
export function RequireRole({ roles, variant, children }) {
  const { user, status } = useSession();
  const location = useLocation();

  if (status === 'loading') return null;

  if (!user) {
    const from = location.pathname + location.search;
    return <Navigate to="/login" replace state={{ from }} />;
  }

  if (roles && roles.indexOf(user.role) === -1) {
    return <RolePanel variant={variant} roles={roles} />;
  }

  return children;
}
