// Shared auth state. Every component gets the same user/session from AuthProvider,
// so a login or logout anywhere updates the whole app (and /auth/me is fetched once).
export { useAuthContext as useAuth } from '../contexts/AuthContext';
