import { createLazyFileRoute } from '@tanstack/react-router'
/** @jsxImportSource @emotion/react */
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer'
import { css } from '@emotion/react'
import { ClosingJob } from '../../components/ClosingJob'

export const Route = createLazyFileRoute('/profile/')({
  component: ProfilePage
})

function ProfilePage() {
  return (
    <main className='app-main'>
      <Header />
      <div className="app-body" css={profileBody}>
        <img className='profile__avatar' src='https://via.placeholder.com/96' alt='Avatar' />
        <h2>Hunter Doe</h2>
        <p>hunter@example.com</p>
        <button className='button primary'>Editar perfil</button>

        <section className='hunts'>
          <h3>Caças ativas</h3>
          <div className='hunts__list'>
            <ClosingJob onClick={() => {}} />
            <ClosingJob onClick={() => {}} />
          </div>
        </section>

        <section className='hunts'>
          <h3>Caças anteriores</h3>
          <div className='hunts__list'>
            <ClosingJob onClick={() => {}} />
            <ClosingJob onClick={() => {}} />
          </div>
        </section>
      </div>
      <Footer active='profile' />
    </main>
  )
}

const profileBody = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px;

  .profile__avatar {
    width: 96px;
    height: 96px;
    border-radius: 50%;
    object-fit: cover;
  }

  h2 {
    font-size: 20px;
  }

  p {
    font-size: 14px;
    color: #777;
  }

  .hunts {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;

    h3 {
      font-size: 16px;
    }

    .hunts__list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  }
`
