import type { ComponentType, ReactNode, SVGProps } from 'react';

export type LucideIcon = ComponentType<{
  size?: number;
  strokeWidth?: number;
  style?: React.CSSProperties;
}>;

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export interface PortalWorkspace {
  id: string;
  name: string;
  slug?: string;
  plan?: string;
  role?: 'owner' | 'admin' | 'member';
  /** Forjio-internal workspaces get a tiny "forjio" badge in the
   *  switcher — set on bang's own workspaces, never on customer
   *  ones. */
  isForjioInternal?: boolean;
}

export interface SessionUser {
  name?: string;
  email?: string;
}

/**
 * How the active workspace is persisted across page reloads.
 *
 * - `cookie`: writes `<brand>_active_workspace` cookie. Recommended.
 *   The backend's auth middleware can read it without a header round-
 *   trip. Survives reloads cleanly across subdomains.
 * - `local`: writes `<brand>_active_workspace` to localStorage AND
 *   sends `X-Account-Id` header on every request. Legacy pattern
 *   from storlaunch/linksnap; works but more fragile.
 * - `api`: POSTs to a `/account/workspaces/<id>/switch` endpoint
 *   that mutates server-side session state. Legacy pattern from
 *   huudis itself.
 */
export type WorkspacePersistMode = 'cookie' | 'local' | 'api';
