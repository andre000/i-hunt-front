---
version: 1
slug: "src-routes-index-lazy-jsx"
primary_target: "src/routes/index.lazy.jsx"
related_targets: ["src/routes"]
---

# App do jogador

Scope: app do jogador (Início, Busca, Missão, Mensagens, Perfil, escolha de hunter, convite, estados). Visitor mode: Operate. Visão do GM fora do escopo; herda depois.

Audience: jogadores de iHunt, no celular, durante e entre sessões. Task: ver o que mudou, achar a caça, ler o NPC.

## Direction contract

THESIS: o app é o lado do trabalhador de um app de corrida à noite (Uber Driver, 99 Motorista), não o lado do cliente de delivery. Recusa o visual de delivery laranja em cartões arredondados claros.

OWN-WORLD: asfalto quase preto, painéis grafite com borda fina, laranja só como sinal "ao vivo" (caça disponível, ação principal, não lido). Geist no texto, Geist Mono em dinheiro e horário. Prazo é um anel que corre pela data da campanha. Risco é cor semântica separada do laranja.

STORY: o hunter abre, vê a data da campanha e os ganhos no topo, a caça disponível sobe numa folha por baixo com o anel de prazo, e toca "Ver caça".

FIRST VIEWPORT: Início com mapa escuro ocupando a tela; pílula da data da campanha no topo à esquerda, pílula de ganhos à direita; folha inferior com anel de prazo, nome da caça, valor em mono, risco, botão laranja largo "Ver caça", e as outras caças em linhas abaixo. Nav de 4 abas com rótulo.

FORM: pick (Turno da Noite, candidato 1 da lista própria), seed key 852173e5. Momento assinatura: caça nova pulsa no mapa; quando o GM avança a data, os anéis andam juntos.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
