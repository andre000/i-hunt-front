export function formatBRL(value) {
  const [whole, cents] = value.toFixed(2).split('.')
  return `R$ ${whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${cents}`
}
