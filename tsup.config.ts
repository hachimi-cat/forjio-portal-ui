import { defineConfig } from 'tsup';

// Bundleless emit so 'use client' directives stay attached to the right
// files (Sidebar, ProfileDropdown, WorkspaceSwitcher are client
// components; the type/utility exports are not).
//
// Mirrors forjio-website-ui's tsup.config.ts.
export default defineConfig({
  entry: ['src/**/*.{ts,tsx}'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  bundle: false,
  splitting: false,
  treeshake: false,
  target: 'es2022',
  outDir: 'dist',
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
  external: [
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
    'react',
    'react-dom',
    'next',
    'next/link',
    'next/navigation',
    'lucide-react',
  ],
});
