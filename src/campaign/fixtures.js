export function validCampaign() {
  return {
    campaign: { name: 'Noite em Porto Alegre', date: '2026-10-04T21:00:00-03:00' },
    hunters: [
      { id: 'ana', name: 'Ana', avatar: 'https://example.com/ana.png', rating: 4.5 },
      { id: 'beto', name: 'Beto' },
    ],
    npcs: [
      { id: 'dona-rosa', name: 'Dona Rosa' },
      { id: 'padre', name: 'Padre Júlio', avatar: 'https://example.com/padre.png' },
    ],
    messages: [
      { id: 'msg1', npc: 'dona-rosa', to: 'all', sentAt: '2026-10-04T18:00:00-03:00', text: 'Tem algo no parque.' },
      { id: 'msg2', npc: 'padre', to: ['ana'], sentAt: '2026-10-04T19:00:00-03:00', text: 'Ana, venha à igreja.' },
      { id: 'msg3', npc: 'dona-rosa', to: ['beto'], sentAt: '2026-10-04T19:30:00-03:00', text: 'Beto, só para você.' },
      { id: 'msg4', npc: 'dona-rosa', to: ['ana'], sentAt: '2026-10-04T20:00:00-03:00', text: 'Ana, cuidado.' },
      { id: 'msg5', npc: 'padre', to: 'all', sentAt: '2026-10-04T23:00:00-03:00', text: 'Ainda não.' },
    ],
    missions: [
      {
        id: 'm1',
        name: 'Lobisomem no Bom Fim',
        description: 'Algo anda atacando cachorros no parque.',
        location: 'Bom Fim',
        value: 800,
        risk: 'alto',
        tags: ['lobisomem'],
        featured: true,
        nearHunters: ['ana'],
      },
      {
        id: 'm2',
        name: 'Fantasma no ônibus T5',
        location: 'Centro',
        value: 150.5,
        risk: 'baixo',
        nearHunters: ['ana', 'beto'],
      },
      {
        id: 'm3',
        name: 'Vampiro no bar',
        location: 'Cidade Baixa',
        value: 400,
        risk: 'médio',
      },
    ],
  }
}
