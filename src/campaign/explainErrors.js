import { draftErrors, SECTIONS } from './draft'

const FIELDS = {
  name: ['Nome', 'o nome'],
  date: ['Data da campanha', 'a data da campanha'],
  avatar: ['Avatar', 'o avatar'],
  rating: ['Avaliação', 'a avaliação'],
  location: ['Local', 'o local'],
  value: ['Valor', 'o valor'],
  risk: ['Risco', 'o risco'],
  deadline: ['Prazo', 'o prazo'],
  postedAt: ['Publicação', 'a publicação'],
  lat: ['Latitude', 'a latitude'],
  lng: ['Longitude', 'a longitude'],
  npc: ['NPC', 'o NPC'],
  sentAt: ['Hora', 'a hora'],
  text: ['Texto', 'o texto'],
  id: ['Id', 'o id'],
}

const NAME_LENGTH = 28

function shortName(text) {
  if (text.length <= NAME_LENGTH) return text
  const cut = text.slice(0, NAME_LENGTH)
  return `${cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : NAME_LENGTH)}…`
}

function placeOf(draft, section, index) {
  const item = draft[section][index]
  const name = [item?.name, item?.text].find(value => typeof value === 'string' && value.trim() !== '')
  const label = name ? `“${shortName(name)}”` : item?.id ?? `#${index + 1}`
  return { where: `${SECTIONS[section].place} ${label}`, target: { section, index } }
}

function plainMessage({ path, message, kind }, field) {
  if (/^\/messages\/\d+\/to$/.test(path)) return 'Escolha pelo menos um destinatário.'
  if (kind === 'reference') return message
  const [label, withArticle] = FIELDS[field] ?? []
  if (!label) return message
  if (kind === 'required') return `Falta ${withArticle}.`
  if (kind === 'minLength') return `${label}: não pode ficar vazio.`
  return `${label}: ${message}`
}

function explain(draft, error) {
  const { path } = error
  if (path === '/hunters') {
    return { path, where: 'Hunters', message: 'Adicione pelo menos um hunter.', target: { section: 'hunters', adding: true } }
  }
  const [section, index, ...rest] = path.split('/').slice(1)
  const field = [index, ...rest].filter(part => part && !/^\d+$/.test(part)).at(-1)
  const place = Object.hasOwn(SECTIONS, section) && /^\d+$/.test(index ?? '') && draft[section][Number(index)] !== undefined
    ? placeOf(draft, section, Number(index))
    : { where: section === 'campaign' ? 'Campanha' : 'Arquivo', target: { section: 'campaign' } }
  return { path, ...place, message: plainMessage(error, field) }
}

export function explainErrors(draft) {
  const seen = new Set()
  return draftErrors(draft)
    .map(error => explain(draft, error))
    .filter(({ path, message }) => {
      const key = `${path}|${message}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}
