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

export const Route = createLazyFileRoute('/search/')({
  component: SearchPage,
})

const STATUS_OPTIONS = Object.entries(MISSION_STATUS_LABEL).map(([value, label]) => ({ value, label }))
const RISK_OPTIONS = RISKS.map(risk => ({ value: risk, label: risk }))

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
      <Header />
      <div className="app-body" css={searchBody}>
        <h1>Todas as caças</h1>

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
                      {MISSION_STATUS_LABEL[mission.status]} ● risco {mission.risk}
                      {mission.deadline && ` ● prazo ${relativeToCampaign(mission.deadline, campaignDate)}`}
                    </span>
                  </span>
                  <span className="item__value">{formatBRL(mission.value)}</span>
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
    font-weight: 700;
    color: #777;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .filter__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  button {
    border: 1px solid #ddd;
    background-color: #fff;
    color: #555;
    border-radius: 16px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }

  button[aria-pressed='true'] {
    background-color: #f60;
    border-color: #f60;
    color: #fff;
  }
`

const searchBody = css`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  h1 {
    font-size: 18px;
    font-family: 'Open Sans', sans-serif;
  }

  .search__empty {
    font-size: 14px;
    color: #777;
  }

  .search__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .search__item {
    ${rowButton}
    padding: 16px;
    border: 1px solid #eee;
    border-radius: 16px;
  }

  .item__body {
    ${stackedText}
  }

  .item__name {
    font-weight: 700;
  }

  .item__meta {
    font-size: 12px;
    color: #777;
  }

  .item__value {
    font-weight: 700;
    white-space: nowrap;
  }

  .item__arrow {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    color: #aaa;
  }
`
