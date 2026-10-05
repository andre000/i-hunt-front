# Guia do GM

Este guia mostra como montar a campanha, publicá-la e levar os jogadores até ela. O app #iHunt só lê o arquivo da campanha: tudo o que os jogadores veem sai dele, e você é a única fonte da verdade.

Você pode montar o arquivo pelo **Editor da campanha**, dentro do app (seção 2), ou escrevê-lo à mão (seções 1 e 3).

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

**Baixar e publicar.** **Baixar** só funciona sem erros. O arquivo sai com o mesmo nome do publicado (ou `campanha.json`), com a linha `$schema` e formatado. Envie esse arquivo para o R2 como na seção 5. O aviso **Mudanças não baixadas** lembra que o rascunho mudou depois do último download. O editor nunca publica sozinho.

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
2. Na hora certa, avance `campaign.date` até esse horário e publique de novo. No Editor da campanha, use **Avançar até o próximo agendado** e baixe o arquivo.

Em até cerca de 30 segundos, o conteúdo aparece no app dos jogadores, sem eles recarregarem nada.

## 5. Publicar no Cloudflare R2

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

## 6. Gerar o Convite

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
