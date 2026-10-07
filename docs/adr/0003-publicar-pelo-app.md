---
status: accepted
---

# Publicar pelo app, protegido por uma senha única

O Editor da campanha grava a campanha direto no bucket do R2, sem o GM abrir o painel da Cloudflare. A escrita passa pelo mesmo Worker que serve o app, na rota `PUT /api/campanhas/<nome>.json`, e só é aceita com a senha certa: um secret do Worker (`PUBLISH_TOKEN`) que o GM cola uma vez no Editor. Escolhemos uma senha e não o Cloudflare Access porque a mesa tem um GM só: a senha não pede conta, política de acesso nem domínio próprio, e funciona no domínio que o app já usa. A leitura não muda: os jogadores continuam lendo o arquivo pelo endereço público do bucket, e o app continua sem nenhuma conta de jogador.

## Consequences

- Substitui a consequência "o app nunca escreve nada remotamente" do ADR 0001. Agora o Editor escreve; o resto do app continua só lendo.
- A senha fica no `localStorage` do navegador do GM (`ihunt.editor.publishToken`). Quem usar esse navegador pode publicar. Aceitamos o risco: é o computador do GM, e trocar a senha (`wrangler secret put PUBLISH_TOKEN`) corta o acesso de quem a tinha.
- Quem tiver a senha pode sobrescrever qualquer campanha do bucket. Por isso o Worker guarda a versão anterior em `historico/<nome>/<data ISO>.json` e mantém as 20 mais recentes de cada campanha.
- O Worker só aceita nomes `<nome>.json` na raiz (letras minúsculas, números e `-`), corpo de até 1 MB e JSON válido. Ele não valida o schema: o Editor só publica sem erros, e os jogadores ignoram um arquivo inválido.
- A comparação da senha é em tempo constante, mas não há limite de tentativas. Uma senha longa e aleatória é o que protege.
- Subir o arquivo à mão pelo painel continua funcionando, como alternativa.

## Considered Options

- Cloudflare Access na rota `/api/*`: login de verdade e sem segredo no navegador, mas pede configurar conta, aplicação e política, e não ganha nada com um GM só. Fica para quando houver mais de um GM.
- Escrever no bucket direto do navegador com credenciais do R2: exporia uma chave com acesso ao bucket inteiro, sem histórico nem limite de nome.
- GitHub + Action copiando para o R2 (ADR 0001): histórico pronto, mas o GM sairia do app para editar.
