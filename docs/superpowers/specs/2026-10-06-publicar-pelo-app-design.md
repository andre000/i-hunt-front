# Publicar pelo app

## Objetivo

Hoje o GM baixa o arquivo no Editor da campanha e sobe na mão no painel do R2. Queremos um botão **Publicar** no Editor que grava a campanha direto no bucket, sem abrir o painel, e sem deixar mais ninguém escrever.

Sucesso:

- O GM clica **Publicar** e, em cerca de 30 segundos, os jogadores veem a mudança.
- Ninguém sem a senha consegue gravar nada no bucket.
- Uma publicação errada pode ser desfeita a partir de uma cópia anterior.

Fora do escopo: vários GMs ou contas, tela para voltar versão, aviso de conflito quando o arquivo publicado muda durante a edição, validação do schema no servidor.

## Decisões

- Um único GM publica. A prova é uma senha (`PUBLISH_TOKEN`) guardada como secret do Worker e colada uma vez no Editor.
- A escrita mora no mesmo Worker que já serve o app, na rota `/api/*`. Mesmo domínio, sem CORS.
- O bucket pode ter várias campanhas. O Worker só aceita nomes `<nome>.json` na raiz, com `<nome>` feito de letras minúsculas, números e `-`.
- Antes de sobrescrever, o Worker guarda a versão anterior em `historico/<nome>/<data>.json` e mantém as 20 mais recentes de cada campanha.
- A leitura não muda: os jogadores continuam lendo pelo `r2.dev`.
- O Worker não valida o schema. O Editor só publica sem erros, e os jogadores já ignoram um arquivo inválido (ficam na última versão válida).

## Arquitetura

### Configuração (`wrangler.jsonc`)

- `main` aponta para o código do Worker (`worker/index.js`).
- `assets.run_worker_first: ["/api/*"]`: só a API passa pelo código; o resto segue servido como hoje.
- `r2_buckets`: binding `CAMPAIGNS` para o bucket das campanhas.
- `vars.PUBLIC_BASE_URL`: endereço `r2.dev` do bucket, sem barra no fim.
- Secret `PUBLISH_TOKEN`, criado com `wrangler secret put PUBLISH_TOKEN`. Nunca vai para o git.

### Rota `PUT /api/campanhas/<nome>.json` (`worker/index.js`)

Na ordem:

1. Sem `Authorization: Bearer <senha>` correta → `401`. A comparação é em tempo constante.
2. Nome fora do padrão `^[a-z0-9-]+\.json$` → `400`.
3. Corpo acima de 1 MB → `413`.
4. Corpo que não é JSON válido → `400`.
5. Se já existe `<nome>.json`, copia para `historico/<nome>/<data ISO>.json` e apaga as cópias além das 20 mais recentes.
6. Grava o corpo em `<nome>.json` com `Content-Type: application/json`.
7. Responde `200` com `{ "url": "<PUBLIC_BASE_URL>/<nome>.json" }`.

Outro método ou caminho em `/api/*` → `404`. Qualquer falha inesperada → `500` sem detalhes.

### Editor da campanha

- Botão **Publicar** ao lado de **Baixar**, com a mesma regra: só ativo sem erros.
- Nome de destino:
  - Rascunho aberto de um endereço que começa com `PUBLIC_BASE_URL`: publica no mesmo nome, sem perguntar.
  - Outro rascunho (em branco ou do computador): na primeira publicação, pede o nome, já preenchido com o nome do arquivo. Depois disso, o rascunho passa a publicar nesse nome.
- O app conhece `PUBLIC_BASE_URL` pela variável de build `VITE_PUBLIC_BASE_URL`, com o mesmo valor do Worker.
- Senha: na primeira publicação, o Editor pede a senha e guarda no `localStorage` (`ihunt.editor.publishToken`). Em `401`, apaga a guardada e pede de novo.
- O arquivo publicado é o mesmo que o **Baixar** gera (com `$schema`, formatado).
- Depois de publicar, o Editor mostra o link de Convite da URL devolvida, pronto para copiar.
- O aviso "Mudanças não baixadas" vira "Mudanças não publicadas" e some depois de baixar ou publicar.

### Mensagens de erro no Editor

| Resposta | Mensagem |
|---|---|
| `401` | "Senha errada." e pede a senha de novo |
| `400` | "Nome ou arquivo inválido." |
| `413` | "Arquivo grande demais para publicar." |
| `500` ou sem rede | "Não deu para publicar. O rascunho continua salvo." |

## Testes

- Worker (`worker/index.test.js`, Vitest): chama o `fetch` do Worker com um bucket falso em memória. Cobre senha ausente e errada, nome inválido, tamanho, JSON inválido, gravação, cópia no histórico, limite de 20 cópias e a URL devolvida.
- Editor (`src/routes/gm/editor.test.jsx`): com `fetch` falso, cobre publicar com nome do bucket, pedir nome num rascunho novo, pedir e guardar a senha, `401` limpando a senha, e cada mensagem de erro.

## Documentação

- Novo ADR `docs/adr/0003-publicar-pelo-app.md`: o app passa a escrever no bucket, protegido por uma senha única; por que senha e não Cloudflare Access.
- ADR 0001: marcar a consequência "o app nunca escreve nada remotamente" como substituída pelo 0003.
- `docs/guia-do-gm.md`: seção de publicar pelo Editor e como criar o secret.
- `GLOSSARY.md`: definir **Publicar** (gravar o rascunho como a campanha que os jogadores leem).
