# Guia do GM

Este guia mostra como montar a campanha, publicá-la e levar os jogadores até ela. Tudo o que os jogadores veem sai do arquivo da campanha, e você é a única fonte da verdade. O app dos jogadores só lê esse arquivo; quem escreve é você, pelo Editor da campanha ou subindo o arquivo à mão.

Você pode montar o arquivo pelo **Editor da campanha**, dentro do app (seção 2), ou escrevê-lo à mão (seções 1 e 3). Para publicar pelo Editor, configure o bucket uma vez (seção 5).

## 1. A estrutura do arquivo

A campanha é um arquivo JSON com seis partes:

| Parte | O que é |
|---|---|
| `campaign` | Nome e **data da campanha** (o "agora" da ficção). |
| `hunters` | Os hunters. Cada jogador escolhe um deles no app. |
| `missions` | As missões, com local, valor, risco, hunters e resultado. |
| `npcs` | Os NPCs que mandam mensagens. |
| `messages` | As mensagens dos NPCs para todos os hunters ou para hunters específicos. |
| `$schema` | Onde o editor encontra o schema para validar o arquivo. |

O jeito mais rápido de começar é copiar a campanha de exemplo: `https://<endereço do app>/exemplo-campanha.json`. Ela usa tudo o que o formato permite.

Cada campo está explicado no próprio schema (`https://<endereço do app>/campaign.schema.json`). Os pontos que mais confundem:

- **Datas** vão sempre com fuso, ex.: `"2026-10-10T22:00:00-03:00"`.
- **Ids** (`id`) ligam as partes: uma missão lista os hunters dela pelo id, e uma mensagem aponta para o NPC pelo id. Não mude o `id` de uma mensagem depois de publicá-la, porque é por ele que o app sabe o que cada jogador já leu.
- **Estado da missão** é calculado pelo app:
  - **Concluída** ou **Fracassada**: quando você preenche `result`.
  - **Em andamento**: quando a missão tem `hunters`.
  - **Expirada**: quando a data da campanha passa do `deadline` e a missão continua sem hunters.
  - **Disponível**: no resto.
- **Ganhos** de um hunter: o `value` de cada missão Concluída, dividido igualmente entre os hunters dela.
- **Posição no mapa** (`position`): opcional. Clique com o botão direito no lugar, no Google Maps ou no OpenStreetMap, e copie os dois números: `"position": { "lat": -30.0386, "lng": -51.2155 }`. Missão sem posição aparece só na lista, fora do mapa.
- **Mensagens**: `"to": "all"` vai para todos os hunters; `"to": ["ana", "beto"]` vai só para esses. Um jogador nunca vê mensagem enviada só para outros hunters.

## 2. Editar pelo Editor da campanha

O Editor da campanha monta o arquivo por formulários e cuida de ids, fusos e referências. Ele funciona só no computador: no celular, `/gm/editor` mostra "Abra no computador para editar".

**Abrir.** Na Visão do GM, use **Editar**, ou abra `https://<endereço do app>/gm/editor`. Se o aparelho já abriu um Convite, o editor carrega a campanha publicada. Sem campanha, ou em **Trocar rascunho**, escolha:

- **Carregar a campanha publicada** ou cole o **endereço do arquivo no R2**;
- **Abrir arquivo do computador**, para continuar um arquivo feito fora do app;
- **Começar em branco**.

O que você edita é o **Rascunho**. Ele fica salvo no navegador a cada mudança: pode fechar a aba e voltar depois. Antes de carregar outra campanha, o editor pergunta "Substituir o rascunho atual?". **Descartar** apaga o rascunho.

**Editar.** À esquerda ficam as seções (Campanha, Hunters, Missões, NPCs, Mensagens) com os itens; o item escolhido abre à direita. Use **+** para adicionar.

- O **id** é criado sozinho a partir do nome (ex.: "João da Silva" vira `joao-da-silva`) e não muda quando você renomeia.
- **Datas** são digitadas sem fuso: o editor usa o fuso da data da campanha.
- **Missões**: hunters e "perto" se escolhem por lista; a posição se escolhe clicando no mapa (ou colando "latitude, longitude"); arraste as missões na lista para mudar a ordem que os jogadores veem.
- **Apagar um hunter** mostra onde ele aparece e o tira de todas as missões e mensagens. Um NPC com mensagens não pode ser apagado.
- Missões e mensagens com horário depois da data da campanha mostram **Agendado**. No topo, **Avançar até o próximo agendado** leva a data da campanha até o próximo deles.

**Erros.** O topo mostra quantos erros o rascunho tem e a lista deles. Clique num erro para abrir o item com o problema.

**Publicar.** **Publicar** grava o Rascunho no bucket, e em cerca de 30 segundos os jogadores veem a mudança. Só funciona sem erros. O arquivo publicado é igual ao do **Baixar** (com a linha `$schema` e formatado). O editor nunca publica sozinho: só quando você clica.

- **Nome do arquivo.** Se o Rascunho veio da campanha publicada, ele publica no mesmo arquivo, sem perguntar. Num Rascunho em branco ou aberto do computador, a primeira publicação pede o "Nome do arquivo no bucket", já preenchido com o nome do arquivo. Use só letras minúsculas, números e `-`, terminando em `.json` (ex.: `noites.json`). Se o nome for o da campanha aberta neste aparelho, o editor avisa "Esse é o arquivo que os jogadores leem. Publicar vai substituir a campanha deles." e o botão vira **Substituir**; senão, é **Continuar**. Depois disso, esse Rascunho publica sempre nesse nome.
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

**Baixar** também só funciona sem erros e salva o arquivo no computador, com o nome do arquivo que você abriu (ou `campanha.json` num Rascunho em branco). Use para guardar uma cópia ou para subir à mão (seção 5).

## 3. Validar no editor de texto

Coloque esta linha no topo do arquivo:

```json
"$schema": "https://<endereço do app>/campaign.schema.json",
```

Editores como o VS Code passam a sublinhar os erros e a mostrar a explicação de cada campo ao passar o mouse. Se preferir trabalhar offline, baixe o schema para a mesma pasta do arquivo e use `"$schema": "./campaign.schema.json"`.

O app valida de novo ao ler. Se o arquivo publicado tiver erro, os jogadores continuam vendo a última versão válida, e a Visão do GM mostra cada erro com o campo e o motivo.

## 4. Avançar a data da campanha

`campaign.date` é o "agora" da ficção. Prazos e horários usam essa data, não o relógio real, então nada expira entre uma sessão e outra.

Missões com `postedAt` e mensagens com `sentAt` **depois** da data da campanha ficam **agendadas**: os jogadores não as veem. Para preparar uma cena:

1. Antes da sessão, escreva a mensagem ou a missão com um horário depois da data da campanha.
2. Na hora certa, avance `campaign.date` até esse horário e publique de novo. No Editor da campanha, use **Avançar até o próximo agendado** e **Publicar**.

Em até cerca de 30 segundos, o conteúdo aparece no app dos jogadores, sem eles recarregarem nada.

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

## 6. Gerar o Convite

O Convite é o link do app com o endereço do arquivo:

```
https://<endereço do app>/?campanha=<endereço do arquivo, codificado>
```

Você não precisa montar esse link à mão. Depois de **Publicar**, o Editor da campanha já mostra o Convite com **Copiar**. Para pegá-lo de novo depois:

1. Abra o Convite uma vez no seu aparelho, ou abra `https://<endereço do app>/gm?campanha=<endereço do arquivo>`.
2. Na **Visão do GM** (`https://<endereço do app>/gm`), use **Copiar** no campo do Convite.
3. Mande o link para os jogadores.

Ao abrir o Convite, cada jogador escolhe o hunter dele. Se o aparelho já estiver em outra campanha, o app pergunta antes de trocar.

A Visão do GM não aparece na navegação dos jogadores e não tem senha. Nela você vê a data da campanha, todos os hunters com avaliação e ganhos, todas as missões (inclusive as agendadas) e os erros do arquivo, quando houver.
