/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import PropTypes from 'prop-types'
import { MISSION_STATUS_LABEL, RISKS } from '../campaign/missions'

const STATUS_COLOR = {
  available: 'var(--laranja)',
  'in-progress': 'var(--texto)',
  completed: 'var(--ok)',
  failed: 'var(--perigo)',
  expired: 'var(--apagado)',
}

const RISK_TONE = {
  baixo: ['var(--apagado)', 'var(--painel-2)'],
  médio: ['var(--aviso)', 'var(--aviso-fundo)'],
  alto: ['var(--perigo)', 'var(--perigo-fundo)'],
}

export function StatusLabel({ status }) {
  return (
    <span css={statusLabel} style={{ color: STATUS_COLOR[status] }}>
      {MISSION_STATUS_LABEL[status]}
    </span>
  )
}

StatusLabel.propTypes = {
  status: PropTypes.oneOf(Object.keys(MISSION_STATUS_LABEL)).isRequired,
}

export function RiskChip({ risk }) {
  const [color, background] = RISK_TONE[risk]
  return (
    <span css={chip} style={{ color, backgroundColor: background }}>
      Risco {risk}
    </span>
  )
}

RiskChip.propTypes = {
  risk: PropTypes.oneOf(RISKS).isRequired,
}

export function Chip({ children, tone = 'neutral' }) {
  return <span css={chip} className={`chip--${tone}`}>{children}</span>
}

Chip.propTypes = {
  children: PropTypes.node.isRequired,
  tone: PropTypes.oneOf(['neutral', 'live']),
}

const statusLabel = css`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;

  &::before {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background-color: currentColor;
  }
`

const chip = css`
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  white-space: nowrap;
  background-color: var(--painel-2);
  color: var(--apagado);

  &.chip--live {
    background-color: var(--laranja-fundo);
    color: var(--laranja);
  }
`
