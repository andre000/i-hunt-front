import { readInvite } from './invite'
import { clearDemo, isDemoActive, startDemo } from './demoSync'

const DEMO_PATHS = ['/demo', '/demo/']

export function chooseMode({ pathname, search, session }) {
  if (readInvite(search)) {
    clearDemo(session)
    return 'real'
  }
  if (DEMO_PATHS.includes(pathname)) {
    startDemo(session)
    return 'demo'
  }
  return isDemoActive(session) ? 'demo' : 'real'
}
