/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import PropTypes from 'prop-types'
import Logo from './Logo'

export function CampaignStatus({ title, text }) {
  return (
    <main css={campaignStatus}>
      <Logo />
      <h1>{title}</h1>
      {text && <p>{text}</p>}
    </main>
  )
}

CampaignStatus.propTypes = {
  title: PropTypes.string.isRequired,
  text: PropTypes.string,
}

const campaignStatus = css`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
  padding: 24px;
  color: #333;

  h1 {
    font-size: 1.6rem;
    line-height: 1.2;
  }

  p {
    font-size: 14px;
    color: #777;
    line-height: 1.5;
  }
`
