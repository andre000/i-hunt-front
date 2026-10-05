/** @jsxImportSource @emotion/react */
import { useEffect, useRef, useState } from 'react'
import { css } from '@emotion/react'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'
import { campaignClock, time } from '../campaign/time'

const ROLL_MS = 1100

function prefersCalm() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? true
}

function useRolledTime(date) {
  const target = time(date)
  const shown = useRef(target)
  const [now, setNow] = useState(target)

  useEffect(() => {
    const from = shown.current
    if (from === target || prefersCalm()) {
      shown.current = target
      setNow(target)
      return undefined
    }
    const start = performance.now()
    let frame = 0
    const step = (at) => {
      const t = Math.min((at - start) / ROLL_MS, 1)
      const eased = 1 - Math.pow(1 - t, 4)
      shown.current = from + (target - from) * eased
      setNow(shown.current)
      if (t < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target])

  return { shownAt: now, rolling: now !== target }
}

export function CampaignClock(props) {
  const date = useSelector(state => state.campaign.data.campaign.date)
  const { shownAt, rolling } = useRolledTime(date)
  const { day, hour } = campaignClock(new Date(shownAt).toISOString())
  const final = campaignClock(date)

  return (
    <time
      {...props}
      dateTime={date}
      css={clock}
      className={[props.className, rolling && 'is-rolling'].filter(Boolean).join(' ')}
      aria-label={`Data da campanha: ${final.day}, ${final.hour}`}
    >
      <span className="clock__dot" aria-hidden="true" />
      {day} · <span className="num">{hour}</span>
    </time>
  )
}

CampaignClock.propTypes = {
  className: PropTypes.string,
}

const clock = css`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  padding: 7px 12px;
  border-radius: 999px;
  background-color: rgb(21 24 29 / 92%);
  border: 1px solid var(--linha);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;

  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &.is-rolling {
    border-color: var(--laranja);
    box-shadow: 0 0 0 4px var(--laranja-fundo);
  }

  &.is-rolling .clock__dot {
    animation: clock-tick 0.18s linear infinite;
  }

  @keyframes clock-tick {
    50% { opacity: 0.3; }
  }

  .clock__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--laranja);
    box-shadow: 0 0 0 4px var(--laranja-fundo);
  }
`
