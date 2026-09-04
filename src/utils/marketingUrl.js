// The public marketing site (image-keyword-app-marketing). Set VITE_MARKETING_URL
// on the app deploy to point "Back to home" links at it. When it's unset we fall
// back to /login, since the app has no public home of its own.
const raw = (import.meta.env.VITE_MARKETING_URL || '').trim().replace(/\/+$/, '');

export const MARKETING_URL = raw
  ? (/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
  : null;

// Spread onto a styled(Link): an external <a> when we have a marketing site,
// otherwise an in-app link to sign-in.
export const homeLinkProps = MARKETING_URL
  ? { as: 'a', href: MARKETING_URL }
  : { to: '/login' };
