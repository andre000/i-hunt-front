import { createLazyFileRoute } from '@tanstack/react-router'
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer'
import { UnderMaintance } from '../../components/UnderMaintance';

export const Route = createLazyFileRoute('/profile/')({
  component: ProfilePage
})

function ProfilePage() {
  return (
    <main className='app-main'>
      <Header />
      <div className="app-body">
        <UnderMaintance />
      </div>
      <Footer active='profile' />
    </main>
  )
}