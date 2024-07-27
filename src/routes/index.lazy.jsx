/** @jsxImportSource @emotion/react */
import { createLazyFileRoute, Link, useLocation } from '@tanstack/react-router'
import { useEffect } from 'react';
import anime from 'animejs/lib/anime.es.js';
import { css } from '@emotion/react'
import { Header } from '../components/Header';
import { Footer } from '../components/Footer'
import { FeaturedJob } from '../components/FeaturedJob';
import { ClosingJob } from '../components/ClosingJob';

export const Route = createLazyFileRoute('/')({
  component: Index,
})

function Index() {
  const location = useLocation()

  useEffect(() => {
    if (location.state?.referer !== 'login') return;

    anime.timeline({
      duration: 500,
      easing: 'easeInOutSine',
    }).add({
      targets: "main",
      backgroundColor: ['#333', '#f60']
    })
    .add({
      targets: ".home__header",
      opacity: [0, 1],
      translateY: [20, 0],
    })
    .add({
      targets: ".home__body",
      opacity: [0, 1],
      translateY: ["100vw", 0],
    })
    .add({
      targets: "footer",
      translateY: [20, 0],
      opacity: [0, 1],
    })
  }, [location.state?.referer])

  return (
    <main className='app-main'>
      <Header className="home__header" />
      <div className="home__body app-body" css={homeBody}>
        <div className="home__body__header">
          <h1>Encontre uma caça</h1>
        </div>

        <div className="home__body__counter">
          <div>
            <h2>17</h2>
            <p>caças disponíveis</p>
          </div>
          <Link to="/search">Ver todas</Link>
        </div>

        <FeaturedJob />

        <div className="home__body__nearby">
          <div className="home__body__nearby__header">
            <h2>Caças próximas</h2>
            <Link to="/search">Ver todas</Link>
          </div>

          <ClosingJob onClick={() => console.log('closing job clicked')} />
          <ClosingJob onClick={() => console.log('closing job clicked')} />
          <ClosingJob onClick={() => console.log('closing job clicked')} />
        </div>
      </div>
      <Footer active="home" />
    </main>
  )
}

const homeBody = css`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;

  h1, h2 {
    font-size: 18px;
    font-family: 'Open Sans', sans-serif;
  }

  .home__body__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .home__body__counter {
    display: flex;
    align-items: end;
    justify-content: space-between;

    > div {
      display: flex;
      gap: 8px;
      align-items: end;
    }

    a {
      color: #f60;
      font-size: 12px;
      margin-bottom: 21px;
      font-weight: 700;
      text-decoration: none;
    }

    h2 {
      font-size: 68px;
      font-weight: 900;
    }

    p {
      font-size: 12px;
      color: #777;
      margin-bottom: 21px;
    }
  }

  .home__body__nearby {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .home__body__nearby__header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      a {
        color: #f60;
        font-size: 12px;
        font-weight: 700;
        text-decoration: none;
      }
    }

    .home__body__nearby__list {
      border-color: #eee;
      border-width: 1px;
      border-style: solid;
      border-radius: 16px;
      padding: 16px;
    }
  }
`
