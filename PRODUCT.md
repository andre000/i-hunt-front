# Product

<!-- impeccable:product-schema 1 -->

## Platform

web (PWA, mobile-first; o app ocupa no máximo 440px de largura)

## Users

- **Jogador**: pessoa real numa mesa do RPG iHunt. Usa o celular para ver missões, ler mensagens dos NPCs e acompanhar o próprio hunter. Usa durante a sessão e também entre sessões, lendo com calma.
- **GM**: narra a campanha, escreve o arquivo JSON e acompanha tudo pela Visão do GM. Fora do escopo do redesign atual; herda o estilo depois.

## Product Purpose

Companion para mesas de iHunt: o app que os hunters usam dentro da ficção. Mostra missões (caças), mensagens de NPCs e o perfil do hunter, tudo lido de um arquivo de campanha que o GM publica. Sucesso: o jogador sente que está usando o app de bico do mundo do jogo, e acha rápido o que importa na cena.

## Positioning

Dentro da ficção, é um app de bico real, do tipo Uber/iFood, só que para caçar monstros. A sátira do iHunt vem de o app se levar a sério.

## Operating Context

- O GM controla a "data da campanha"; prazos e horários são relativos a ela, não ao relógio real.
- Conteúdo agendado só aparece quando o GM avança a data; o app sincroniza em cerca de 30 segundos.
- Mensagens só vão do NPC para os hunters; o jogador não responde pelo app.
- Entrada por Convite (link); o jogador escolhe um hunter da campanha.

## Capabilities and Constraints

- React 18 + Vite + Emotion + TanStack Router + Redux; ícones Heroicons; animações com animejs.
- Telas do jogador: Início, Busca, Missão, Mensagens (lista e conversa), Perfil, escolha de hunter, confirmação de convite, estados de carregamento/erro.
- Estados de missão: Disponível, Em andamento, Concluída, Fracassada, Expirada. Risco: baixo, médio, alto. Valor em R$.
- Interface em português do Brasil. Termos definidos em `GLOSSARY.md`.

## Brand Commitments

- Nome: iHunt (logo "iHunt" com o "i" destacado).
- O app deve parecer um app comercial de bico de verdade, não um app temático de terror ou RPG (confirmado pelo usuário).

## Evidence on Hand

- Campanha de exemplo: `public/exemplo-campanha.json` ("Noites de Porto Alegre").
- Não há fotos reais de missões; o detalhe da missão hoje usa um placeholder 600×400.

## Product Principles

1. Dentro da ficção, sempre: o app é o produto que os hunters usam, não uma ferramenta de RPG.
2. A piada é a seriedade: a precariedade do bico aparece pelo tom corporativo, não por enfeite de terror.
3. A cena vem primeiro: o que mudou desde a última olhada precisa ser visto em segundos.
4. O GM é a fonte da verdade; o app nunca inventa dado que não está no arquivo da campanha.
