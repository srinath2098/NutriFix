export const getApiBaseUrl = () => {
  return process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5050';
};
