'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronUp, ChevronDown, ChevronRight, X, LogOut, BookOpen, FileText, Shield } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type {
  LucideIcon,
  NavItem,
  NavModule,
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
  /** Where the brand wordmark / logo links — the portal's home. Default
   *  `/dashboard`. No-workspace portals set their own home, e.g.
   *  `/creators/dashboard` or a storefront buyer account root. */
  brandHref?: string;
  /** Brand accent color — used for the active-link pill + workspace
   *  chiclet + profile avatar. Must be a 6-digit hex (`#RRGGBB`): the
   *  soft accent is derived by appending an alpha suffix. Forjio family
   *  default `#1a1a2e`. */
  brandColor: string;
  /** Optional pre-formed "soft" accent (active-pill / hover fill).
   *  Defaults to `brandColor` at 15% alpha. Pass this when `brandColor`
   *  can't be a static hex — e.g. a theme-following `hsl(var(--primary))`
   *  value, where the default `${brandColor}26` suffixing would produce
   *  invalid CSS. */
  brandColorSoft?: string;
  /** Sidebar logo. Provide a Lucide icon or an `<img>` — anything that
   *  renders next to the brand name. */
  brandIcon?: React.ReactNode;
  /** Persistence flavor — see WorkspacePersistMode docs. Required only
   *  in workspace mode (i.e. when `workspaces` is passed). */
  workspacePersist?: WorkspacePersistMode;
  /** Only used when workspacePersist='api'. Should contain `{id}` as
   *  a placeholder. Example: `/api/v1/account/workspaces/{id}/switch`. */
  apiSwitchPath?: string;
  /** Loaded workspace list — fetched by the host product. **Omit
   *  entirely for a no-workspace portal** (a storefront buyer account,
   *  or ripllo's creator / affiliator dashboards): the workspace
   *  switcher is then not rendered at all — just brand header → nav →
   *  profile. */
  workspaces?: PortalWorkspace[];
  /** Active workspace id — host product reads from
   *  readActiveWorkspaceId or session state. Unused in no-workspace mode. */
  activeWorkspaceId?: string | null;
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
  brandHref = '/dashboard',
  brandColor,
  brandColorSoft,
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
  // Workspace mode is opt-in: a host that omits `workspaces` gets a
  // no-workspace portal — no switcher (buyer / creator / affiliator).
  const workspaceMode = workspaces !== undefined;
  const wsList = workspaces ?? [];
  const active = wsList.find((w) => w.id === activeWorkspaceId) ?? null;
  const others = wsList.filter((w) => w.id !== activeWorkspaceId);

  // Theme variables expressed as CSS custom properties; consumers can
  // override on their own root if needed but the props are the canonical
  // surface.
  const themeVars: React.CSSProperties = {
    ['--brand-color' as string]: brandColor,
    ['--brand-soft' as string]: brandColorSoft ?? `${brandColor}26`, // 15% alpha (or caller-supplied)
  };

  async function switchWorkspace(id: string) {
    if (!workspacePersist) return; // no-workspace mode — switcher not rendered
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
            href={brandHref}
            onClick={onClose}
            aria-label={`${brandName} home`}
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

        {workspaceMode && (
          <WorkspaceSwitcher
            active={active}
            others={others}
            hasAny={wsList.length > 0}
            onSwitch={switchWorkspace}
            onNavigate={onClose}
          />
        )}

        <div style={{ flex: 1, padding: '16px 10px', overflowY: 'auto' }}>
          <NavList pathname={pathname} sections={sections} onNavigate={onClose} />
        </div>

        <ProfileDropdown user={user} onLogout={onLogout} onNavigate={onClose} dropdownLinks={dropdownLinks} />
      </aside>
    </>
  );
}

const FG = 'hsl(var(--foreground, 222 47% 11%))';
const MUTED = 'hsl(var(--muted-foreground, 220 9% 46%))';
const MUTED_SOFT = 'hsl(var(--muted-foreground, 220 9% 46%) / 0.6)';

/** Style for a top-level nav link (flat item or module toggle). */
function itemLinkStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 13.5,
    fontWeight: active ? 600 : 500,
    color: active ? FG : MUTED,
    padding: '7px 10px',
    borderRadius: 8,
    background: active ? 'var(--brand-soft)' : 'transparent',
    cursor: 'pointer',
    textDecoration: 'none',
  };
}

/** Style for an indented sub-item inside an expanded module. */
function subItemLinkStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 13,
    fontWeight: active ? 600 : 500,
    color: active ? FG : MUTED,
    padding: '6px 10px 6px 32px',
    borderRadius: 8,
    background: active ? 'var(--brand-soft)' : 'transparent',
    textDecoration: 'none',
  };
}

/** Trailing count/indicator pill (e.g. a cart count). */
function NavBadge({ value }: { value: number | string }) {
  return (
    <span
      style={{
        minWidth: 18,
        height: 18,
        padding: '0 5px',
        borderRadius: 9,
        background: 'var(--brand-color)',
        color: '#fff',
        fontSize: 10.5,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: '0 0 auto',
      }}
    >
      {value}
    </span>
  );
}

/** Renders a nav entry as a link, or — when the item carries an
 *  `onClick` — as a button (e.g. a cart-drawer trigger). Optional
 *  trailing `badge` pill. Shared by top-level items and module
 *  sub-items so both honour action items + badges. */
function NavControl({
  item,
  active,
  style,
  iconSize,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  style: React.CSSProperties;
  iconSize: number;
  onNavigate?: () => void;
}) {
  const Icon = item.icon as LucideIcon;
  const inner = (
    <>
      <Icon size={iconSize} strokeWidth={2} />
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.badge != null && item.badge !== '' && <NavBadge value={item.badge} />}
    </>
  );
  if (item.onClick) {
    return (
      <button
        type="button"
        onClick={() => {
          item.onClick?.();
          onNavigate?.();
        }}
        style={{
          ...style,
          width: '100%',
          border: 'none',
          textAlign: 'left',
          // `fontFamily` only — the `font` shorthand would reset the
          // fontSize/fontWeight that `style` (itemLinkStyle) sets,
          // making the action item bigger than its sibling links.
          fontFamily: 'inherit',
        }}
      >
        {inner}
      </button>
    );
  }
  return (
    <Link href={item.href ?? '#'} onClick={onNavigate} style={style}>
      {inner}
    </Link>
  );
}

function NavSubItem({
  item,
  activeHref,
  onNavigate,
}: {
  item: NavItem;
  activeHref: string | null;
  onNavigate?: () => void;
}) {
  const active = !!item.href && item.href === activeHref;
  return (
    <li>
      <NavControl
        item={item}
        active={active}
        style={subItemLinkStyle(active)}
        iconSize={13}
        onNavigate={onNavigate}
      />
    </li>
  );
}

/**
 * A collapsible module accordion: a toggle button (module icon +
 * label + chevron) over an expandable body of `groups` or flat
 * `items`. Auto-opens when a descendant href is the active route;
 * the user can still toggle it shut (or open) afterwards.
 */
function NavModuleAccordion({
  module,
  activeHref,
  onNavigate,
}: {
  module: NavModule;
  activeHref: string | null;
  onNavigate?: () => void;
}) {
  const descendantHrefs: string[] = [
    ...(module.items ?? []).map((i) => i.href),
    ...(module.groups ?? []).flatMap((g) => g.items.map((i) => i.href)),
  ].filter((h): h is string => typeof h === 'string');
  const autoOpen = activeHref !== null && descendantHrefs.includes(activeHref);
  // `null` = follow auto-open; once the user clicks, the explicit
  // boolean wins.
  const [override, setOverride] = useState<boolean | null>(null);
  const isOpen = override ?? autoOpen;

  const ModIcon = module.icon as LucideIcon;
  const Chevron = isOpen ? ChevronDown : ChevronRight;

  const subHeadingStyle: React.CSSProperties = {
    fontSize: 9.5,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: MUTED_SOFT,
    padding: '8px 10px 4px 32px',
    fontWeight: 600,
  };

  return (
    <li style={{ display: 'block' }}>
      <button
        type="button"
        onClick={() => setOverride(!isOpen)}
        style={{
          ...itemLinkStyle(autoOpen),
          width: '100%',
          border: 'none',
          textAlign: 'left',
        }}
        aria-expanded={isOpen}
      >
        <ModIcon size={15} strokeWidth={2} />
        <span style={{ flex: 1 }}>{module.label}</span>
        <Chevron size={14} strokeWidth={2} style={{ color: MUTED }} />
      </button>
      {isOpen && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '4px 0 0', display: 'grid', gap: 1 }}>
          {module.groups
            ? module.groups.map((group, gi) => (
                <li key={group.label ?? `__group_${gi}`}>
                  {group.label && <div style={subHeadingStyle}>{group.label}</div>}
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 1 }}>
                    {group.items.map((item) => (
                      <NavSubItem
                        key={item.href}
                        item={item}
                        activeHref={activeHref}
                        onNavigate={onNavigate}
                      />
                    ))}
                  </ul>
                </li>
              ))
            : (module.items ?? []).map((item) => (
                <NavSubItem
                  key={item.href}
                  item={item}
                  activeHref={activeHref}
                  onNavigate={onNavigate}
                />
              ))}
        </ul>
      )}
    </li>
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
      {sections.map((section) => {
        const items = section.items ?? [];
        const modules = section.modules ?? [];
        // Skip an empty section so its header doesn't float over nothing.
        if (items.length === 0 && modules.length === 0) return null;
        return (
          <div key={section.label}>
            <div
              style={{
                fontSize: 10.5,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: MUTED_SOFT,
                padding: '0 10px 6px',
                fontWeight: 600,
              }}
            >
              {section.label}
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 1 }}>
              {items.map((item) => {
                const active = !!item.href && item.href === activeHref;
                return (
                  <li key={item.href ?? item.label}>
                    <NavControl
                      item={item}
                      active={active}
                      style={itemLinkStyle(active)}
                      iconSize={15}
                      onNavigate={onNavigate}
                    />
                  </li>
                );
              })}
              {modules.map((module) => (
                <NavModuleAccordion
                  key={module.label}
                  module={module}
                  activeHref={activeHref}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </div>
        );
      })}
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
