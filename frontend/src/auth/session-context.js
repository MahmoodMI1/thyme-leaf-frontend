import { createContext } from 'react';

/**
 * { user, status, signIn, signOut }
 *   user   — { username, role } | null
 *   status — 'loading' until the app-load probe answers, then 'ready'
 */
export const SessionContext = createContext(null);
