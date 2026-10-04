/** @jsxImportSource @emotion/react */
import { createFileRoute } from '@tanstack/react-router'
import { useSelector } from 'react-redux'
import { MISSION_STATUS_LABEL, missionDetail } from '../../campaign/missions'
import { relativeToCampaign } from '../../campaign/time'
import { Footer } from '../../components/Footer'
import { css } from '@emotion/react'
import PropTypes from 'prop-types'
import { formatBRL } from '../../utils/format'
import {
  ArrowLeftIcon,
  MapPinIcon,
  FireIcon,
  BanknotesIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'

export const Route = createFileRoute('/mission/$missionId')({
  component: MissionComponent,
})

const STATUS_COLOR = {
  available: '#22c55e',
  'in-progress': '#3b82f6',
  completed: '#9ca3af',
  failed: '#ef4444',
  expired: '#f59e0b',
}
const RISK_LABEL = { baixo: 'Baixo', médio: 'Médio', alto: 'Alto' }
const RISK_COLOR = { baixo: '#22c55e', médio: '#f59e0b', alto: '#ef4444' }

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div css={infoCard}>
      <div className="card__icon">
        <Icon />
      </div>
      <span className="card__label">{label}</span>
      <span className="card__value">{value}</span>
    </div>
  )
}

InfoCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
}

function MissionNotFound() {
  return (
    <main className="app-main">
      <div css={notFoundStyle}>
        <button css={backBtn} onClick={() => history.back()}>
          <ArrowLeftIcon />
        </button>
        <div className="nf__content">
          <p className="nf__title">Missão não encontrada</p>
          <p className="nf__sub">A missão que você procura não existe ou foi removida.</p>
          <button className="button secondary" onClick={() => history.back()}>
            Voltar
          </button>
        </div>
      </div>
      <Footer active="home" />
    </main>
  )
}

function MissionFacts({ mission, campaignDate }) {
  const { location, value, deadline, postedAt } = mission
  return (
    <div css={infoGrid}>
      <InfoCard icon={MapPinIcon} label="Localização" value={location} />
      <InfoCard icon={BanknotesIcon} label="Recompensa" value={formatBRL(value)} />
      {deadline && (
        <InfoCard icon={CalendarIcon} label="Prazo" value={relativeToCampaign(deadline, campaignDate)} />
      )}
      {postedAt && (
        <InfoCard icon={ClockIcon} label="Publicada" value={relativeToCampaign(postedAt, campaignDate)} />
      )}
    </div>
  )
}

MissionFacts.propTypes = {
  mission: PropTypes.shape({
    location: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
    deadline: PropTypes.string,
    postedAt: PropTypes.string,
  }).isRequired,
  campaignDate: PropTypes.string.isRequired,
}

function MissionHunters({ hunterNames }) {
  return (
    <section css={huntersSection}>
      <h2>
        <UserGroupIcon /> Hunters na missão
      </h2>
      {hunterNames.length === 0 ? (
        <p>Nenhum hunter nesta missão ainda.</p>
      ) : (
        <ul>
          {hunterNames.map(hunterName => (
            <li key={hunterName}>{hunterName}</li>
          ))}
        </ul>
      )}
    </section>
  )
}

MissionHunters.propTypes = {
  hunterNames: PropTypes.arrayOf(PropTypes.string).isRequired,
}

function MissionComponent() {
  const { missionId } = Route.useParams()
  const campaign = useSelector(state => state.campaign.data)
  const mission = missionDetail(campaign, missionId)

  if (!mission) return <MissionNotFound />

  const { name, description, tags, risk, status, hunterNames } = mission

  return (
    <main className="app-main">
      <div css={detailBody}>
        <div css={heroSection}>
          <img src="https://placehold.co/600x400" alt={name} css={heroImg} />
          <button css={backBtn} onClick={() => history.back()}>
            <ArrowLeftIcon />
          </button>
        </div>

        <div css={contentSection}>
          <div css={missionHeader}>
            <h1>{name}</h1>
            <div css={badgeRow}>
              <span css={badge(STATUS_COLOR[status])}>
                {MISSION_STATUS_LABEL[status]}
              </span>
              <span css={badge(RISK_COLOR[risk])}>
                <FireIcon /> {RISK_LABEL[risk]}
              </span>
            </div>
          </div>

          {description && <p css={descriptionText}>{description}</p>}

          {tags.length > 0 && (
            <div css={tagsRow}>
              {tags.map(tag => (
                <span key={tag} css={tagPill}>{tag}</span>
              ))}
            </div>
          )}

          <MissionFacts mission={mission} campaignDate={campaign.campaign.date} />
          <MissionHunters hunterNames={hunterNames} />
        </div>
      </div>
      <Footer active="home" />
    </main>
  )
}

/* ── Styles ───────────────────────────── */

const detailBody = css`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  background-color: #fff;
  border-radius: 24px 24px 0 0;
  padding-bottom: 64px;
  animation: page-slide-up 0.32s cubic-bezier(0.22, 1, 0.36, 1);
`

const heroSection = css`
  position: relative;
  width: 100%;
  height: 200px;
  flex-shrink: 0;
`

const heroImg = css`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 24px 24px 0 0;
  display: block;
`

const backBtn = css`
  position: absolute;
  top: 16px;
  left: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.9);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);

  svg {
    width: 18px;
    height: 18px;
    color: #333;
  }

  &:hover {
    background-color: #fff;
  }
`

const contentSection = css`
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const missionHeader = css`
  display: flex;
  flex-direction: column;
  gap: 8px;

  h1 {
    font-size: 22px;
    color: #222;
    line-height: 1.2;
    margin: 0;
  }
`

const badgeRow = css`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`

const badge = (color) => css`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background-color: ${color}1a;
  color: ${color};
  border: 1px solid ${color}40;
  border-radius: 20px;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;

  svg {
    width: 12px;
    height: 12px;
    stroke: ${color};
    flex-shrink: 0;
  }
`

const descriptionText = css`
  font-size: 14px;
  color: #555;
  line-height: 1.6;
  margin: 0;
`

const tagsRow = css`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`

const tagPill = css`
  background-color: #eee;
  color: #666;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`

const huntersSection = css`
  display: flex;
  flex-direction: column;
  gap: 8px;

  h2 {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 700;
    color: #333;

    svg {
      width: 18px;
      height: 18px;
      stroke: #f60;
    }
  }

  p {
    font-size: 13px;
    color: #888;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  li {
    background-color: #f7f7f7;
    border-radius: 16px;
    padding: 6px 12px;
    font-size: 13px;
    font-weight: 600;
    color: #333;
  }
`

const infoGrid = css`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
`

const infoCard = css`
  background-color: #f7f7f7;
  border-radius: 16px;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;

  .card__icon {
    background-color: #fff;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 4px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);

    svg {
      width: 16px;
      height: 16px;
      stroke: #f60;
    }
  }

  .card__label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    color: #999;
    letter-spacing: 0.3px;
  }

  .card__value {
    font-size: 14px;
    font-weight: 700;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`

const notFoundStyle = css`
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-radius: 24px 24px 0 0;

  .nf__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    text-align: center;
    gap: 8px;
  }

  .nf__title {
    font-size: 18px;
    font-weight: 700;
    color: #333;
  }

  .nf__sub {
    font-size: 13px;
    color: #888;
    margin-bottom: 16px;
  }
`