'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronUp, X, LogOut, BookOpen, FileText, Shield } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type {
  LucideIcon,
  NavSection,
  PortalWorkspace,
  SessionUser,
  WorkspacePersistMode,
} from './types';
import { activeHrefFor, titleCase, writeActiveWorkspace } from './utils';

/**
 * Forjio family sidebar — workspace switcher on top, nav sections in
 * the middle, profile dropdown at the bottom. Extracted from
 * saas-plugipay 2026-05-19 as the canonical reference.
 *
 * The shell is style-agnostic: every visual is inline CSS driven by
 * CSS custom properties so consumers can theme via a single brandColor
 * prop without depending on Tailwind or any specific token system.
 */
export interface SidebarProps {
  /** Slug for cookie/localStorage namespace, e.g. "plugipay". */
  brandSlug: string;
  /** Display name shown at the top of the sidebar. */
  brandName: string;
  /** Brand accent color — used for the active-link pill + workspace
   *  chiclet + profile avatar. Forjio family default `#1a1a2e`. */
  brandColor: string;
  /** Sidebar logo. Provide a Lucide icon or an `<img>` — anything that
   *  renders next to the brand name. */
  brandIcon?: React.ReactNode;
  /** Persistence flavor — see WorkspacePersistMode docs. */
  workspacePersist: WorkspacePersistMode;
  /** Only used when workspacePersist='api'. Should contain `{id}` as
   *  a placeholder. Example: `/api/v1/account/workspaces/{id}/switch`. */
  apiSwitchPath?: string;
  /** Loaded workspace list — fetched by the host product. */
  workspaces: PortalWorkspace[];
  /** Active workspace id — host product reads from
   *  readActiveWorkspaceId or session state. */
  activeWorkspaceId: string | null;
  /** Nav sections rendered in order. Most-specific href wins for the
   *  active highlight. */
  sections: NavSection[];
  /** Bottom-of-sidebar user info. */
  user: SessionUser | null;
  /** Called when the user picks a different workspace. After the
   *  helper writes persistence, the host should refetch its data —
   *  the default behavior is to reload the page, but the host can
   *  override (e.g. invalidate a SWR cache instead). */
  onWorkspaceSwitch?: (id: string) => void | Promise<void>;
  /** Called when the user clicks Sign out. */
  onLogout: () => void | Promise<void>;
  /** Drawer open state on mobile. */
  open: boolean;
  /** Close handler for the mobile drawer. */
  onClose: () => void;
  /** Optional footer links inside the profile dropdown.
   *  Defaults to Docs / Terms / Privacy. */
  dropdownLinks?: { href: string; label: string; icon: LucideIcon }[];
}

const DEFAULT_DROPDOWN_LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/docs', label: 'Documentation', icon: BookOpen },
  { href: '/terms', label: 'Terms of Service', icon: FileText },
  { href: '/privacy', label: 'Privacy Policy', icon: Shield },
];

export function Sidebar({
  brandSlug,
  brandName,
  brandColor,
  brandIcon,
  workspacePersist,
  apiSwitchPath,
  workspaces,
  activeWorkspaceId,
  sections,
  user,
  onWorkspaceSwitch,
  onLogout,
  open,
  onClose,
  dropdownLinks = DEFAULT_DROPDOWN_LINKS,
}: SidebarProps) {
  const pathname = usePathname() ?? '';
  const active = workspaces.find((w) => w.id === activeWorkspaceId) ?? null;
  const others = workspaces.filter((w) => w.id !== activeWorkspaceId);

  // Theme variables expressed as CSS custom properties; consumers can
  // override on their own root if needed but the props are the canonical
  // surface.
  const themeVars: React.CSSProperties = {
    ['--brand-color' as string]: brandColor,
    ['--brand-soft' as string]: `${brandColor}26`, // 15% alpha
  };

  async function switchWorkspace(id: string) {
    await writeActiveWorkspace(workspacePersist, brandSlug, id, apiSwitchPath);
    if (onWorkspaceSwitch) {
      await onWorkspaceSwitch(id);
    } else if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 40,
          }}
          className="lg:hidden"
        />
      )}

      <aside
        style={{
          ...themeVars,
          borderRight: '1px solid hsl(var(--border, 220 14% 90%))',
          background: 'hsl(var(--card, 0 0% 100%))',
          color: 'hsl(var(--foreground, 222 47% 11%))',
          width: 248,
          display: 'flex',
          flexDirection: 'column',
        }}
        className={`fixed inset-y-0 left-0 z-50 h-screen transition-transform lg:sticky lg:top-0 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand row */}
        <div
          style={{
            padding: '20px 20px 18px',
            borderBottom: '1px solid hsl(var(--border, 220 14% 90%))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            href="/dashboard"
            onClick={onClose}
            aria-label={`${brandName} dashboard`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            {brandIcon}
            {brandName}
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden"
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'hsl(var(--muted-foreground, 220 9% 46%))',
              padding: 4,
            }}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <WorkspaceSwitcher
          active={active}
          others={others}
          hasAny={workspaces.length > 0}
          onSwitch={switchWorkspace}
          onNavigate={onClose}
        />

        <div style={{ flex: 1, padding: '16px 10px', overflowY: 'auto' }}>
          <NavList pathname={pathname} sections={sections} onNavigate={onClose} />
        </div>

        <ProfileDropdown user={user} onLogout={onLogout} onNavigate={onClose} dropdownLinks={dropdownLinks} />
      </aside>
    </>
  );
}

function NavList({
  pathname,
  sections,
  onNavigate,
}: {
  pathname: string;
  sections: NavSection[];
  onNavigate?: () => void;
}) {
  const activeHref = activeHrefFor(pathname, sections);
  return (
    <nav aria-label="Dashboard" style={{ display: 'grid', gap: 16 }}>
      {sections.map((section) => (
        <div key={section.label}>
          <div
            style={{
              fontSize: 10.5,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'hsl(var(--muted-foreground, 220 9% 46%) / 0.6)',
              padding: '0 10px 6px',
              fontWeight: 600,
            }}
          >
            {section.label}
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 1 }}>
            {section.items.map((item) => {
              const isActive = item.href === activeHref;
              const Icon = item.icon as LucideIcon;
              const linkStyle: React.CSSProperties = {
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 13.5,
                fontWeight: isActive ? 600 : 500,
                color: isActive
                  ? 'hsl(var(--foreground, 222 47% 11%))'
                  : 'hsl(var(--muted-foreground, 220 9% 46%))',
                padding: '7px 10px',
                borderRadius: 8,
                background: isActive ? 'var(--brand-soft)' : 'transparent',
                cursor: 'pointer',
                textDecoration: 'none',
              };
              return (
                <li key={item.href}>
                  <Link href={item.href} onClick={onNavigate} style={linkStyle}>
                    <Icon size={15} strokeWidth={2} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function WorkspaceChiclet({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      style={{
        width: 28,
        height: 28,
        flex: '0 0 28px',
        borderRadius: 8,
        background: 'var(--brand-soft)',
        color: 'var(--brand-color)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        fontWeight: 700,
        textTransform: 'uppercase',
        border: '1px solid var(--brand-soft)',
      }}
    >
      {name.slice(0, 1)}
    </span>
  );
}

function ForjioBadge() {
  return (
    <span
      title="Forjio-operated workspace"
      style={{
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'var(--brand-color)',
        background: 'var(--brand-soft)',
        border: '1px solid var(--brand-soft)',
        padding: '1px 6px',
        borderRadius: 4,
        flex: '0 0 auto',
      }}
    >
      forjio
    </span>
  );
}

function WorkspaceSwitcher({
  active,
  others,
  hasAny,
  onSwitch,
  onNavigate,
}: {
  active: PortalWorkspace | null;
  others: PortalWorkspace[];
  hasAny: boolean;
  onSwitch: (id: string) => void;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!hasAny) return null;

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        padding: '12px 10px',
        borderBottom: '1px solid hsl(var(--border, 220 14% 90%))',
      }}
    >
      {open && others.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 10,
            right: 10,
            marginTop: 6,
            borderRadius: 10,
            border: '1px solid hsl(var(--border, 220 14% 90%))',
            background: 'hsl(var(--card, 0 0% 100%))',
            boxShadow: '0 10px 30px -12px rgba(0, 0, 0, 0.5)',
            padding: 4,
            zIndex: 20,
          }}
        >
          {others.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => {
                setOpen(false);
                onSwitch(w.id);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '8px 10px',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                borderRadius: 6,
                color: 'inherit',
              }}
            >
              <WorkspaceChiclet name={w.name} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {w.name}
                  </span>
                  {w.isForjioInternal && <ForjioBadge />}
                </span>
                <span
                  style={{
                    display: 'block',
                    fontSize: 11.5,
                    color: 'hsl(var(--muted-foreground, 220 9% 46%))',
                  }}
                >
                  {titleCase(w.role)}
                </span>
              </span>
            </button>
          ))}
          <div style={{ borderTop: '1px solid hsl(var(--border, 220 14% 90%))', margin: '4px 0' }} />
          <Link
            href="/dashboard/workspaces"
            onClick={() => {
              setOpen(false);
              onNavigate?.();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 10px',
              fontSize: 13,
              color: 'hsl(var(--muted-foreground, 220 9% 46%))',
              textDecoration: 'none',
              borderRadius: 6,
            }}
          >
            + Manage workspaces
          </Link>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={!active}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          padding: '6px 6px',
          border: 'none',
          borderRadius: 8,
          background: 'transparent',
          cursor: active ? 'pointer' : 'default',
          textAlign: 'left',
          color: 'inherit',
        }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <WorkspaceChiclet name={active?.name ?? '?'} />
        <span style={{ minWidth: 0, flex: 1 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {active?.name ?? 'Loading…'}
            </span>
            {active?.isForjioInternal && <ForjioBadge />}
          </span>
          <span
            style={{
              display: 'block',
              fontSize: 11.5,
              color: 'hsl(var(--muted-foreground, 220 9% 46%))',
            }}
          >
            {active ? titleCase(active.role) : ''}
          </span>
        </span>
        <ChevronUp
          size={14}
          strokeWidth={2}
          style={{
            color: 'hsl(var(--muted-foreground, 220 9% 46%))',
            transform: open ? 'rotate(180deg)' : '',
            transition: 'transform 120ms ease',
          }}
        />
      </button>
    </div>
  );
}

function ProfileDropdown({
  user,
  onLogout,
  onNavigate,
  dropdownLinks,
}: {
  user: SessionUser | null;
  onLogout: () => void | Promise<void>;
  onNavigate?: () => void;
  dropdownLinks: { href: string; label: string; icon: LucideIcon }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const name = user?.name || 'You';
  const email = user?.email || '';
  const initial = (user?.name || user?.email || '?').slice(0, 1).toUpperCase();

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    fontSize: 13,
    color: 'inherit',
    borderRadius: 6,
    textDecoration: 'none',
  };

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        borderTop: '1px solid hsl(var(--border, 220 14% 90%))',
        padding: '12px 10px',
      }}
    >
      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 10,
            right: 10,
            marginBottom: 6,
            borderRadius: 10,
            border: '1px solid hsl(var(--border, 220 14% 90%))',
            background: 'hsl(var(--card, 0 0% 100%))',
            boxShadow: '0 10px 30px -12px rgba(0, 0, 0, 0.5)',
            padding: 4,
            zIndex: 20,
          }}
        >
          <div
            style={{
              padding: '10px 12px',
              borderBottom: '1px solid hsl(var(--border, 220 14% 90%))',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
            <div
              style={{
                fontSize: 12,
                color: 'hsl(var(--muted-foreground, 220 9% 46%))',
                wordBreak: 'break-all',
              }}
            >
              {email}
            </div>
          </div>
          {dropdownLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => {
                  setOpen(false);
                  onNavigate?.();
                }}
                style={itemStyle}
              >
                <Icon size={14} /> {link.label}
              </Link>
            );
          })}
          <div style={{ borderTop: '1px solid hsl(var(--border, 220 14% 90%))', margin: '4px 0' }} />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            style={{
              ...itemStyle,
              color: 'hsl(var(--destructive, 0 84% 60%))',
              width: '100%',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          padding: '8px 8px',
          border: 'none',
          borderRadius: 8,
          background: 'transparent',
          cursor: 'pointer',
          textAlign: 'left',
          color: 'inherit',
        }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span
          style={{
            width: 32,
            height: 32,
            flex: '0 0 32px',
            borderRadius: '50%',
            background: 'var(--brand-color)',
            color: '#0b0b10',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {initial}
        </span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {name}
          </span>
          <span
            style={{
              display: 'block',
              fontSize: 11.5,
              color: 'hsl(var(--muted-foreground, 220 9% 46%))',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {email}
          </span>
        </span>
        <ChevronUp
          size={14}
          strokeWidth={2}
          style={{
            color: 'hsl(var(--muted-foreground, 220 9% 46%))',
            transform: open ? '' : 'rotate(180deg)',
            transition: 'transform 120ms ease',
          }}
        />
      </button>
    </div>
  );
}
