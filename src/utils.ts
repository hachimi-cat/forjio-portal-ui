import type { NavSection } from './types';

/** Find the longest-prefix-matching href in `sections` for the
 *  current pathname. Used by Sidebar to highlight the active item. */
export function activeHrefFor(pathname: string, sections: NavSection[]): string | null {
  const candidates = sections.flatMap((s) => s.items.map((i) => i.href));
  let best: string | null = null;
  for (const href of candidates) {
    const matches =
      href === '/dashboard'
        ? pathname === '/dashboard'
        : pathname === href || pathname.startsWith(href + '/');
    if (matches && (best === null || href.length > best.length)) best = href;
  }
  return best;
}

export function titleCase(s: string | null | undefined): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/**
 * Persist + reload pattern shared across the three storage modes.
 * Sidebar passes whichever flavor the consuming product uses; this
 * util encapsulates the cookie/localStorage/API call.
 */
export function writeActiveWorkspace(
  mode: 'cookie' | 'local' | 'api',
  brandSlug: string,
  workspaceId: string,
  apiSwitchPath?: string,
): void | Promise<void> {
  if (typeof window === 'undefined') return;
  if (mode === 'cookie') {
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${brandSlug}_active_workspace=${encodeURIComponent(
      workspaceId,
    )}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax${secure}`;
    return;
  }
  if (mode === 'local') {
    localStorage.setItem(`${brandSlug}_active_workspace`, workspaceId);
    return;
  }
  if (mode === 'api' && apiSwitchPath) {
    return fetch(apiSwitchPath.replace('{id}', encodeURIComponent(workspaceId)), {
      method: 'POST',
      credentials: 'include',
    }).then(() => undefined);
  }
}

/** Read whichever persistence the consumer uses. Returns null on SSR
 *  (no window). For `api` mode the caller should pull from session
 *  themselves — there's no stable client-side cache. */
export function readActiveWorkspaceId(
  mode: 'cookie' | 'local' | 'api',
  brandSlug: string,
): string | null {
  if (typeof window === 'undefined') return null;
  if (mode === 'cookie') {
    const match = document.cookie
      .split('; ')
      .find((r) => r.startsWith(`${brandSlug}_active_workspace=`));
    if (!match) return null;
    return decodeURIComponent(match.split('=').slice(1).join('='));
  }
  if (mode === 'local') {
    return localStorage.getItem(`${brandSlug}_active_workspace`);
  }
  return null;
}
