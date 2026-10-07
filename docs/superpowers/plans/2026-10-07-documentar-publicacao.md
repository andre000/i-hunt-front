# Documentar a publicação pelo app Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A documentação passa a dizer que o app escreve no bucket: ADR 0003 novo, ADR 0001 apontando para ele, Guia do GM com configurar/publicar/trocar senha/recuperar do histórico, e **Publicar** no glossário (issue #37).

**Architecture:** Só Markdown. Nenhum código muda. Os textos copiam os nomes de botões, mensagens e caminhos que já estão no código (fontes listadas abaixo), então cada task termina com um `grep` que prova que o texto bate com o código.

**Tech Stack:** Markdown. Fontes da verdade: `worker/index.js`, `wrangler.jsonc`, `.env.production`, `src/components/editor/PublishPanel.jsx`, `src/campaign/publisher.js`, `src/routes/gm/editor.lazy.jsx`.

**Spec:** issue #37 (pai: #32, `docs/superpowers/specs/2026-10-06-publicar-pelo-app-design.md`, seção "Documentação")

## Global Constraints

- Português, no tom dos docs atuais: frases curtas, segunda pessoa ("você") no Guia do GM, termos do `GLOSSARY.md` (GM, Rascunho, Convite, Editor da campanha, Visão do GM).
- Textos exatos da interface (copiar como está, com acento e pontuação):
  - Botões: **Publicar**, **Publicando…**, **Baixar**, **Continuar**, **Substituir**, **Cancelar**, **Publicar com esta senha**, **Copiar**.
  - Campos: "Nome do arquivo no bucket", "Senha de publicação".
  - Avisos: "Mudanças não publicadas", "Publicado.", "Use só letras minúsculas, números e -, terminando em .json.", "Esse é o arquivo que os jogadores leem. Publicar vai substituir a campanha deles."
  - Erros: "Senha errada.", "Nome ou arquivo inválido.", "Arquivo grande demais para publicar.", "Não deu para publicar. O rascunho continua salvo."
- Nomes técnicos exatos: binding `CAMPAIGNS`, var `PUBLIC_BASE_URL`, var de build `VITE_PUBLIC_BASE_URL` (em `.env.production`), secret `PUBLISH_TOKEN`, rota `PUT /api/campanhas/<nome>.json`, histórico `historico/<nome>/<data ISO>.json`, limite de 20 cópias, chave `ihunt.editor.publishToken`, limite de 1 MB.
- O endereço público do bucket pode ser o `r2.dev` ou um domínio próprio (o deploy atual usa `https://ihunt-data.4ndr.dev`). O guia fala "endereço público do bucket" e mostra os dois.
- ADR no mesmo formato dos existentes: frontmatter `status: accepted`, título `#`, um parágrafo de decisão, `## Consequences`, `## Considered Options`.
- Commits em Conventional Commits, em inglês, só a linha de título, com `git -c user.name="André Adriano" -c user.email="a000.andre@gmail.com" commit -m "..."`. Sem `Co-Authored-By`.

## Review Focus

1. Texto velho que contradiz o comportamento novo: "Mudanças não baixadas", "O editor nunca publica sozinho" sem contexto, "o app só lê o arquivo", "baixe o arquivo" no passo de avançar a data. O `grep` da Task 2 pega todos.
2. Horário no nome das cópias do histórico é UTC (`toISOString`), não o horário de Brasília. Quem procura "a versão das 21h" precisa saber disso. Coberto no texto da Task 2.
3. Recuperar pelo painel sobrescreve sem guardar cópia; recuperar pelo Editor guarda a versão atual no histórico. O guia recomenda o Editor e diz por quê. Task 2.
4. Trocar a senha: depois do `secret put`, a senha antiga guardada no navegador dá "Senha errada." e o Editor pede a nova. O guia avisa para não estranhar. Task 2.
5. `VITE_PUBLIC_BASE_URL` diferente de `PUBLIC_BASE_URL`: o Editor pede o nome sempre, mesmo para a campanha publicada. O guia diz que os dois têm que ser iguais e precisa de um build novo ao mudar. Task 2.

---

### Task 1: ADR 0003, ADR 0001 e glossário

**Files:**
- Create: `docs/adr/0003-publicar-pelo-app.md`
- Modify: `docs/adr/0001-campanha-em-json-estatico.md`
- Modify: `GLOSSARY.md`

**Interfaces:**
- Consumes: nada.
- Produces: o termo **Publicar** no glossário e o ADR 0003, que a Task 2 cita no Guia do GM.

- [ ] **Step 1: Criar `docs/adr/0003-publicar-pelo-app.md`**

Conteúdo inteiro:

```markdown
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
```

- [ ] **Step 2: Atualizar `docs/adr/0001-campanha-em-json-estatico.md`**

No parágrafo de decisão, troque:

```
editado pelo GM e lido pelo app; o app nunca escreve nada remotamente.
```

por:

```
editado pelo GM e lido pelo app; o app nunca escreve nada remotamente (substituído pelo ADR 0003: o Editor da campanha publica no bucket).
```

Em `## Consequences`, troque a linha:

```
- O GM edita subindo o arquivo de novo; não verificamos se há histórico de versões nem edição pelo painel.
```

por:

```
- O GM edita subindo o arquivo de novo; não verificamos se há histórico de versões nem edição pelo painel. (Hoje o Editor da campanha publica e o Worker guarda o histórico, ver ADR 0003.)
```

E troque a linha:

```
- Evolução natural: um Cloudflare Worker escrevendo no mesmo bucket permitiria edição pelo app sem trocar de hospedagem.
```

por:

```
- Evolução natural: um Cloudflare Worker escrevendo no mesmo bucket permitiria edição pelo app sem trocar de hospedagem. Feito no ADR 0003.
```

Não mude o `status` do ADR 0001: a decisão de ler JSON estático do R2 continua valendo.

- [ ] **Step 3: Atualizar `GLOSSARY.md`**

Na seção `## Ferramentas do GM`, troque a definição do **Editor da campanha**:

```
A tela onde o GM monta e altera o rascunho e o baixa como arquivo da campanha.
```

por:

```
A tela onde o GM monta e altera o rascunho, e o publica ou o baixa como arquivo da campanha.
```

E adicione no fim do arquivo, depois de **Rascunho**:

```markdown

**Publicar**:
Gravar o Rascunho no bucket como a campanha que os jogadores leem, pelo botão **Publicar** do Editor da campanha ou subindo o arquivo à mão.
_Avoid_: salvar, enviar, subir, deploy
```

- [ ] **Step 4: Verificar**

Run:

```bash
grep -n "ADR 0003" docs/adr/0001-campanha-em-json-estatico.md
grep -n "PUBLISH_TOKEN\|historico/<nome>/<data ISO>.json\|ihunt.editor.publishToken\|/api/campanhas/<nome>.json" docs/adr/0003-publicar-pelo-app.md
grep -n "^\*\*Publicar\*\*:" GLOSSARY.md
grep -n "PUBLISH_TOKEN\|historico/\|publishToken\|/api/campanhas/" worker/index.js src/campaign/publisher.js
```

Expected: 3 linhas no 0001; as 4 strings no 0003; 1 linha no glossário; e a última busca mostra os mesmos nomes no código (prova que o ADR bate com o que foi entregue).

- [ ] **Step 5: Commit**

```bash
git add docs/adr/0003-publicar-pelo-app.md docs/adr/0001-campanha-em-json-estatico.md GLOSSARY.md
git -c user.name="André Adriano" -c user.email="a000.andre@gmail.com" commit -m "docs: record publishing from the app in ADR 0003"
```

---

### Task 2: Guia do GM

**Files:**
- Modify: `docs/guia-do-gm.md`

**Interfaces:**
- Consumes: ADR 0003 e o termo **Publicar** da Task 1.
- Produces: nada.

- [ ] **Step 1: Trocar a introdução**

Troque:

```
Este guia mostra como montar a campanha, publicá-la e levar os jogadores até ela. O app #iHunt só lê o arquivo da campanha: tudo o que os jogadores veem sai dele, e você é a única fonte da verdade.

Você pode montar o arquivo pelo **Editor da campanha**, dentro do app (seção 2), ou escrevê-lo à mão (seções 1 e 3).
```

por:

```
Este guia mostra como montar a campanha, publicá-la e levar os jogadores até ela. Tudo o que os jogadores veem sai do arquivo da campanha, e você é a única fonte da verdade. O app dos jogadores só lê esse arquivo; quem escreve é você, pelo Editor da campanha ou subindo o arquivo à mão.

Você pode montar o arquivo pelo **Editor da campanha**, dentro do app (seção 2), ou escrevê-lo à mão (seções 1 e 3). Para publicar pelo Editor, configure o bucket uma vez (seção 5).
```

- [ ] **Step 2: Trocar o parágrafo "Baixar e publicar" da seção 2**

Troque o parágrafo inteiro que começa com `**Baixar e publicar.** **Baixar** só funciona sem erros.` e termina com `O editor nunca publica sozinho.` por:

```markdown
**Publicar.** **Publicar** grava o Rascunho no bucket, e em cerca de 30 segundos os jogadores veem a mudança. Só funciona sem erros. O arquivo publicado é igual ao do **Baixar** (com a linha `$schema` e formatado). O editor nunca publica sozinho: só quando você clica.

- **Nome do arquivo.** Se o Rascunho veio da campanha publicada, ele publica no mesmo arquivo, sem perguntar. Num Rascunho em branco ou aberto do computador, a primeira publicação pede o "Nome do arquivo no bucket", já preenchido com o nome do arquivo. Use só letras minúsculas, números e `-`, terminando em `.json` (ex.: `noites.json`). Se o nome for o da campanha que os jogadores leem, o editor avisa "Esse é o arquivo que os jogadores leem. Publicar vai substituir a campanha deles." e o botão vira **Substituir**; senão, é **Continuar**. Depois disso, esse Rascunho publica sempre nesse nome.
- **Senha.** Na primeira vez, o editor pede a "Senha de publicação" (a do `PUBLISH_TOKEN`, seção 5). Use **Publicar com esta senha**. O navegador guarda a senha; nas próximas vezes, **Publicar** vai direto.
- **Convite.** Depois de "Publicado.", o editor mostra o link de Convite da campanha, com **Copiar**. Mande esse link para os jogadores (seção 6).
- **Mudanças não publicadas** aparece quando o Rascunho mudou depois da última publicação ou download.

Se der errado, o Rascunho continua salvo no navegador:

| Mensagem | O que fazer |
|---|---|
| "Senha errada." | Digite a senha de novo. A senha guardada foi apagada. |
| "Nome ou arquivo inválido." | Confira o nome do arquivo. |
| "Arquivo grande demais para publicar." | O limite é 1 MB. Apague mensagens ou missões antigas. |
| "Não deu para publicar. O rascunho continua salvo." | Confira a internet e tente de novo. |

**Baixar** também só funciona sem erros e salva o arquivo no computador, com o mesmo nome do publicado (ou `campanha.json`). Use para guardar uma cópia ou para subir à mão (seção 5).
```

- [ ] **Step 3: Trocar o passo 2 da seção 4**

Troque:

```
2. Na hora certa, avance `campaign.date` até esse horário e publique de novo. No Editor da campanha, use **Avançar até o próximo agendado** e baixe o arquivo.
```

por:

```
2. Na hora certa, avance `campaign.date` até esse horário e publique de novo. No Editor da campanha, use **Avançar até o próximo agendado** e **Publicar**.
```

- [ ] **Step 4: Reescrever a seção 5**

Troque a seção 5 inteira (do título `## 5. Publicar no Cloudflare R2` até antes de `## 6. Gerar o Convite`) por:

````markdown
## 5. Publicar no Cloudflare R2

### O bucket

Configuração, uma vez só:

1. No painel da Cloudflare, abra **R2** e crie um bucket (ex.: `ihunt`).
2. Dê ao bucket um endereço público. O mais simples: em **Settings → Public Development URL**, selecione **Enable**, digite `allow` e confirme. O bucket ganha um endereço `https://pub-<código>.r2.dev`. Se preferir, ligue um domínio próprio em **Settings → Custom Domains** (ex.: `https://ihunt-data.4ndr.dev`). Neste guia, esse é o **endereço público do bucket**.
3. Ainda em **Settings**, em **CORS Policy**, selecione **Add CORS policy**. Na aba **JSON**, cole o texto abaixo, trocando o endereço pelo do app, e salve:

   ```json
   [
     {
       "AllowedOrigins": ["https://<endereço do app>"],
       "AllowedMethods": ["GET"]
     }
   ]
   ```

   Sem essa política, o navegador bloqueia a leitura e o app mostra "Não foi possível carregar a campanha".

Atenção: qualquer pessoa com o endereço lê o arquivo inteiro, inclusive o conteúdo agendado. Não guarde segredos nele. A Cloudflare indica o `r2.dev` para uso fora de produção e limita o número de acessos, o que não é problema para uma mesa.

### Publicar pelo Editor

Configuração, uma vez só, no código do app:

1. Em `wrangler.jsonc`, `r2_buckets` liga o bucket ao app com o binding `CAMPAIGNS`. Troque `bucket_name` pelo nome do seu bucket.
2. Ainda em `wrangler.jsonc`, em `vars`, ponha em `PUBLIC_BASE_URL` o endereço público do bucket, sem barra no fim.
3. Em `.env.production`, ponha o mesmo endereço em `VITE_PUBLIC_BASE_URL`. Os dois têm que ser iguais: é assim que o Editor reconhece a campanha publicada e publica no mesmo arquivo sem perguntar o nome.
4. Crie a senha. Use uma senha longa e aleatória, porque não há limite de tentativas:

   ```bash
   pnpm wrangler secret put PUBLISH_TOKEN
   ```

   O comando pede a senha. Ela fica guardada na Cloudflare e nunca vai para o git.
5. Publique o app: `pnpm run deploy`. Mudou `VITE_PUBLIC_BASE_URL`? Rode o deploy de novo, porque esse valor entra no build.

Depois disso, use **Publicar** no Editor (seção 2). O endereço do arquivo fica `<endereço público do bucket>/<nome>.json`.

### Trocar a senha

1. Rode `pnpm wrangler secret put PUBLISH_TOKEN` de novo, com a senha nova. Vale na hora, sem deploy.
2. Na próxima vez que você usar **Publicar**, o editor mostra "Senha errada." (era a senha antiga, guardada no navegador) e pede a nova.

Num computador que não é seu, a senha fica guardada no navegador (`ihunt.editor.publishToken`). Para tirá-la de lá, apague os dados do site nas configurações do navegador, ou troque a senha.

### Recuperar uma versão anterior

Antes de cada publicação que substitui uma campanha, o app guarda a versão anterior em `historico/<nome>/<data>.json` (ex.: `historico/noites/2026-10-07T21:30:00.000Z.json`). Ficam as 20 mais recentes de cada campanha. A data está em UTC: `21:30` no nome é 18:30 no horário de Brasília.

1. No painel da Cloudflare, abra o bucket e entre na pasta `historico/<nome>/`.
2. Baixe a cópia que você quer.
3. No Editor da campanha, use **Trocar rascunho → Abrir arquivo do computador** e escolha a cópia.
4. Use **Publicar**, digite o nome da campanha (ex.: `noites.json`) e confirme. Se o aparelho está nessa campanha, o botão é **Substituir**; senão, **Continuar**.

Recuperando pelo Editor, a versão que estava publicada também vai para o histórico, então dá para voltar atrás. Também dá para subir a cópia à mão com o nome `<nome>.json` (abaixo), mas aí a versão substituída não vai para o histórico.

### Subir à mão

Sem configurar a publicação pelo Editor, você ainda pode publicar pelo painel: use **Baixar** no Editor (ou o arquivo escrito à mão) e envie o arquivo (ex.: `campanha.json`) para o bucket, usando a opção de upload da página do bucket. O endereço dele fica `<endereço público do bucket>/campanha.json`. Para cada mudança, envie o arquivo de novo com o mesmo nome.
````

- [ ] **Step 5: Atualizar a seção 6**

Troque:

```
Você não precisa montar esse link à mão:

1. Abra o Convite uma vez no seu aparelho, ou abra `https://<endereço do app>/gm?campanha=<endereço do arquivo>`.
```

por:

```
Você não precisa montar esse link à mão. Depois de **Publicar**, o Editor da campanha já mostra o Convite com **Copiar**. Para pegá-lo de novo depois:

1. Abra o Convite uma vez no seu aparelho, ou abra `https://<endereço do app>/gm?campanha=<endereço do arquivo>`.
```

- [ ] **Step 6: Verificar que nada velho sobrou e que os textos batem com o código**

Run:

```bash
grep -n "não baixadas\|só lê o arquivo da campanha\|e baixe o arquivo\|Baixar e publicar" docs/guia-do-gm.md
```

Expected: nenhuma linha.

Run:

```bash
for s in "Nome do arquivo no bucket" "Senha de publicação" "Publicar com esta senha" "Mudanças não publicadas" "Senha errada." "Nome ou arquivo inválido." "Arquivo grande demais para publicar." "Não deu para publicar. O rascunho continua salvo." "Esse é o arquivo que os jogadores leem. Publicar vai substituir a campanha deles." "Publicado." "ihunt.editor.publishToken"; do
  printf '%s | guia: ' "$s"; grep -cF "$s" docs/guia-do-gm.md | tr -d '\n'
  printf ' | código: '; grep -rlF "$s" src --include='*.jsx' --include='*.js' | grep -v test | head -1
done
```

Expected: cada linha com `guia: 1` ou mais e um arquivo do `src` em `código:`. Uma linha sem arquivo no código quer dizer que o guia inventou um texto: corrija o guia para o texto do código.

Run:

```bash
grep -n "CAMPAIGNS\|PUBLIC_BASE_URL\|VITE_PUBLIC_BASE_URL\|PUBLISH_TOKEN\|historico/" docs/guia-do-gm.md
grep -n "CAMPAIGNS\|PUBLIC_BASE_URL" wrangler.jsonc; cat .env.production
```

Expected: o guia cita os quatro nomes e `historico/`; os mesmos nomes aparecem em `wrangler.jsonc` e `.env.production`.

- [ ] **Step 7: Ler o guia inteiro de cima a baixo**

Abra `docs/guia-do-gm.md` e leia em ordem. Confira: as referências "seção 2", "seção 5" e "seção 6" apontam para o lugar certo; os títulos `###` novos da seção 5 estão em ordem (O bucket, Publicar pelo Editor, Trocar a senha, Recuperar uma versão anterior, Subir à mão); nenhum parágrafo repete outro.

- [ ] **Step 8: Commit**

```bash
git add docs/guia-do-gm.md
git -c user.name="André Adriano" -c user.email="a000.andre@gmail.com" commit -m "docs: explain publishing from the Editor in the GM guide"
```
