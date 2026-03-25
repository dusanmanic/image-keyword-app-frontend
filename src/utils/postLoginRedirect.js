/** After login, prefer returning to the protected route the user tried to open. */
export function getPostLoginPath(location) {
  const from = location?.state?.from?.pathname;
  if (from && from !== '/login' && from !== '/') return from;
  return '/folders';
}
