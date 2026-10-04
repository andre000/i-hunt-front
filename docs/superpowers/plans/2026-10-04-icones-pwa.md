# Ícones do PWA (#11) Implementation Plan

**Goal:** Manifesto do PWA com ícones reais de 192×192 e 512×512, gerados do `public/favicon.svg`, e `includeAssets` só com arquivos que existem.

**Spec:** Issue #11 (`gh issue view 11`), parte de #9.

### Task 1: Opções do PWA testáveis e ícones reais

**Files:**
- Create: `pwa.config.js` (exporta `pwaOptions`, usado pelo `vite.config.js`)
- Test: `pwa.config.test.js`
- Create: `public/pwa-192x192.png`, `public/pwa-512x512.png` (renderizados do SVG com `@resvg/resvg-js` via `pnpm dlx`, sem virar dependência)
- Modify: `vite.config.js`

- [ ] Teste falhando: cada ícone do manifesto existe em `public/` e o PNG tem a dimensão declarada em `sizes`; cada item de `includeAssets` existe em `public/`.
- [ ] Gerar os PNGs e apontar o manifesto para eles; `includeAssets: ['favicon.svg', 'favicon.png']` (caminhos relativos a `public/`).
- [ ] `pnpm test`, `pnpm lint`, `pnpm build`; conferir `dist/manifest.webmanifest`.
- [ ] Commit: `fix: generate pwa icons in declared sizes`.
