export function createSyncLoop({ load, onResult, setInterval, clearInterval, onReturn, intervalMs = 30000 }) {
  let running = false
  let timer = null
  let stopListening = null

  async function run() {
    if (running) return
    running = true
    try {
      onResult(await load())
    } finally {
      running = false
    }
  }

  return {
    start() {
      run()
      timer = setInterval(run, intervalMs)
      stopListening = onReturn(run)
    },
    stop() {
      clearInterval(timer)
      stopListening?.()
    },
  }
}
