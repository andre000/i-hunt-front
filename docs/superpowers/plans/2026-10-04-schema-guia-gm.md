# Schema publicado, campanha de exemplo e guia do GM (#19) Implementation Plan

**Goal:** Entregar ao GM o formato da campanha: schema final com descrições em português, um JSON de exemplo que exercita tudo e um guia curto.

**Spec:** Issue #19, parte de #9. `GLOSSARY.md`, ADR 0001 e 0002.

## Decisões

- O schema continua em `src/campaign/campaign.schema.json` (fonte única, importado pelo app) e é publicado pelo próprio app em `/campaign.schema.json` (plugin do Vite: serve no dev e emite no build). O GM aponta `"$schema"` para esse endereço e o editor valida.
- O schema aceita a chave `$schema` no topo, para o editor achar o schema.
- Campanha de exemplo em `public/exemplo-campanha.json`, servida pelo app: dá para testar com o Convite `/?campanha=<app>/exemplo-campanha.json`.
- Guia em `docs/guia-do-gm.md`. Passos do R2 conferidos na documentação da Cloudflare (CORS em Settings → CORS Policy; acesso público em Settings → Public Development URL).

## Tasks

1. TDD: exemplo valida; cobre os 5 estados, agendada (missão e mensagem), mensagem para todos e para hunters específicos; todo campo do schema tem `description`.
2. Descrições no schema, `$schema` permitido, plugin que publica o schema, exemplo, guia.
3. `pnpm test`, `pnpm lint`, `pnpm build` (conferir `dist/campaign.schema.json` e `dist/exemplo-campanha.json`); Chrome headless com o Convite do exemplo.
