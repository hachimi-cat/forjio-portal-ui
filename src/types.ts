import type { ComponentType, ReactNode, SVGProps } from 'react';

export type LucideIcon = ComponentType<{
  size?: number;
  strokeWidth?: number;
  style?: React.CSSProperties;
}>;

export interface NavItem {
  /** Link target. Omit for an action item — provide `onClick` instead. */
  href?: string;
  /** Action handler. When set, the item renders as a button (e.g. a
   *  cart-drawer trigger) rather than a link. */
  onClick?: () => void;
  label: string;
  icon: LucideIcon;
  /** Optional trailing count/indicator pill (e.g. a cart count). */
  badge?: number | string;
}

/**
 * An optionally-labelled cluster of nav items inside a module. The
 * `label` renders as a small muted sub-heading; omit it for a flat
 * (unheaded) run of items.
 */
export interface NavGroup {
  label?: string;
  items: NavItem[];
}

/**
 * A collapsible accordion within a section. Carries its own icon and
 * label; expanded, it renders either `groups` (sub-headed clusters) or
 * a flat `items` list. Used by module-based portals like storlaunch
 * where the merchant nav is organized by feature module.
 */
export interface NavModule {
  label: string;
  icon: LucideIcon;
  items?: NavItem[];
  groups?: NavGroup[];
}

/**
 * A nav section. Renders flat `items` and/or collapsible `modules`.
 * Both are optional and a section may carry either or both —
 * `items`-only is the backward-compatible two-level form.
 */
export interface NavSection {
  label: string;
  items?: NavItem[];
  modules?: NavModule[];
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
 * One entry in the profile dropdown's portal switcher. A Forjio
 * product that ships several sibling portals (e.g. ripllo's creator /
 * affiliator / merchant surfaces) passes the full set on every portal;
 * the one matching the current surface is flagged `current`.
 */
export interface PortalLink {
  /** Human label shown in the switcher, e.g. "Creator". */
  label: string;
  /** Where selecting this portal navigates. */
  href: string;
  /** Marks the portal the user is currently on — rendered as the
   *  active (non-clickable) entry. */
  current?: boolean;
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
