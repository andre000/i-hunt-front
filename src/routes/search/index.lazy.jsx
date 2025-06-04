import { createLazyFileRoute } from '@tanstack/react-router'
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer'
import { UnderMaintenance } from '../../components/UnderMaintenance';

export const Route = createLazyFileRoute('/search/')({
  component: SearchPage
})

function SearchPage() {
  return (
    <main className='app-main'>
      <Header />
      <div className="app-body">
        <UnderMaintenance />
      </div>
      <Footer active='search' />
    </main>
  )
}