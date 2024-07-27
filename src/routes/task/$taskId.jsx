import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/task/$taskId')({
  component: TaskComponent
})

function TaskComponent() {
  const { taskId } = Route.useParams()
  return <div>Hello /tasks/{ taskId }!</div>
}