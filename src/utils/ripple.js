import anime from 'animejs/lib/anime.es.js'

export function ripple(element, event) {
  
  const ripple = document.createElement('span')
  ripple.classList.add('ripple')
  element.appendChild(ripple)
  element.classList.add('ripple-parent')

  const rect = element.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  const size = Math.max(rect.width, rect.height) * 2
  const half = size / 2

  ripple.style.width = `${size}px`
  ripple.style.height = `${size}px`
  ripple.style.left = `${x - half}px`
  ripple.style.top = `${y - half}px`

  return anime({
    targets: ripple,
    opacity: [1, 0],
    scale: [0, 1],
    duration: 500,
    easing: 'easeInOutSine',
    complete: () => {
      ripple.remove()
      element.classList.remove('ripple-parent')
    }
  }).finished
}