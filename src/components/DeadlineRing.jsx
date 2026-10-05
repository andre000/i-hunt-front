/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import PropTypes from 'prop-types'
import { deadlineProgress } from '../campaign/missions'
import { timeLeft } from '../campaign/time'

const RADIUS = 27
const LENGTH = 2 * Math.PI * RADIUS

export function DeadlineRing({ mission, campaignDate }) {
  const left = mission.deadline ? timeLeft(mission.deadline, campaignDate) : null
  const progress = deadlineProgress(mission, campaignDate)
  const [big, small] = left ? left.split(' ') : ['—', '']

  return (
    <div css={ring} aria-label={left ? `Prazo: faltam ${left}` : 'Sem prazo'}>
      <svg viewBox="0 0 62 62" aria-hidden="true">
        <circle cx="31" cy="31" r={RADIUS} className="ring__track" />
        {progress !== null && (
          <circle
            cx="31"
            cy="31"
            r={RADIUS}
            className="ring__fill"
            strokeDasharray={LENGTH}
            strokeDashoffset={LENGTH * progress}
          />
        )}
      </svg>
      <span className="ring__label" aria-hidden="true">
        <b className="num">{big}</b>
        {small}
      </span>
    </div>
  )
}

DeadlineRing.propTypes = {
  mission: PropTypes.shape({ deadline: PropTypes.string, postedAt: PropTypes.string }).isRequired,
  campaignDate: PropTypes.string.isRequired,
}

const ring = css`
  position: relative;
  width: 62px;
  height: 62px;
  flex-shrink: 0;

  svg {
    width: 62px;
    height: 62px;
    transform: rotate(-90deg);
  }

  circle {
    fill: none;
    stroke-width: 5;
  }

  .ring__track {
    stroke: var(--linha);
  }

  .ring__fill {
    stroke: var(--laranja);
    stroke-linecap: round;
    transition: stroke-dashoffset 0.9s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .ring__label {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    line-height: 1.1;
    color: var(--apagado);

    b {
      font-size: 15px;
      color: var(--texto);
    }
  }
`
