# iHunt

iHunt is a React application built with Vite. It is inspired by the tabletop RPG of the same name. Routing is handled by the TanStack Router plugin and the project is configured as a Progressive Web App through `vite-plugin-pwa`.

## Development

Install dependencies and start the development server:

```bash
pnpm install
pnpm dev
```

## Build

Create an optimized production build:

```bash
pnpm build
```

## Preview

Serve the build locally for testing:

```bash
pnpm preview
```

## Deploy

The app is served as static assets by a Cloudflare Worker (`wrangler.jsonc`). Unknown paths fall back to `index.html`, so routes like `/gm` open directly.

```bash
pnpm wrangler login
pnpm run deploy
```

## Demo

Open `/demo` to try the player app with the example campaign (`public/exemplo-campanha.json`). The demo keeps its state in `sessionStorage` under `ihunt.demo.*`, so it never touches a real player's campaign. The bar at the top advances the campaign date one night at a time; "Sair" leaves the demo.
