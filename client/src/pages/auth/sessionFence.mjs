/** A generation changes whenever the identity changes; old requests cannot commit. */
export function createSessionFence() {
  let generation = 0;
  return { next: () => ++generation, current: () => generation, accepts: value => value === generation };
}

export function roleHome(role) { return `/${String(role).toLowerCase()}`; }
export function safeReturnPath(candidate, role) {
  const home = roleHome(role);
  if (typeof candidate !== 'string' || !candidate.startsWith('/') || candidate.startsWith('//') || /[\\\r\n]/.test(candidate)) return home;
  const parsed = new URL(candidate, 'https://ownsquare.invalid');
  if (parsed.origin !== 'https://ownsquare.invalid') return home;
  const pathname = parsed.pathname;
  return pathname === home || pathname.startsWith(`${home}/`) || pathname === '/profile' || pathname === '/notifications' ? pathname + parsed.search + parsed.hash : home;
}
