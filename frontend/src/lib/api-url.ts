export const getBackendUrl = () => {
  // If running on the server (Node.js), use the internal Docker network URL
  if (typeof window === 'undefined') {
    return process.env.BACKEND_URL || 'http://backend:8080';
  }
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL;
  }

  return `${window.location.protocol}//${window.location.hostname}:8080`;
};
