'use client';

import Link from 'next/link';
import { ChevronDown, Menu } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { PortalWorkspace, WorkspacePersistMode } from './types';
import { writeActiveWorkspace } from './utils';
import { WorkspaceChiclet, WorkspaceMenuPanel } from './workspace-bits';

/**
 * Phone-only portal header — two floating "islands" instead of a bar,
 * after Apple's iOS large-title chrome (bang, 2026-08-06): the
 * workspace selector pill on the left, a round burger button on the
 * right, page content scrolling underneath the transparent strip
 * between them. Pairs with the Sidebar's right-side drawer: the burger
 * opens it, and the drawer hides its own workspace switcher on phones
 * because the pill IS the switcher there.
 *
 * A no-workspace portal (buyer / creator surfaces) renders the brand
 * as the left island instead, linking home.
 */
export interface MobileHeaderProps {
  /** Slug for cookie/localStorage namespace, e.g. "plugipay". */
  brandSlug: string;
  /** Brand display name — the left island's label in no-workspace mode. */
  brandName: string;
  /** Where the brand island links in no-workspace mode. Default `/dashboard`. */
  brandHref?: string;
  /** Brand accent — same contract as SidebarProps.brandColor. */
  brandColor: string;
  /** Same contract as SidebarProps.brandColorSoft. */
  brandColorSoft?: string;
  /** Brand logo, rendered in the left island in no-workspace mode. */
  brandIcon?: React.ReactNode;
  /** Same contract as SidebarProps — required in workspace mode. */
  workspacePersist?: WorkspacePersistMode;
  /** Only used when workspacePersist='api'. */
  apiSwitchPath?: string;
  /** Omit entirely for a no-workspace portal (brand island instead). */
  workspaces?: PortalWorkspace[];
  activeWorkspaceId?: string | null;
  onWorkspaceSwitch?: (id: string) => void | Promise<void>;
  /** Where the pill's "+ Manage workspaces" row links. */
  manageWorkspacesHref?: string;
  /** Opens the nav drawer (the Sidebar's `open` state). */
  onMenuOpen: () => void;
}

const ISLAND: React.CSSProperties = {
  border: '1px solid hsl(var(--border, 220 14% 90%))',
  background: 'hsl(var(--card, 0 0% 100%) / 0.85)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  boxShadow: '0 4px 16px -8px rgba(0, 0, 0, 0.35)',
  color: 'hsl(var(--foreground, 222 47% 11%))',
};

export function MobileHeader({
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
  onWorkspaceSwitch,
  manageWorkspacesHref,
  onMenuOpen,
}: MobileHeaderProps) {
  const workspaceMode = workspaces !== undefined;
  const wsList = workspaces ?? [];
  const active = wsList.find((w) => w.id === activeWorkspaceId) ?? null;
  const others = wsList.filter((w) => w.id !== activeWorkspaceId);

  const themeVars: React.CSSProperties = {
    ['--brand-color' as string]: brandColor,
    ['--brand-soft' as string]: brandColorSoft ?? `${brandColor}26`,
  };

  async function switchWorkspace(id: string) {
    if (!workspacePersist) return;
    await writeActiveWorkspace(workspacePersist, brandSlug, id, apiSwitchPath);
    if (onWorkspaceSwitch) {
      await onWorkspaceSwitch(id);
    } else if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  return (
    <header
      // display comes from the classes, NOT inline style: an inline
      // `display:flex` would beat the lg:hidden media rule and leave
      // the islands visible on desktop next to the sidebar's own
      // switcher (caught in the 1280px harness shot, 2026-08-06).
      className="flex items-center justify-between lg:hidden"
      style={{
        ...themeVars,
        position: 'sticky',
        top: 0,
        zIndex: 30,
        gap: 12,
        padding: '10px 16px',
        // The strip between the islands is see-through and must not
        // swallow taps on content scrolling beneath it.
        pointerEvents: 'none',
      }}
    >
      {workspaceMode ? (
        <WorkspacePill
          active={active}
          others={others}
          hasAny={wsList.length > 0}
          onSwitch={switchWorkspace}
          manageHref={manageWorkspacesHref}
        />
      ) : (
        <Link
          href={brandHref}
          aria-label={`${brandName} home`}
          style={{
            ...ISLAND,
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: 44,
            padding: '0 16px 0 12px',
            borderRadius: 999,
            textDecoration: 'none',
            minWidth: 0,
          }}
        >
          {brandIcon}
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {brandName}
          </span>
        </Link>
      )}

      <button
        type="button"
        onClick={onMenuOpen}
        aria-label="Open navigation"
        style={{
          ...ISLAND,
          pointerEvents: 'auto',
          // Pinned right even when the left island renders nothing —
          // justify-between alone would slide the burger to the left
          // edge whenever the workspace list is empty: permanently for
          // a no-workspace console (catentio admin), and for one frame
          // in every product while /workspaces is still in flight.
          marginLeft: 'auto',
          width: 44,
          height: 44,
          flex: '0 0 44px',
          borderRadius: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <Menu size={18} />
      </button>
    </header>
  );
}

function WorkspacePill({
  active,
  others,
  hasAny,
  onSwitch,
  manageHref,
}: {
  active: PortalWorkspace | null;
  others: PortalWorkspace[];
  hasAny: boolean;
  onSwitch: (id: string) => void;
  manageHref?: string;
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
    <div ref={ref} style={{ position: 'relative', pointerEvents: 'auto', minWidth: 0 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={!active}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          ...ISLAND,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: 44,
          maxWidth: '100%',
          padding: '0 14px 0 8px',
          borderRadius: 999,
          cursor: active ? 'pointer' : 'default',
          textAlign: 'left',
        }}
      >
        <WorkspaceChiclet name={active?.name ?? '?'} round />
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minWidth: 0,
          }}
        >
          {active?.name ?? 'Loading…'}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={2}
          style={{
            flex: '0 0 auto',
            color: 'hsl(var(--muted-foreground, 220 9% 46%))',
            transform: open ? 'rotate(180deg)' : '',
            transition: 'transform 120ms ease',
          }}
        />
      </button>
      {open && (
        <WorkspaceMenuPanel
          active={active}
          others={others}
          onPick={(id) => {
            setOpen(false);
            onSwitch(id);
          }}
          onManage={() => setOpen(false)}
          manageHref={manageHref}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 8,
            width: 'min(78vw, 320px)',
          }}
        />
      )}
    </div>
  );
}
