---
status: accepted
---

# Data da campanha em vez do relógio real

Prazos de missões e horários de mensagens usam a **data da campanha**, um "agora" da ficção que o GM define e avança no JSON, e não o relógio real (`Date.now()`). Mesas jogam em sessões espaçadas (ex.: semanais); com o relógio real, uma missão com prazo de "1 dia" expiraria entre sessões sem nenhum tempo ter passado na ficção. Como consequência, mensagens e missões com horário posterior à data da campanha ficam ocultas até o GM avançar a data, o que lhe permite preparar uma cena antes da sessão e liberá-la com uma única edição (o conteúdo agendado continua legível por quem abrir o JSON, ver ADR 0001).
