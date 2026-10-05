/** @jsxImportSource @emotion/react */
import { createFileRoute } from '@tanstack/react-router'
import { useSelector } from 'react-redux'
import { css } from '@emotion/react'
import PropTypes from 'prop-types'
import { ChevronLeftIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { deadlineProgress, missionDetail } from '../../campaign/missions'
import { relativeToCampaign } from '../../campaign/time'
import { Footer } from '../../components/Footer'
import { Avatar } from '../../components/Avatar'
import { MissionMap } from '../../components/MissionMap'
import { Chip, RiskChip, StatusLabel } from '../../components/MissionTags'
import { formatBRL } from '../../utils/format'

export const Route = createFileRoute('/mission/$missionId')({
  component: MissionComponent,
})

function BackButton() {
  return (
    <button type="button" css={backButton} onClick={() => history.back()} aria-label="Voltar">
      <ChevronLeftIcon />
    </button>
  )
}

function MissionNotFound() {
  return (
    <main className="app-main">
      <div className="app-body" css={notFound}>
        <BackButton />
        <h1>Missão não encontrada</h1>
        <p>A missão que você procura não existe ou ainda não foi publicada.</p>
      </div>
      <Footer />
    </main>
  )
}

function Timeline({ mission, campaignDate }) {
  const { deadline, postedAt } = mission
  if (!deadline && !postedAt) return null

  const progress = deadline && postedAt ? deadlineProgress(mission, campaignDate) : null

  return (
    <section css={timeline} aria-label="Prazo da caça">
      {progress !== null && (
        <div className="timeline__bar" aria-hidden="true">
          <i style={{ width: `${progress * 100}%` }} />
          <em style={{ left: `${progress * 100}%` }} />
        </div>
      )}
      <div className="timeline__labels">
        {postedAt && (
          <div>
            <span>Publicada</span>
            <b>{relativeToCampaign(postedAt, campaignDate)}</b>
          </div>
        )}
        {deadline && (
          <div className="timeline__deadline">
            <span>Prazo</span>
            <b>{relativeToCampaign(deadline, campaignDate)}</b>
          </div>
        )}
      </div>
    </section>
  )
}

Timeline.propTypes = {
  mission: PropTypes.shape({ deadline: PropTypes.string, postedAt: PropTypes.string }).isRequired,
  campaignDate: PropTypes.string.isRequired,
}

function Hunters({ mission, hunters }) {
  const onMission = hunters.filter(hunter => mission.hunters.includes(hunter.id))

  return (
    <section css={huntersStyle}>
      <h2>Hunters na missão</h2>
      {onMission.length === 0 ? (
        <p>Nenhum hunter nesta missão ainda.</p>
      ) : (
        <ul>
          {onMission.map(hunter => (
            <li key={hunter.id}>
              <Avatar person={hunter} size={28} />
              <span>{hunter.name}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

Hunters.propTypes = {
  mission: PropTypes.shape({ hunters: PropTypes.arrayOf(PropTypes.string).isRequired }).isRequired,
  hunters: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired })).isRequired,
}

function MissionComponent() {
  const { missionId } = Route.useParams()
  const campaign = useSelector(state => state.campaign.data)
  const mission = missionDetail(campaign, missionId)

  if (!mission) return <MissionNotFound />

  const { name, description, tags, risk, status, location, position, value } = mission

  return (
    <main className="app-main">
      <div className="app-body" css={detail}>
        <BackButton />

        <div className="detail__chips">
          <StatusLabel status={status} />
          <RiskChip risk={risk} />
          {tags.map(tag => <Chip key={tag}>{tag}</Chip>)}
        </div>

        <h1>{name}</h1>
        {description && <p className="detail__description">{description}</p>}

        <div className="detail__reward">
          <span>Recompensa</span>
          <b className="num">{formatBRL(value)}</b>
        </div>

        <Timeline mission={mission} campaignDate={campaign.campaign.date} />

        <section className="detail__place">
          {position && (
            <MissionMap className="detail__map" missions={[mission]} selectedId={mission.id} interactive={false} zoom={15} />
          )}
          <div className="detail__location">
            <MapPinIcon aria-hidden="true" />
            <span>{location}</span>
          </div>
        </section>

        <Hunters mission={mission} hunters={campaign.hunters} />
      </div>
      <Footer />
    </main>
  )
}

const backButton = css`
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background-color: var(--painel-2);
  color: var(--texto);
  flex-shrink: 0;

  &:hover {
    background-color: var(--linha);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`

const detail = css`
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding-top: calc(14px + env(safe-area-inset-top, 0px));

  .detail__chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
  }

  h1 {
    font-size: 30px;
    line-height: 1.05;
    letter-spacing: -0.03em;
  }

  .detail__description {
    font-size: 15px;
    color: var(--apagado);
    max-width: 60ch;
  }

  .detail__reward {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 14px 16px;
    border-radius: 16px;
    background-color: var(--painel);
    border: 1px solid var(--linha);

    span {
      font-size: 13px;
      color: var(--apagado);
    }

    b {
      font-size: 26px;
      white-space: nowrap;
    }
  }

  .detail__place {
    border-radius: 16px;
    background-color: var(--painel);
    border: 1px solid var(--linha);
    overflow: hidden;
  }

  .detail__map {
    height: 150px;
  }

  .detail__location {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    font-size: 14px;
    font-weight: 500;

    svg {
      width: 22px;
      height: 22px;
      color: var(--laranja);
    }
  }
`

const timeline = css`
  display: flex;
  flex-direction: column;
  gap: 10px;

  .timeline__bar {
    position: relative;
    height: 6px;
    border-radius: 6px;
    background-color: var(--painel-2);

    i {
      position: absolute;
      inset: 0 auto 0 0;
      border-radius: 6px;
      background-color: var(--laranja);
    }

    em {
      position: absolute;
      top: 50%;
      width: 14px;
      height: 14px;
      margin: -7px 0 0 -7px;
      border-radius: 50%;
      background-color: var(--texto);
      border: 3px solid var(--laranja);
    }
  }

  .timeline__labels {
    display: flex;
    justify-content: space-between;
    gap: 12px;

    div {
      display: flex;
      flex-direction: column;
    }

    span {
      font-size: 12px;
      color: var(--apagado);
    }

    b {
      font-size: 14px;
      font-weight: 600;
    }
  }

  .timeline__deadline {
    margin-left: auto;
    text-align: right;
  }
`

const huntersStyle = css`
  display: flex;
  flex-direction: column;
  gap: 10px;

  h2 {
    font-size: 13px;
    font-weight: 600;
    color: var(--apagado);
    letter-spacing: 0;
  }

  p {
    font-size: 14px;
    color: var(--apagado);
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 12px 4px 4px;
    border-radius: 999px;
    background-color: var(--painel-2);
    font-size: 14px;
    font-weight: 600;
  }
`

const notFound = css`
  display: flex;
  flex-direction: column;
  gap: 12px;

  h1 {
    margin-top: 24px;
    font-size: 24px;
  }

  p {
    color: var(--apagado);
    font-size: 15px;
  }
`
