/** @jsxImportSource @emotion/react */
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { useDispatch, useSelector } from 'react-redux'
import { Avatar } from '../../components/Avatar'
import { hunterProfile } from '../../campaign/hunters'
import { MISSION_STATUS_LABEL } from '../../campaign/missions'
import { forgetHunter } from '../../store/campaign'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'
import { formatBRL } from '../../utils/format'
import { css } from '@emotion/react'
import PropTypes from 'prop-types'
import { MapPinIcon, StarIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'

export const Route = createLazyFileRoute('/profile/')({
  component: ProfilePage,
})

// ─── Risk badge colors ────────────────────────────────────────────────────────

const RISK_COLOR = { baixo: '#22c55e', médio: '#f59e0b', alto: '#ef4444' }

// ─── Sub-component: compact mission card ─────────────────────────────────────

function ProfileMissionCard({ mission, onClick }) {
  const riskColor = RISK_COLOR[mission.risk] ?? '#aaa'

  return (
    <div css={missionCard} onClick={onClick}>
      <div className='mc__body'>
        <p className='mc__name'>{mission.name}</p>
        <div className='mc__meta'>
          <MapPinIcon />
          <span>{mission.location}</span>
        </div>
      </div>
      <div className='mc__right'>
        <span className='mc__value'>{formatBRL(mission.value)}</span>
        <span className='mc__risk' style={{ backgroundColor: riskColor }}>{mission.risk}</span>
        <span className='mc__days'>{MISSION_STATUS_LABEL[mission.status]}</span>
      </div>
      <ChevronRightIcon className='mc__arrow' />
    </div>
  )
}

const missionShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  location: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  risk: PropTypes.string.isRequired,
  status: PropTypes.oneOf(Object.keys(MISSION_STATUS_LABEL)).isRequired,
})

ProfileMissionCard.propTypes = {
  mission: missionShape.isRequired,
  onClick: PropTypes.func.isRequired,
}

// ─── Sub-component: star rating ───────────────────────────────────────────────

function StarRating({ value }) {
  return (
    <div css={starRow}>
      {Array.from({ length: 5 }, (_, i) =>
        i < Math.floor(value)
          ? <StarSolid key={i} />
          : <StarIcon key={i} />
      )}
      <span>{value.toFixed(1)}</span>
    </div>
  )
}

StarRating.propTypes = {
  value: PropTypes.number.isRequired,
}

// ─── Sub-component: hunt section ─────────────────────────────────────────────

function HuntSection({ title, emptyText, missions, navigate }) {
  return (
    <section css={huntSection}>
      <div className='hs__header'>
        <h3>{title}</h3>
        {missions.length > 0 && <span className='hs__badge'>{missions.length}</span>}
      </div>
      {missions.length === 0 ? (
        <p css={emptyState}>
          {emptyText}
        </p>
      ) : (
        <div className='hs__list'>
          {missions.map(m => (
            <ProfileMissionCard
              key={m.id}
              mission={m}
              onClick={() => navigate({ to: '/mission/$missionId', params: { missionId: m.id } })}
            />
          ))}
        </div>
      )}
    </section>
  )
}

HuntSection.propTypes = {
  title: PropTypes.string.isRequired,
  emptyText: PropTypes.string.isRequired,
  missions: PropTypes.arrayOf(missionShape).isRequired,
  navigate: PropTypes.func.isRequired,
}

// ─── Main page ────────────────────────────────────────────────────────────────

function ProfilePage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { data, hunterId } = useSelector(state => state.campaign)
  const profile = hunterProfile(data, hunterId)

  if (!profile) return null

  const { hunter, earnings, inProgress, completed } = profile

  return (
    <main className='app-main'>
      <Header />
      <div className='app-body' css={profileBody}>
        <div css={identity}>
          <div className='id__avatar-wrap'>
            <Avatar person={hunter} size={106} className='id__avatar' />
          </div>
          <h2 className='id__name'>{hunter.name}</h2>
          {hunter.rating !== undefined && <StarRating value={hunter.rating} />}
          <button className='button secondary' style={{ marginTop: 4 }} onClick={() => dispatch(forgetHunter())}>
            Trocar de hunter
          </button>
        </div>

        <div css={statsRow}>
          <div className='stat'>
            <span className='stat__num'>{inProgress.length}</span>
            <span className='stat__label'>Em andamento</span>
          </div>
          <div className='stat stat--divider'>
            <span className='stat__num'>{completed.length}</span>
            <span className='stat__label'>Concluídas</span>
          </div>
          <div className='stat'>
            <span className='stat__num'>{formatBRL(earnings)}</span>
            <span className='stat__label'>Ganhos</span>
          </div>
        </div>

        <HuntSection
          title='Em andamento'
          emptyText='Nenhuma caça em andamento.'
          missions={inProgress}
          navigate={navigate}
        />
        <HuntSection
          title='Concluídas'
          emptyText='Nenhuma caça concluída ainda.'
          missions={completed}
          navigate={navigate}
        />
      </div>
      <Footer active='profile' />
    </main>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const profileBody = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 24px 20px;
`

const identity = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 100%;

  .id__avatar-wrap {
    width: 112px;
    height: 112px;
    border-radius: 50%;
    padding: 3px;
    background: linear-gradient(135deg, #f60, #ff9940);
    box-shadow: 0 4px 16px rgba(255, 102, 0, 0.35);
  }

  .id__avatar {
    border: 3px solid #fff;
  }

  .id__name {
    font-family: "Saira", sans-serif;
    font-size: 22px;
    font-weight: 700;
    color: #1a1a1a;
    margin-top: 4px;
  }
`

const starRow = css`
  display: flex;
  align-items: center;
  gap: 3px;
  color: #f60;

  svg {
    width: 16px;
    height: 16px;
  }

  span {
    font-size: 13px;
    font-weight: 600;
    color: #555;
    margin-left: 4px;
  }
`

const statsRow = css`
  display: flex;
  align-items: stretch;
  width: 100%;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  .stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 16px 8px;

    &--divider {
      border-left: 1px solid #eee;
      border-right: 1px solid #eee;
    }

    &__num {
      font-family: "Saira", sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: #f60;
    }

    &__label {
      font-size: 11px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }
`

const huntSection = css`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;

  .hs__header {
    display: flex;
    align-items: center;
    gap: 8px;

    h3 {
      font-family: "Saira", sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: #1a1a1a;
    }
  }

  .hs__badge {
    background: #f60;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    border-radius: 99px;
    padding: 1px 7px;
  }

  .hs__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
`

const emptyState = css`
  font-size: 13px;
  color: #bbb;
  text-align: center;
  padding: 20px 0;
`

const missionCard = css`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 16px;
  cursor: pointer;
  transition: box-shadow 0.15s;

  &:active {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .mc__body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .mc__name {
    font-size: 14px;
    font-weight: 700;
    color: #1a1a1a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mc__meta {
    display: flex;
    align-items: center;
    gap: 3px;
    color: #999;
    font-size: 12px;

    svg {
      width: 12px;
      height: 12px;
      flex-shrink: 0;
    }
  }

  .mc__right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    flex-shrink: 0;
  }

  .mc__value {
    font-size: 13px;
    font-weight: 700;
    color: #f60;
  }

  .mc__risk {
    font-size: 10px;
    font-weight: 700;
    color: #fff;
    border-radius: 99px;
    padding: 1px 7px;
    text-transform: capitalize;
  }

  .mc__days {
    font-size: 10px;
    color: #aaa;
  }

  .mc__arrow {
    width: 16px;
    height: 16px;
    color: #ccc;
    flex-shrink: 0;
  }
`
