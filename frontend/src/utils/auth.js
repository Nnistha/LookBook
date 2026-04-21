const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const AUTH_KEY = 'isAuthenticated';

export function getAuthToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function hasActiveSession() {
  return getAuthToken() !== null && sessionStorage.getItem(AUTH_KEY) === 'true';
}

export function saveSession({ token, user }) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  sessionStorage.setItem(AUTH_KEY, 'true');
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(AUTH_KEY);

  // Remove legacy persistent auth so a previous login never survives a fresh site open.
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(AUTH_KEY);
}

export function clearLegacyPersistentAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(AUTH_KEY);
}
