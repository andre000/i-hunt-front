# Guia do GM

Este guia mostra como montar a campanha, publicá-la e levar os jogadores até ela. O app #iHunt só lê o arquivo da campanha: tudo o que os jogadores veem sai dele, e você é a única fonte da verdade.

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
- **Mensagens**: `"to": "all"` vai para todos os hunters; `"to": ["ana", "beto"]` vai só para esses. Um jogador nunca vê mensagem enviada só para outros hunters.

## 2. Validar no editor

Coloque esta linha no topo do arquivo:

```json
"$schema": "https://<endereço do app>/campaign.schema.json",
```

Editores como o VS Code passam a sublinhar os erros e a mostrar a explicação de cada campo ao passar o mouse. Se preferir trabalhar offline, baixe o schema para a mesma pasta do arquivo e use `"$schema": "./campaign.schema.json"`.

O app valida de novo ao ler. Se o arquivo publicado tiver erro, os jogadores continuam vendo a última versão válida, e a Visão do GM mostra cada erro com o campo e o motivo.

## 3. Avançar a data da campanha

`campaign.date` é o "agora" da ficção. Prazos e horários usam essa data, não o relógio real, então nada expira entre uma sessão e outra.

Missões com `postedAt` e mensagens com `sentAt` **depois** da data da campanha ficam **agendadas**: os jogadores não as veem. Para preparar uma cena:

1. Antes da sessão, escreva a mensagem ou a missão com um horário depois da data da campanha.
2. Na hora certa, avance `campaign.date` até esse horário e publique de novo.

Em até cerca de 30 segundos, o conteúdo aparece no app dos jogadores, sem eles recarregarem nada.

## 4. Publicar no Cloudflare R2

Configuração, uma vez só:

1. No painel da Cloudflare, abra **R2** e crie um bucket (ex.: `ihunt`).
2. No bucket, vá em **Settings → Public Development URL**, selecione **Enable**, digite `allow` e confirme. O bucket ganha um endereço `https://pub-<código>.r2.dev`.
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

Para publicar a campanha, envie o arquivo (ex.: `campanha.json`) para o bucket pelo painel da Cloudflare, usando a opção de upload da página do bucket. O endereço dele fica `https://pub-<código>.r2.dev/campanha.json`. Para cada mudança, envie o arquivo de novo com o mesmo nome.

Atenção: qualquer pessoa com esse endereço lê o arquivo inteiro, inclusive o conteúdo agendado. Não guarde segredos nele. A Cloudflare indica o `r2.dev` para uso fora de produção e limita o número de acessos, o que não é problema para uma mesa.

## 5. Gerar o Convite

O Convite é o link do app com o endereço do arquivo:

```
https://<endereço do app>/?campanha=<endereço do arquivo, codificado>
```

Você não precisa montar esse link à mão:

1. Abra o Convite uma vez no seu aparelho, ou abra `https://<endereço do app>/gm?campanha=<endereço do arquivo>`.
2. Na **Visão do GM** (`https://<endereço do app>/gm`), use **Copiar** no campo do Convite.
3. Mande o link para os jogadores.

Ao abrir o Convite, cada jogador escolhe o hunter dele. Se o aparelho já estiver em outra campanha, o app pergunta antes de trocar.

A Visão do GM não aparece na navegação dos jogadores e não tem senha. Nela você vê a data da campanha, todos os hunters com avaliação e ganhos, todas as missões (inclusive as agendadas) e os erros do arquivo, quando houver.
