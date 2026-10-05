/** @jsxImportSource @emotion/react */
import { createLazyFileRoute, Link } from '@tanstack/react-router'
import { useDispatch, useSelector } from 'react-redux'
import { css } from '@emotion/react'
import PropTypes from 'prop-types'
import { ChevronRightIcon } from '@heroicons/react/24/outline'
import { StarIcon } from '@heroicons/react/24/solid'
import { Avatar } from '../../components/Avatar'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'
import { StatusLabel } from '../../components/MissionTags'
import { hunterProfile } from '../../campaign/hunters'
import { MISSION_STATUS_LABEL } from '../../campaign/missions'
import { forgetHunter } from '../../store/campaign'
import { formatBRL } from '../../utils/format'

export const Route = createLazyFileRoute('/profile/')({
  component: ProfilePage,
})

const missionShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  location: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  hunters: PropTypes.arrayOf(PropTypes.string).isRequired,
  status: PropTypes.oneOf(Object.keys(MISSION_STATUS_LABEL)).isRequired,
})

function HuntSection({ title, emptyText, missions }) {
  return (
    <section css={huntSection}>
      <h2>{title}</h2>
      {missions.length === 0 ? (
        <p className="hs__empty">{emptyText}</p>
      ) : (
        <ul>
          {missions.map(mission => (
            <li key={mission.id}>
              <Link to="/mission/$missionId" params={{ missionId: mission.id }}>
                <span className="hs__body">
                  <span className="hs__name">{mission.name}</span>
                  <span className="hs__meta">
                    <StatusLabel status={mission.status} />
                    <span>{mission.location}</span>
                  </span>
                </span>
                <span className="hs__value num">{formatBRL(mission.value / mission.hunters.length)}</span>
                <ChevronRightIcon className="hs__arrow" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

HuntSection.propTypes = {
  title: PropTypes.string.isRequired,
  emptyText: PropTypes.string.isRequired,
  missions: PropTypes.arrayOf(missionShape).isRequired,
}

function ProfilePage() {
  const dispatch = useDispatch()
  const { data, hunterId } = useSelector(state => state.campaign)
  const profile = hunterProfile(data, hunterId)

  if (!profile) return null

  const { hunter, earnings, inProgress, completed } = profile

  return (
    <main className="app-main">
      <Header title="Perfil" />
      <div className="app-body" css={profileBody}>

        <div className="profile__identity">
          <Avatar person={hunter} size={64} />
          <div className="profile__name">
            <h2>{hunter.name}</h2>
            {hunter.rating !== undefined && (
              <span className="profile__rating num">
                <StarIcon aria-hidden="true" /> {hunter.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        <div className="profile__earnings">
          <span>Seus ganhos</span>
          <b className="num">{formatBRL(earnings)}</b>
          <small>
            {completed.length} {completed.length === 1 ? 'caça concluída' : 'caças concluídas'} · {inProgress.length} em andamento
          </small>
        </div>

        <HuntSection title="Em andamento" emptyText="Nenhuma caça em andamento." missions={inProgress} />
        <HuntSection title="Concluídas" emptyText="Nenhuma caça concluída ainda." missions={completed} />

        <button type="button" className="button secondary profile__switch" onClick={() => dispatch(forgetHunter())}>
          Trocar de hunter
        </button>
      </div>
      <Footer active="profile" />
    </main>
  )
}

const profileBody = css`
  display: flex;
  flex-direction: column;
  gap: 22px;

  .profile__identity {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .profile__name {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;

    h2 {
      font-size: 26px;
      line-height: 1.1;
      letter-spacing: -0.03em;
    }
  }

  .profile__rating {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: var(--apagado);

    svg {
      width: 14px;
      height: 14px;
      color: var(--aviso);
    }
  }

  .profile__earnings {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 16px;
    border-radius: 16px;
    background-color: var(--painel);
    border: 1px solid var(--linha);

    span, small {
      font-size: 13px;
      color: var(--apagado);
    }

    b {
      font-size: 32px;
      line-height: 1.15;
      white-space: nowrap;
    }
  }

  .profile__switch {
    align-self: flex-start;
  }
`

const huntSection = css`
  display: flex;
  flex-direction: column;
  gap: 6px;

  h2 {
    font-size: 13px;
    font-weight: 600;
    color: var(--apagado);
    letter-spacing: 0;
  }

  .hs__empty {
    font-size: 14px;
    color: var(--apagado);
    padding: 6px 0;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    border-top: 1px solid var(--linha);
  }

  li {
    border-bottom: 1px solid var(--linha);
  }

  a {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    color: var(--texto);
    text-decoration: none;
  }

  a:hover .hs__name {
    color: var(--laranja);
  }

  .hs__body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .hs__name {
    font-size: 15px;
    font-weight: 600;
  }

  .hs__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    font-size: 12px;
    color: var(--apagado);
  }

  .hs__value {
    font-size: 14px;
    white-space: nowrap;
  }

  .hs__arrow {
    width: 16px;
    height: 16px;
    color: var(--apagado);
    flex-shrink: 0;
  }
`
