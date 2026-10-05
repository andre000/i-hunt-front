/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import PropTypes from 'prop-types'
import { CampaignClock } from './CampaignClock'

export function Header ({ title, ...props }) {
  return (
    <header {...props} css={header}>
      <h1>{title}</h1>
      <CampaignClock />
    </header>
  )
}

Header.propTypes = {
  title: PropTypes.string.isRequired,
}

const header = css`
  flex-shrink: 0;
  padding: calc(14px + env(safe-area-inset-top, 0px)) 16px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--linha);

  h1 {
    font-size: 24px;
    letter-spacing: -0.03em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`
