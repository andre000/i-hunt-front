export function formatBRL(value) {
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}
