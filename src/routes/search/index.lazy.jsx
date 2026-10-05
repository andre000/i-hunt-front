/** @jsxImportSource @emotion/react */
import { useState } from 'react'
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { useSelector } from 'react-redux'
import { css } from '@emotion/react'
import PropTypes from 'prop-types'
import { ChevronRightIcon } from '@heroicons/react/24/outline'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'
import { MISSION_STATUS_LABEL, RISKS, missionList } from '../../campaign/missions'
import { relativeToCampaign } from '../../campaign/time'
import { formatBRL } from '../../utils/format'
import { rowButton, stackedText } from '../../components/styles'
import { RiskChip, StatusLabel } from '../../components/MissionTags'

export const Route = createLazyFileRoute('/search/')({
  component: SearchPage,
})

const STATUS_OPTIONS = Object.entries(MISSION_STATUS_LABEL).map(([value, label]) => ({ value, label }))
const RISK_OPTIONS = RISKS.map(risk => ({ value: risk, label: risk.charAt(0).toUpperCase() + risk.slice(1) }))

function toggle(list, value) {
  return list.includes(value) ? list.filter(item => item !== value) : [...list, value]
}

function FilterGroup({ title, options, selected, onToggle }) {
  return (
    <fieldset css={filterGroup}>
      <legend>{title}</legend>
      <div className="filter__chips">
        {options.map(option => (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected.includes(option.value)}
            onClick={() => onToggle(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

FilterGroup.propTypes = {
  title: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  })).isRequired,
  selected: PropTypes.arrayOf(PropTypes.string).isRequired,
  onToggle: PropTypes.func.isRequired,
}

function SearchPage() {
  const navigate = useNavigate()
  const campaign = useSelector(state => state.campaign.data)
  const [statuses, setStatuses] = useState([])
  const [risks, setRisks] = useState([])

  const missions = missionList(campaign, { statuses, risks })
  const campaignDate = campaign.campaign.date

  return (
    <main className='app-main'>
      <Header title="Caças" />
      <div className="app-body" css={searchBody}>
        <FilterGroup
          title="Estado"
          options={STATUS_OPTIONS}
          selected={statuses}
          onToggle={value => setStatuses(toggle(statuses, value))}
        />
        <FilterGroup
          title="Risco"
          options={RISK_OPTIONS}
          selected={risks}
          onToggle={value => setRisks(toggle(risks, value))}
        />

        {missions.length === 0 ? (
          <p className="search__empty">Nenhuma missão com esses filtros.</p>
        ) : (
          <ul className="search__list">
            {missions.map(mission => (
              <li key={mission.id}>
                <button
                  type="button"
                  className="search__item"
                  onClick={() => navigate({ to: '/mission/$missionId', params: { missionId: mission.id } })}
                >
                  <span className="item__body">
                    <span className="item__name">{mission.name}</span>
                    <span className="item__meta">
                      <StatusLabel status={mission.status} />
                      <RiskChip risk={mission.risk} />
                      {mission.deadline && <span>prazo {relativeToCampaign(mission.deadline, campaignDate)}</span>}
                    </span>
                  </span>
                  <span className="item__value num">{formatBRL(mission.value)}</span>
                  <ChevronRightIcon className="item__arrow" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Footer active='search' />
    </main>
  )
}

const filterGroup = css`
  border: none;
  margin: 0;
  padding: 0;

  legend {
    font-size: 12px;
    font-weight: 600;
    color: var(--apagado);
    margin-bottom: 8px;
  }

  .filter__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  button {
    background-color: var(--painel-2);
    color: var(--apagado);
    border-radius: 999px;
    padding: 6px 12px;
    font-size: 13px;
    font-weight: 600;
    box-shadow: inset 0 0 0 1px var(--linha);
  }

  button:hover {
    color: var(--texto);
  }

  button[aria-pressed='true'] {
    background-color: var(--laranja-fundo);
    color: var(--laranja);
    box-shadow: inset 0 0 0 1px var(--laranja);
  }
`

const searchBody = css`
  display: flex;
  flex-direction: column;
  gap: 20px;

  .search__empty {
    font-size: 14px;
    color: var(--apagado);
  }

  .search__list {
    list-style: none;
    margin: 0;
    padding: 0;
    border-top: 1px solid var(--linha);
  }

  .search__list li {
    border-bottom: 1px solid var(--linha);
  }

  .search__item {
    ${rowButton}
    padding: 14px 0;
    border-radius: 0;
  }

  .search__item:hover .item__name {
    color: var(--laranja);
  }

  .item__body {
    ${stackedText}
  }

  .item__name {
    font-weight: 600;
    font-size: 15px;
  }

  .item__meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 12px;
    font-size: 12px;
    color: var(--apagado);
  }

  .item__value {
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
  }

  .item__arrow {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    color: var(--apagado);
  }
`
