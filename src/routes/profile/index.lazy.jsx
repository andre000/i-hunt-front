import { createLazyFileRoute } from '@tanstack/react-router'
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer'
import { UnderMaintenance } from '../../components/UnderMaintenance';

export const Route = createLazyFileRoute('/profile/')({
  component: ProfilePage
})

function ProfilePage() {
  return (
    <main className='app-main'>
      <Header />
      <div className="app-body">
        <UnderMaintenance />
      </div>
      <Footer active='profile' />
    </main>
  )
}