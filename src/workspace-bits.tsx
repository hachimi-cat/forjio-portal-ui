'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import type { PortalWorkspace } from './types';
import { titleCase } from './utils';

/**
 * Shared workspace-switcher pieces used by both the Sidebar's inline
 * switcher (desktop) and the MobileHeader's island pill (phones). One
 * source of truth for the chiclet, the forjio badge, and the dropdown
 * panel rows so the two surfaces can never drift apart.
 */

export function WorkspaceChiclet({
  name,
  round = false,
}: {
  name: string;
  /** Island pill uses a fully-round chiclet to match its radius. */
  round?: boolean;
}) {
  return (
    <span
      aria-hidden
      style={{
        width: 28,
        height: 28,
        flex: '0 0 28px',
        borderRadius: round ? 999 : 8,
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

export function ForjioBadge() {
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

function RowLabel({ w, sub }: { w: PortalWorkspace; sub: string }) {
  return (
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
        {sub}
      </span>
    </span>
  );
}

/**
 * The switcher dropdown panel — active row, sibling rows, manage link.
 * Positioning comes from the caller via `style` (the Sidebar anchors it
 * under its full-width row; the MobileHeader anchors it under the
 * island pill).
 */
export function WorkspaceMenuPanel({
  active,
  others,
  onPick,
  onManage,
  manageHref = '/dashboard/workspaces',
  style,
}: {
  active: PortalWorkspace | null;
  others: PortalWorkspace[];
  onPick: (id: string) => void;
  onManage?: () => void;
  manageHref?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        borderRadius: 10,
        border: '1px solid hsl(var(--border, 220 14% 90%))',
        background: 'hsl(var(--card, 0 0% 100%))',
        boxShadow: '0 10px 30px -12px rgba(0, 0, 0, 0.5)',
        padding: 4,
        zIndex: 20,
        // Cap height + scroll so a workspace-heavy account (many
        // memberships) doesn't overflow the viewport.
        maxHeight: 'min(60vh, 360px)',
        overflowY: 'auto',
        ...style,
      }}
    >
      {/* Active workspace row — always shown so a single-workspace
          account still gets a real, non-empty dropdown. */}
      {active && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            padding: '8px 10px',
            borderRadius: 6,
            background: 'hsl(var(--accent, 220 14% 96%))',
          }}
        >
          <WorkspaceChiclet name={active.name} />
          <RowLabel w={active} sub={`${titleCase(active.role)} · current`} />
          <Check size={15} strokeWidth={2.5} />
        </div>
      )}
      {others.length > 0 && (
        <div style={{ borderTop: '1px solid hsl(var(--border, 220 14% 90%))', margin: '4px 0' }} />
      )}
      {others.map((w) => (
        <button
          key={w.id}
          type="button"
          onClick={() => onPick(w.id)}
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
          <RowLabel w={w} sub={titleCase(w.role)} />
        </button>
      ))}
      <div style={{ borderTop: '1px solid hsl(var(--border, 220 14% 90%))', margin: '4px 0' }} />
      <Link
        href={manageHref}
        onClick={onManage}
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
  );
}
