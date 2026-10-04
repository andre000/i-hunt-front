---
status: accepted
---

# Campanha como JSON estático no Cloudflare R2, só leitura

Cada campanha é um arquivo JSON num bucket do Cloudflare R2, exposto pelo subdomínio público `r2.dev`, editado pelo GM e lido pelo app; o app nunca escreve nada remotamente. Escolhemos isso para ter um "backend leve", sem servidor, contas ou custos, numa mesa entre amigos, e escolhemos o R2 (e não o GitHub) porque o `r2.dev` não passa pelo cache da Cloudflare, então mensagens de NPC aparecem na próxima leitura em vez de até 5 minutos depois. O GM é a única fonte da verdade: hunters, missões (inclusive quem está em cada uma), NPCs e mensagens vivem no JSON; o que é só do jogador (qual hunter ele é, mensagens lidas) fica no aparelho.

## Consequences

- O bucket precisa de uma política de CORS que permita o domínio do app.
- O `r2.dev` é descrito pela Cloudflare como "não para produção" e com limite de taxa (centenas de requisições/segundo); irrelevante para uma mesa, mas é o primeiro ponto a revisar se o uso crescer (domínio próprio).
- O GM edita subindo o arquivo de novo; não verificamos se há histórico de versões nem edição pelo painel.
- Não há segredos: qualquer jogador com a URL lê o JSON inteiro, então o GM só publica o que já foi revelado.
- Nada do jogador chega ao GM: sem respostas a NPCs, sem aceite de missão pelo app, sem chat entre jogadores.
- Qualquer jogador pode escolher qualquer hunter (não há autenticação).
- Evolução natural: um Cloudflare Worker escrevendo no mesmo bucket permitiria edição pelo app sem trocar de hospedagem.

## Considered Options

- Arquivo num repositório do GitHub via `raw.githubusercontent.com`: CORS aberto e edição cômoda com histórico, mas cache de 5 minutos (`max-age=300`) que ignora query string; atrasaria as mensagens de NPC.
- GitHub + Action copiando para o R2: histórico e pouca latência, mas exige configurar credenciais; fica para quando o GM sentir falta de desfazer edições.
- Backend com escrita (API + banco): contradiz o objetivo de backend leve.
- JSON na pasta `public/` do app: cada edição exigiria commit + deploy e prenderia uma campanha ao app.
- Google Drive: o download direto provavelmente não envia CORS para `fetch` do navegador (não verificado).
