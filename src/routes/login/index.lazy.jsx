import { createLazyFileRoute } from '@tanstack/react-router'
import { HunterChoice } from '../../components/HunterChoice'

export const Route = createLazyFileRoute('/login/')({
  component: HunterChoice,
})
