# Modo demo

## Objetivo

O iHunt vai para o portfólio do autor. Um visitante sem Convite e sem campanha precisa ver o modo jogador em poucos minutos, sem afetar jogadores reais.

Sucesso:

- O visitante entra pelo link `/demo` ou pelo botão "Ver demonstração" e chega na escolha de hunter com a entrada animada.
- Ele entende o que é o app (cartão em inglês) e consegue avançar o tempo da campanha para ver conteúdo novo aparecer.
- Um jogador real que abre a demo no mesmo aparelho não perde a campanha, o hunter nem as mensagens lidas.

Fora do escopo: Visão do GM na demo, tradução do app, campanha de demo diferente da de exemplo.

## Decisões

- Entrada pelos dois caminhos: rota `/demo` e botão na tela "Você ainda não está numa campanha".
- O visitante pode avançar o tempo ("Avançar a noite").
- App em português; a demo abre com um cartão explicativo em inglês.
- Isolamento: a demo usa uma sync própria que guarda tudo em `sessionStorage`, com chaves `ihunt.demo.*`. A sync real e suas chaves (`ihunt.campaignUrl`, `ihunt.hunterId`, `ihunt.lastCampaign`, `ihunt.readMessages`) não são lidas nem escritas pela demo.

## Arquitetura

### Entrada no modo demo (`src/main.jsx`)

- Se o caminho é `/demo`, ou se `sessionStorage` tem `ihunt.demo.active`, o app cria a sync da demo no lugar da sync real.
- Ao entrar por `/demo`, grava `ihunt.demo.active` e troca o endereço para `/` com `history.replaceState`, como o Convite já faz.
- O botão "Ver demonstração" faz `window.location.assign('/demo')`.
- O Convite (`?campanha=`) tem prioridade: se a URL tem convite, a demo é desligada (remove `ihunt.demo.*`) e o fluxo real segue.

### Sync da demo (`src/campaign/demoSync.js`)

`createDemoSync({ fetch, storage, origin })` devolve a mesma interface usada pelo store e pelo loop de sync:
`load`, `getHunterId`, `setHunterId`, `clearHunterId`, `getReadMessageIds`, `markMessagesRead`, `getCampaignUrl`, `offerInvite`, `acceptInvite`.
Acrescenta:

- `getNight()`: noite atual, começando em 1.
- `advanceNight()`: soma 1 até `LAST_NIGHT`; devolve a nova noite.
- `restart()`: volta para a noite 1 e limpa hunter e mensagens lidas da demo.
- `exit()`: remove todas as chaves `ihunt.demo.*`.

`load()`:

1. Busca `${origin}/exemplo-campanha.json` com o mesmo `fetchCampaign` da sync real (valida pelo schema).
2. Se a busca falhar, usa a última versão válida guardada em `ihunt.demo.lastCampaign`. Sem ela, devolve o erro de sempre (`status: 'error'`).
3. Soma `(noite - 1) × 24h` a `campaign.date`, mantendo o fuso do texto original.
4. Devolve `{ status: 'ready', campaign, ... }` no mesmo formato da sync real.

`LAST_NIGHT = 3`. Com a campanha de exemplo (data inicial sáb 10/10 22:00):

- Noite 2 (dom 11/10 22:00): aparecem "Culto às margens do Guaíba" e a mensagem do Padre Júlio "Vi luzes no Guaíba. Não vão sozinhos."
- Noite 3 (seg 12/10 22:00): o prazo do Lobisomem (13/10 06:00) ainda não passou. Para mostrar uma expiração, a noite 3 soma 36h em vez de 24h, indo para ter 13/10 10:00, e o Lobisomem fica Expirada. A soma por noite fica numa lista `NIGHT_OFFSETS_HOURS = [0, 24, 60]` dentro de `demoSync.js`.

As chaves da demo: `ihunt.demo.active`, `ihunt.demo.night`, `ihunt.demo.hunterId`, `ihunt.demo.readMessages`, `ihunt.demo.lastCampaign`, `ihunt.demo.introSeen`.

### Estado (`src/store/campaign.js`)

- Novo campo `demo`: `null` fora da demo; `{ night, lastNight }` dentro dela.
- Novos thunks: `advanceNight`, `restartDemo` e `exitDemo`.
  - `advanceNight` e `restartDemo` chamam a sync e despacham o resultado de `load()`.
  - `exitDemo` chama `sync.exit()` e recarrega a página em `/`.
- Novo campo `demoChanges`: o que apareceu na última noite avançada (`{ missions: number, messages: number }`). É calculado comparando as missões e mensagens visíveis antes e depois.

## Interface

### Cartão de boas-vindas (`src/components/DemoWelcome.jsx`)

- Aparece uma vez por sessão (`ihunt.demo.introSeen`), antes da escolha de hunter, sobre o fundo escuro.
- Em inglês. Diz que o iHunt é um app companheiro para o RPG de mesa iHunt, desenhado como um app de bico onde o trabalho é caçar monstros. Lista o que testar: escolher um hunter, abrir uma caça, ler as mensagens e apertar "Avançar a noite".
- Botão "Start demo": fecha o cartão e começa a entrada animada.

### Faixa da demo (`src/components/DemoBar.jsx`)

- Barra fina no topo de todas as telas do jogador enquanto `demo` não é `null`. Na Visão do GM ela não aparece.
- Conteúdo: "Demo · Noite N", botão laranja "Avançar a noite" (ou "Recomeçar demo" na última noite) e link "Sair".
- Estilo Turno: fundo `--painel`, borda `--linha`, laranja só no botão.

### Avançar a noite

- O relógio da campanha muda.
- Pinos de missões novas no mapa entram com a animação `pin-reveal` que já existe.
- Um aviso curto (`role="status"`) diz o que mudou, por exemplo "Nova caça no mapa · 1 mensagem nova". Sem mudanças: "A noite passou. Nada novo por enquanto."

### Tela sem campanha (`src/components/CampaignStatus.jsx`)

- Recebe um botão opcional. Na situação "Você ainda não está numa campanha", mostra "Ver demonstração".

### Erro na demo

- A tela "Não foi possível carregar a campanha" ganha, no modo demo, os botões "Tentar de novo" e "Sair da demo".

## Offline

- `exemplo-campanha.json` entra no `includeAssets` do PWA (`pwa.config.js`), para a demo funcionar sem internet depois da primeira visita.

## Testes

Unidade (`src/campaign/demoSync.test.js`):

- `load()` devolve a campanha de exemplo com `status: 'ready'`.
- A data muda conforme `NIGHT_OFFSETS_HOURS` a cada `advanceNight()`, e para em `LAST_NIGHT`.
- `restart()` volta para a noite 1 e limpa hunter e mensagens lidas da demo.
- Hunter e mensagens lidas ficam só em chaves `ihunt.demo.*`.
- `exit()` remove as chaves da demo e não toca nas chaves reais.
- Sem rede e sem cópia salva, `load()` devolve `status: 'error'`.

Telas (Testing Library, `renderApp` ganha a opção `demo`):

- `/demo` mostra o cartão em inglês.
- Depois de "Avançar a noite", "Culto às margens do Guaíba" aparece em Caças.
- "Sair da demo" chama a saída e o app volta para a tela sem campanha.
- A tela sem campanha mostra o botão "Ver demonstração".
- Um Convite na URL desliga a demo.

No navegador: filmar uma vez o fluxo inteiro (cartão, entrada, escolher hunter, avançar a noite duas vezes, sair) antes de entregar.
