---
name: iHunt
description: O lado do trabalhador de um app de bico noturno, só que para caçar monstros.
colors:
  laranja: "#ff6b1a"
  laranja-forte: "#ff8240"
  laranja-fundo: "rgb(255 107 26 / 14%)"
  tinta-sobre-laranja: "#120700"
  perigo: "#ff6b6b"
  perigo-fundo: "rgb(255 107 107 / 14%)"
  aviso: "#f2b33d"
  aviso-fundo: "rgb(242 179 61 / 14%)"
  ok: "#4fd18b"
  ok-fundo: "rgb(79 209 139 / 14%)"
  asfalto: "#0c0e11"
  mapa-noite: "#111419"
  painel: "#15181d"
  painel-2: "#1d2128"
  linha: "#2a2f37"
  texto: "#eef1f4"
  apagado: "#8d96a3"
typography:
  display:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.4
  body-sm:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
  caption:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
  nav:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
  money-display:
    fontFamily: "Geist Mono, ui-monospace, Menlo, monospace"
    fontSize: "26px"
    fontWeight: 700
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
  money:
    fontFamily: "Geist Mono, ui-monospace, Menlo, monospace"
    fontSize: "14px"
    fontWeight: 500
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
rounded:
  control: "12px"
  button: "14px"
  card: "16px"
  bubble: "18px"
  sheet: "24px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  row: "14px"
  gutter: "16px"
  section: "20px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.laranja}"
    textColor: "{colors.tinta-sobre-laranja}"
    rounded: "{rounded.button}"
    padding: "10px 18px"
  button-primary-hover:
    backgroundColor: "{colors.laranja-forte}"
    textColor: "{colors.tinta-sobre-laranja}"
  button-cta:
    backgroundColor: "{colors.laranja}"
    textColor: "{colors.tinta-sobre-laranja}"
    rounded: "{rounded.button}"
    height: "52px"
    width: "100%"
  button-secondary:
    backgroundColor: "{colors.painel-2}"
    textColor: "{colors.texto}"
    rounded: "{rounded.button}"
    padding: "10px 18px"
  button-secondary-hover:
    backgroundColor: "{colors.linha}"
  icon-button:
    backgroundColor: "{colors.painel-2}"
    textColor: "{colors.texto}"
    rounded: "{rounded.control}"
    size: "40px"
  chip:
    backgroundColor: "{colors.painel-2}"
    textColor: "{colors.apagado}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
    typography: "{typography.caption}"
  chip-live:
    backgroundColor: "{colors.laranja-fundo}"
    textColor: "{colors.laranja}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  chip-risco-medio:
    backgroundColor: "{colors.aviso-fundo}"
    textColor: "{colors.aviso}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  chip-risco-alto:
    backgroundColor: "{colors.perigo-fundo}"
    textColor: "{colors.perigo}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  filter-chip:
    backgroundColor: "{colors.painel-2}"
    textColor: "{colors.apagado}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  filter-chip-pressed:
    backgroundColor: "{colors.laranja-fundo}"
    textColor: "{colors.laranja}"
  campaign-clock:
    backgroundColor: "{colors.painel}"
    textColor: "{colors.texto}"
    rounded: "{rounded.pill}"
    padding: "7px 12px"
    typography: "{typography.label}"
  panel:
    backgroundColor: "{colors.painel}"
    textColor: "{colors.texto}"
    rounded: "{rounded.card}"
    padding: "16px"
  bottom-sheet:
    backgroundColor: "{colors.painel}"
    textColor: "{colors.texto}"
    rounded: "{rounded.sheet}"
    padding: "10px 18px 16px"
  message-bubble:
    backgroundColor: "{colors.painel-2}"
    textColor: "{colors.texto}"
    rounded: "{rounded.bubble}"
    padding: "10px 12px 8px"
  nav-tab:
    backgroundColor: "{colors.painel}"
    textColor: "{colors.apagado}"
    typography: "{typography.nav}"
    padding: "4px 10px"
  nav-tab-active:
    textColor: "{colors.texto}"
  badge:
    backgroundColor: "{colors.laranja}"
    textColor: "{colors.tinta-sobre-laranja}"
    rounded: "{rounded.pill}"
    height: "18px"
---

# Design System: iHunt

## Overview

**Creative North Star: "Turno da Noite"**

O app do jogador é o lado do trabalhador de um app de corrida à noite: o motorista olhando o celular no painel do carro, não o cliente pedindo comida. Tudo é asfalto quase preto e painéis grafite separados por linhas finas; o laranja aparece só onde algo está ao vivo, selecionado ou pedindo um toque. A seriedade comercial é o ponto: nenhum enfeite de terror, nenhuma textura de RPG, só um produto de bico bem acabado que por acaso lista lobisomens.

A densidade é de ferramenta de trabalho. Linhas de lista com divisórias em vez de cartões empilhados, valores em mono tabular alinhados à direita, rótulos curtos em caixa normal. A Início é um mapa escuro de tela cheia com uma folha que sobe por baixo; as demais telas são uma coluna única com cabeçalho fino e a nav de quatro abas no pé. Tempo é sempre o tempo da campanha, mostrado na pílula do relógio com um ponto laranja e materializado no anel de prazo.

O movimento é curto e com freio (curva de saída expo), sempre com alternativa para quem pede movimento reduzido. O único movimento contínuo é o pulso da caça disponível no mapa.

A Visão do GM (`src/routes/gm`) usa o mesmo sistema, pensada primeiro para o notebook: lateral com hunters (que filtram a tela), NPCs e Convite; uma linha do tempo única de missões e mensagens cortada pela marca laranja "Agora"; e o mapa ao lado. O que está agendado aparece com contorno tracejado, nunca em amarelo, porque amarelo é risco médio.

**Key Characteristics:**
- Escuro de verdade: asfalto, painel e painel-2 como três degraus de superfície, separados por linha de 1px.
- Laranja como sinal, não como tema.
- Geist para texto, Geist Mono tabular para dinheiro e horário.
- Risco e desfecho em cores semânticas próprias, nunca no laranja.
- Prazo como anel e barra que correm pela data da campanha.

## Colors

Paleta noturna de três superfícies grafite, um sinal laranja e três cores semânticas, cada uma com um fundo de 14% de opacidade para chips.

### Primary
- **Laranja Sinal** (`laranja`): o "ao vivo" do app. Botão principal, ponto do relógio da campanha, caça disponível (pino, rótulo de estado), ícone da aba ativa, badge de não lidas, horário de mensagem não lida, filtro pressionado, nome da linha sob hover, preenchimento do anel e da barra de prazo, anel de foco.
- **Laranja Aceso** (`laranja-forte`): só o hover do botão principal.
- **Brasa** (`laranja-fundo`): fundo translúcido de chip ao vivo e de filtro pressionado; halo do ponto do relógio.
- **Tinta sobre Laranja** (`tinta-sobre-laranja`): texto e ícones sobre qualquer preenchimento laranja (botão, badge, seleção de texto). Nunca branco sobre laranja.

### Secondary
- **Sirene** (`perigo`, `perigo-fundo`): risco alto e missão fracassada.
- **Âmbar de Poste** (`aviso`, `aviso-fundo`): risco médio e a estrela da avaliação do hunter.
- **Verde de Pago** (`ok`, `ok-fundo`): missão concluída.

### Neutral
- **Asfalto** (`asfalto`): fundo de toda tela; também o miolo do pino "em andamento".
- **Mapa Noturno** (`mapa-noite`): chão do mapa e da área da Início antes dos tiles carregarem; contorno que recorta os pinos do mapa.
- **Painel** (`painel`): superfícies elevadas: folha inferior, nav, cartões de recompensa e ganhos, pílulas flutuantes (a 92% de opacidade), hover de linha na caixa de entrada.
- **Painel 2** (`painel-2`): superfícies de controle dentro do painel: botão secundário, botão de voltar, chips neutros, filtros, balões de mensagem, risco baixo.
- **Linha** (`linha`): toda borda e divisória de 1px, trilho do anel, alça da folha, avatar sem foto, hover do botão secundário.
- **Texto** (`texto`): texto principal; também o estado "em andamento".
- **Apagado** (`apagado`): metadados, rótulos, abas inativas, estado "expirada".

### Named Rules
**The Sinal Rule.** Laranja marca o que está vivo, atual ou acionável. Fora o botão principal e o badge, ele aparece como texto, traço, ponto ou fundo de 14%; nunca como preenchimento de superfície ou de cartão.

**The Risco Não É Laranja Rule.** Risco e desfecho usam perigo, aviso e ok. Uma caça disponível de risco alto mostra as duas coisas lado a lado: ponto laranja de "Disponível" e chip vermelho de "Risco alto".

**The Tinta Rule.** Sobre laranja, o texto é a tinta quase preta, nunca branco.

## Typography

**Display Font:** Geist (com ui-sans-serif, system-ui)
**Label/Mono Font:** Geist Mono (com ui-monospace, Menlo), sempre com algarismos tabulares

**Character:** Uma sans geométrica e neutra de app comercial, com títulos em 700 e espaçamento negativo; o mono entra só onde há número que muda, como num painel de corrida.

### Hierarchy
- **Display** (700, 30px, 1.05, -0.03em): nome da caça no detalhe da missão.
- **Headline** (700, 24px, -0.03em): título de tela no cabeçalho; o nome do hunter no Perfil sobe para 26px.
- **Title** (700, 18px, 1.15): nome da caça selecionada na folha da Início; 16px no cabeçalho da conversa.
- **Body** (400, 15px, 1.4): mensagens de NPC e descrição da missão (descrição limitada a 60ch, em apagado).
- **Body small** (500, 14px): linhas de lista, local, estados vazios.
- **Label** (600, 13px): pílula do relógio, títulos de seção em apagado ("Hunters na missão", "Concluídas"), rótulos de cartão.
- **Caption** (600, 12px): chips, rótulo de estado, legendas de filtro, metadados de linha.
- **Nav** (600, 11px): rótulos das abas.
- **Money display** (Geist Mono 700, 26px): recompensa no detalhe; ganhos no Perfil chegam a 32px.
- **Money** (Geist Mono 500, 14px): valor em linhas de lista, alinhado à direita; 15-16px nas pílulas e na folha.

### Named Rules
**The Mono Para Número Rule.** Valor em R$, hora da campanha, contagem de não lidas e o número do anel usam Geist Mono tabular. Texto corrido nunca usa mono.

**The Caixa Normal Rule.** Rótulos e títulos de seção ficam em caixa normal, peso 600, cor apagada. Sem caixa alta espaçada.

## Layout

Coluna única de no máximo 440px centrada, ocupando 100dvh; fora dela o fundo é quase preto. Cada tela é cabeçalho fixo (título à esquerda, relógio da campanha à direita, linha inferior), corpo rolável com 16px de margem lateral e nav fixa no pé. Respeita `safe-area-inset` em cima e embaixo.

A Início é a exceção: mapa escuro ocupando o palco, pílulas de relógio e ganhos flutuando no topo, e uma folha inferior (até 62% da altura) que sobe por cima do mapa com a caça selecionada e as outras caças em linhas.

Listas são linhas de largura total separadas por divisórias de 1px (padding vertical de 12-14px), com nome à esquerda, metadados embaixo e valor mono à direita seguido de chevron. Pilhas verticais usam gaps de 14-22px; grupos de chips, 6px.

### Named Rules
**The Linha Antes de Cartão Rule.** Coleções são linhas com divisória, não cartões. Cartão (painel com borda) é para um único fato destacado: recompensa, ganhos, local com mapa.

## Elevation & Depth

Profundidade é tonal: asfalto, painel e painel-2 em degraus, com borda de 1px na cor linha. Sombras existem só onde algo flutua sobre o mapa: as pílulas do topo e a folha da Início. Controles secundários usam um contorno interno de 1px em vez de borda. Valores exatos em `.impeccable/design.json`.

### Named Rules
**The Só Sobre o Mapa Rule.** Sombra de projeção só em elementos que flutuam sobre o mapa. Cartões e listas no fluxo da página são planos.

## Shapes

Cantos suaves e consistentes por papel: 12px para botões de ícone, 14px para botões, 16px para cartões e pílula de ganhos, 18px para balões (com o canto inferior esquerdo a 6px, apontando para o remetente), 24px no topo da folha inferior, e pílula total para chips, filtros, relógio e badges. Pontos de estado são círculos de 7-8px. O anel de prazo é um traço de 5px com ponta arredondada.

## Components

### Buttons
- **Shape:** cantos suaves (14px), peso 600.
- **Primary:** laranja com tinta quase preta (10px 18px); hover sobe para laranja aceso. A versão CTA da folha da Início ocupa a largura toda, 52px de altura, 16px/700, com seta.
- **Secondary:** painel-2 com contorno interno na cor linha; hover vira linha. Usado em "Trocar de hunter".
- **Icon button:** quadrado de 40px (38px na conversa), cantos de 12px, painel-2, ícone de 20px.
- **Focus:** contorno laranja de 2px com 2px de afastamento, global.

### Chips
- **Neutro:** painel-2 com texto apagado, pílula, 12px/600 (tags da missão, risco baixo).
- **Risco:** médio em âmbar sobre fundo âmbar, alto em vermelho sobre fundo vermelho.
- **Filtro:** pílula com contorno interno; pressionado vira brasa com texto e contorno laranja.
- **Rótulo de estado:** não é chip; é texto 12px/600 com ponto de 7px na cor do estado (disponível laranja, em andamento texto, concluída ok, fracassada perigo, expirada apagado).

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** painel, com borda de 1px na cor linha.
- **Shadow Strategy:** nenhuma (ver Elevation & Depth).
- **Internal Padding:** 14-16px.
- **Uso:** recompensa e ganhos (rótulo 13px apagado sobre valor money-display), local (mapa estático de 150px sobre linha com ícone de pino laranja).

### Navigation
- **Nav inferior:** quatro abas com ícone de contorno de 24px e rótulo de 11px (Mapa, Caças, Mensagens, Perfil) sobre painel com borda superior. Inativa em apagado; ativa com rótulo em texto e ícone em laranja. Badge de não lidas em laranja, mono, recortado do painel por um anel de 2px.
- **Cabeçalho:** título headline à esquerda, relógio da campanha à direita, linha inferior.

### Relógio da Campanha
Pílula de painel a 92% com borda linha: ponto laranja de 8px com halo de brasa, dia em Geist e hora em mono ("Sáb 10 out · 22:00"). Aparece em todo cabeçalho e no topo da Início. É a única representação do "agora".

### Anel de Prazo
Círculo de 62px com trilho na cor linha e traço laranja de 5px que diminui conforme a data da campanha avança (transição de 0.9s). No centro, número em mono 15px e unidade em 11px apagado. No detalhe, o mesmo prazo vira barra de 6px com marcador branco de borda laranja.

### Mapa de Caças
Tiles do OpenStreetMap invertidos e dessaturados até ficarem noturnos. Pinos de 28px com miolo na cor do estado recortado por um anel de mapa noturno; "em andamento" é um anel vazado; o selecionado cresce 1.5x. Só a caça disponível pulsa (2.4s, contínuo; estático a 18% com movimento reduzido).

### Folha Inferior
Painel com topo de 24px, alça de 36x4px, sombra para cima, entra com deslizamento de 0.5s. Caça selecionada em cima (anel, nome, local, valor, risco, CTA), demais caças em linhas.

### Balão de Mensagem
Painel-2, cantos de 18px com o inferior esquerdo a 6px, até 84% da largura, sempre alinhado à esquerda (só NPC fala). Hora em 11px apagado à direita. O rodapé da conversa explica em 12px centrado que não há resposta pelo app.

## Do's and Don'ts

### Do:
- **Do** usar laranja só para o que está vivo, selecionado ou acionável, e tinta quase preta sobre ele.
- **Do** mostrar risco com perigo/aviso e desfecho com ok/perigo/apagado, cada um com seu fundo de 14%.
- **Do** escrever todo valor em R$ e toda hora em Geist Mono tabular, alinhado à direita nas listas.
- **Do** separar itens de coleção com divisórias de 1px na cor linha.
- **Do** usar a curva `cubic-bezier(0.16, 1, 0.3, 1)` para entradas e mudanças de estado, e desligar animação com `prefers-reduced-motion`.
- **Do** mostrar a data da campanha com o relógio, nunca o relógio real.

### Don't:
- **Don't** usar superfícies claras nem cartões claros arredondados no app do jogador; é o visual de delivery que o sistema recusa.
- **Don't** pintar risco, alerta ou erro de laranja.
- **Don't** usar laranja como preenchimento sólido de cartões, cabeçalhos ou fundos (o brilho radial de 8% no palco da Início é atmosfera, não preenchimento).
- **Don't** pôr sombra em cartões e listas que não flutuam sobre o mapa.
- **Don't** usar caixa alta espaçada em rótulos ou títulos de seção.
- **Don't** introduzir enfeite temático de terror ou RPG; o app se leva a sério como produto comercial.
