export function validCampaign() {
  return {
    campaign: { name: 'Noite em Porto Alegre', date: '2026-10-04T21:00:00-03:00' },
    hunters: [
      { id: 'ana', name: 'Ana' },
      { id: 'beto', name: 'Beto' },
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
