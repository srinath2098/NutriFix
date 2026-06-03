import { getApiBaseUrl } from '../config';

export const redirectToLogin = () => {
  window.location.href = `${getApiBaseUrl()}/api/login`;
};

export const redirectToLogout = () => {
  const returnTo = window.location.origin;
  window.location.href = `${getApiBaseUrl()}/api/logout?returnTo=${encodeURIComponent(returnTo)}`;
};
