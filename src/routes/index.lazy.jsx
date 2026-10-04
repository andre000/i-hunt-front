/** @jsxImportSource @emotion/react */
import { useEffect } from 'react';
import { createLazyFileRoute, Link, useLocation, useNavigate } from '@tanstack/react-router'
import { useSelector } from 'react-redux'
import anime from 'animejs/lib/anime.es.js';
import { css } from '@emotion/react'
import PropTypes from 'prop-types'
import { Header } from '../components/Header';
import { Footer } from '../components/Footer'
import { FeaturedMission } from '../components/FeaturedMission';
import { NearbyMission } from '../components/NearbyMission';
import { homeView } from '../campaign/missions';

export const Route = createLazyFileRoute('/')({
  component: Index,
})

function playHomeEntrance() {
  anime.timeline({
    duration: 500,
    easing: 'easeInOutSine',
  }).add({
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
}

function NearbySection({ missions, onMissionClick }) {
  return (
    <div className="home__body__nearby">
      <div className="home__body__nearby__header">
        <h2>Caças próximas</h2>
        <Link to="/search">Ver todas</Link>
      </div>

      {missions.length === 0 && (
        <p className="home__body__nearby__empty">Nenhuma caça perto de você agora.</p>
      )}

      {missions.map(mission => (
        <NearbyMission key={mission.id} data={mission} onClick={() => onMissionClick(mission)} />
      ))}
    </div>
  )
}

NearbySection.propTypes = {
  missions: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired })).isRequired,
  onMissionClick: PropTypes.func.isRequired,
}

function Index() {
  const location = useLocation()
  const { data, hunterId } = useSelector(state => state.campaign)
  const { featured: featuredMission, nearby: nearbyMissions, available } = homeView(data, hunterId)

  const navigate = useNavigate()
  const handleMissionClick = (mission) => {
    navigate({ to: '/mission/$missionId', params: { missionId: mission.id } })
  }

  useEffect(() => {
    if (location.state?.referer === 'login') playHomeEntrance()
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
            <h2>{available}</h2>
            <p>caças disponíveis</p>
          </div>
          <Link to="/search">Ver todas</Link>
        </div>

        {featuredMission && (
          <FeaturedMission data={featuredMission} onClick={() => handleMissionClick(featuredMission)} />
        )}

        <NearbySection missions={nearbyMissions} onMissionClick={handleMissionClick} />
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

    .home__body__nearby__empty {
      font-size: 14px;
      color: #777;
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
