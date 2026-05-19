# @forjio/portal-ui

Shared portal chrome for the Forjio family of SaaS products. Sister
package to [`@forjio/website-ui`](https://github.com/hachimi-cat/forjio-website-ui)
— that handles the marketing site; this handles the authenticated
dashboard.

Single source of truth for:

- **`<Sidebar />`** — workspace switcher + nav sections + profile dropdown
- Workspace persistence helpers (cookie / localStorage / API)

Extracted from `saas-plugipay` on 2026-05-19 as the canonical reference
build (per [TEMPLATE.md](https://github.com/hachimi-cat/forjio-service-template/blob/master/TEMPLATE.md)).

## Install

```bash
npm i @forjio/portal-ui lucide-react
```

Peer deps: `react`, `react-dom`, `next` (App Router), `lucide-react`.

## Minimal usage

```tsx
'use client';
import { Sidebar } from '@forjio/portal-ui';
import { LayoutDashboard, CreditCard, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';

export function PortalLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/workspaces', { credentials: 'include' })
      .then((r) => r.json())
      .then((b) => setWorkspaces(b?.data ?? []));
  }, []);

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar
        brandSlug="kalium"
        brandName="Kalium"
        brandColor="#7C3AED"
        workspacePersist="cookie"
        workspaces={workspaces}
        activeWorkspaceId={activeId}
        sections={[
          {
            label: 'Overview',
            items: [
              { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            ],
          },
          {
            label: 'Money',
            items: [
              { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
            ],
          },
          {
            label: 'Settings',
            items: [
              { href: '/dashboard/settings', label: 'Settings', icon: Settings },
            ],
          },
        ]}
        user={{ name: 'Gojo Sensei', email: 'gojo@forjio.com' }}
        onLogout={async () => {
          await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
          window.location.href = '/';
        }}
        open={open}
        onClose={() => setOpen(false)}
      />
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}
```

## Workspace persistence

| Mode      | Persistence                                       | Backend reads from                              |
|-----------|---------------------------------------------------|--------------------------------------------------|
| `cookie`  | `<brand>_active_workspace` cookie (recommended)   | Cookie header on every request                  |
| `local`   | `<brand>_active_workspace` localStorage           | `X-Account-Id` header you thread by hand        |
| `api`     | POST to `apiSwitchPath` mutating server session   | Backend session state                            |

**Use `cookie` for new products** — it's the only mode where the
backend's auth middleware can resolve the active workspace without
either a header round-trip or a separate localStorage→header thread.
saas-plugipay's pattern; the storlaunch/linksnap localStorage variant
causes a known frontend/backend desync that bit us during the
seeded-data screenshot session.

## Why not Tailwind?

Inline styles + CSS custom properties only. Consumers can keep their
own Tailwind config without theme collisions, and the component renders
identically regardless of the host app's CSS framework. brandColor +
brandSlug props drive everything.

## Anti-patterns from previous patterns

- ❌ Don't hardcode brand strings in the sidebar — pass via props
- ❌ Don't use localStorage workspace persistence on new products
- ❌ Don't ship `position: fixed` overlay without the lg:hidden gate

## License

UNLICENSED — private Forjio family package.
