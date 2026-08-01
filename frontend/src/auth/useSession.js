import { useContext } from 'react';
import { SessionContext } from './session-context.js';

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}

/** Money is hidden from kitchen staff — server-side, and here for rendering. */
export function useShowMoney() {
  const { user } = useSession();
  return !!user && user.role !== 'staff';
}
