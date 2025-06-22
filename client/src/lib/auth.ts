import { getApiBaseUrl } from '../config';

export const redirectToLogin = () => {
  window.location.href = `${getApiBaseUrl()}/api/auth/login`;
};

export const redirectToLogout = () => {
  const returnTo = window.location.origin;
  window.location.href = `${getApiBaseUrl()}/api/auth/logout?returnTo=${encodeURIComponent(returnTo)}`;
};
