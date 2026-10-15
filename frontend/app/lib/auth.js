const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://aiveh.vercel.app/';

export const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('autodamage_token');
};

export const getUser = () => {
  if (typeof window === 'undefined') return null;
  const u = localStorage.getItem('autodamage_user');
  return u ? JSON.parse(u) : null;
};

export const setAuth = (token, user) => {
  localStorage.setItem('autodamage_token', token);
  localStorage.setItem('autodamage_user', JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem('autodamage_token');
  localStorage.removeItem('autodamage_user');
};

export const isAuthenticated = () => !!getToken();
