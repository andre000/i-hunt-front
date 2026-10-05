/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { useSelector } from 'react-redux'
import { campaignClock } from '../campaign/time'

export function CampaignClock(props) {
  const date = useSelector(state => state.campaign.data.campaign.date)
  const { day, hour } = campaignClock(date)

  return (
    <time {...props} dateTime={date} css={clock} aria-label={`Data da campanha: ${day}, ${hour}`}>
      <span className="clock__dot" aria-hidden="true" />
      {day} · <span className="num">{hour}</span>
    </time>
  )
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

  .clock__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--laranja);
    box-shadow: 0 0 0 4px var(--laranja-fundo);
  }
`
